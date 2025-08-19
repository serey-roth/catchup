import { NextResponse } from 'next/server'
import {
    updateSubscriber,
    logDelivery,
    getSubscribersWithTopics,
} from '@/lib/supabase'
import { ScheduleService } from '@/lib/services/schedule-service'
import {
    getArticlesByTitleOrUrl,
    addArticles,
} from '@/lib/supabase'
import { createEmailService } from '@/lib/services/email-service'
import { createArticleFetcher } from '@/lib/services/article-fetcher'
import { Article, Subscriber, Topic } from '@/lib/schemas'
import { DateParser } from '@/lib/services/date-parser'

// Batch processing constants
const ARTICLE_FETCH_BATCH_SIZE = 5
const EMAIL_SEND_BATCH_SIZE = 10
const EMAIL_SEND_DELAY_MS = 1000 // 1 second delay between batches
const MAX_EXECUTION_TIME_MS = 8 * 60 * 1000 // 8 minutes (Vercel limit is 10 minutes)

// Helper function to process arrays in batches
async function processInBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>,
    delayMs: number = 0
): Promise<R[]> {
    const results: R[] = []

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchResults = await processor(batch)
        results.push(...batchResults)

        // Add delay between batches if specified
        if (delayMs > 0 && i + batchSize < items.length) {
            await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
    }

    return results
}

export async function GET() {
    const startTime = Date.now()

    try {
        console.log('Starting scheduled digest job...')

        const allSubscribers = await getSubscribersWithTopics()
        console.log(`Found ${allSubscribers.length} total subscribers`)

        const scheduleService = new ScheduleService()

        const dueSubscribers = scheduleService.getDueSubscribers(allSubscribers)
        console.log(`${dueSubscribers.length} subscribers are due for digest`)

        if (dueSubscribers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No subscribers due for digest',
                dueSubscribers: 0,
                executionTime: Date.now() - startTime,
            })
        }

        const scheduleInfo = dueSubscribers.map((subscriber) => {
            const isDue = scheduleService.isSubscriberDue(subscriber)
            const isRightTime = scheduleService.isRightTimeToSend(subscriber)
            const nextRun = scheduleService.getNextRunTime(subscriber)
            const preferredTime =
                scheduleService.getPreferredSendTime(subscriber)

            return {
                id: subscriber.id,
                email: subscriber.email,
                name: subscriber.name,
                deliverySchedule: subscriber.deliverySchedule,
                lastSent: subscriber.lastSent,
                preferredSendTime: subscriber.preferredSendTime,
                topicsCount: subscriber.topics.length,
                isDue,
                isRightTime,
                shouldSend: isDue && isRightTime,
                nextRunTime: nextRun,
                defaultPreferredTime: preferredTime,
            }
        })

        // Check if we're approaching timeout
        if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
            console.warn('Approaching execution time limit, stopping early')
            return NextResponse.json({
                success: true,
                message: 'Stopped early due to time constraints',
                totalSubscribers: allSubscribers.length,
                dueSubscribers: dueSubscribers.length,
                executionTime: Date.now() - startTime,
            })
        }

        const subscriberTopics = dueSubscribers
            .map((s) => s.topics.map((t) => ({ ...t, subscriberId: s.id })))
            .flat()

        const uniqueTopicNames = new Map<string, string>(
            subscriberTopics.map((t) => [t.id, t.name])
        )

        const articleFetcher = createArticleFetcher()

        // Process article fetching in batches
        const topicEntries = Array.from(uniqueTopicNames.entries())
        const articles = await processInBatches(
            topicEntries,
            ARTICLE_FETCH_BATCH_SIZE,
            async (batch) => {
                return Promise.all(
                    batch.map(([topicId, topicName]) =>
                        articleFetcher
                            .fetchTopicArticles(topicName, topicId, 10)
                            .then((articles) =>
                                articles
                                    .filter((a) => {
                                        const timeDiff =
                                            DateParser.getTimeDiffFromNow(
                                                a.publishedDate
                                            )
                                        return timeDiff.diffHours <= 24
                                    })
                                    .sort(
                                        (a, b) =>
                                            b.publishedDate.getTime() -
                                            a.publishedDate.getTime()
                                    )
                                    .slice(0, 3)
                            )
                    )
                )
            }
        )

        const flattenedArticles = articles.flat()

        let allArticles: Article[] = []

        if (flattenedArticles.length > 0) {
            const existingArticles = await getArticlesByTitleOrUrl(
                flattenedArticles.map((a) => a.title),
                flattenedArticles.map((a) => a.url)
            )
            const dedupedArticles = flattenedArticles.filter(
                (a) =>
                    !existingArticles.some(
                        (ea) => ea.title === a.title && ea.url === a.url
                    )
            )

            const newArticles = dedupedArticles.map((article) => ({
                ...article,
                id: crypto.randomUUID(),
                createdAt: new Date(),
            }))

            allArticles = [...existingArticles, ...newArticles] as Article[]

            // Store articles in batches
            if (newArticles.length > 0) {
                await processInBatches(
                    newArticles,
                    50, // Store 50 articles at a time
                    async (batch) => {
                        await addArticles(batch)
                        return batch
                    }
                )
            }
        } else {
            allArticles = []
        }

        const subscriberWithTopicsAndArticles = new Map<
            string,
            Subscriber & { topics: Topic[]; articles: Article[] }
        >()

        for (const subscriber of dueSubscribers) {
            subscriberWithTopicsAndArticles.set(subscriber.id, {
                ...subscriber,
                topics: subscriber.topics,
                articles: [],
            })
        }

        const topicSubscriberId = new Map<string, string>(
            subscriberTopics.map((st) => [st.id, st.subscriberId])
        )

        // Process articles and assign to subscribers
        for (const article of allArticles) {
            const subscriberId = topicSubscriberId.get(article.topicId)
            if (!subscriberId) continue

            const subscriber = subscriberWithTopicsAndArticles.get(subscriberId)!
            if (!subscriber) continue

            if (!subscriber.articles.some((a) => a.id === article.id)) {
                subscriber.articles.push(article)
            }
        }

        const emailService = createEmailService()
        const emailResults = []

        try {
            // Send emails in batches with delays to avoid rate limiting
            const subscriberEntries = Array.from(subscriberWithTopicsAndArticles.entries())

            const results = await processInBatches(
                subscriberEntries,
                EMAIL_SEND_BATCH_SIZE,
                async (batch) => {
                    return Promise.all(
                        batch.map(
                            async ([subscriberId, subscriber]) => {
                                const result = await emailService.sendDigest(
                                    subscriber,
                                    subscriber.topics,
                                    subscriber.articles
                                )

                                if (result.success) {
                                    await updateSubscriber(subscriberId, {
                                        lastSent: new Date(),
                                    })

                                    await logDelivery({
                                        subscriberId,
                                        sentDate: new Date(),
                                        articlesSent: subscriber.articles.map((a) => a.id),
                                        success: true,
                                    })

                                    console.log(
                                        `Successfully sent digest to ${subscriber.email}`
                                    )
                                } else {
                                    await logDelivery({
                                        subscriberId,
                                        sentDate: new Date(),
                                        articlesSent: [],
                                        success: false,
                                    }).catch((logError) =>
                                        console.error(
                                            'Failed to log delivery:',
                                            logError
                                        )
                                    )

                                    console.error(
                                        `Failed to send digest to ${subscriber.email}:`,
                                        result.error
                                    )
                                }

                                return {
                                    subscriberId,
                                    email: subscriber.email,
                                    ...result,
                                }
                            }
                        )
                    )
                },
                EMAIL_SEND_DELAY_MS
            )

            emailResults.push(...results)
        } catch (error) {
            console.error('Failed to send daily digest:', error)
            return NextResponse.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    executionTime: Date.now() - startTime,
                },
                { status: 500 }
            )
        }

        const successCount = emailResults.filter((r) => r.success).length
        const failureCount = emailResults.length - successCount
        const executionTime = Date.now() - startTime

        console.log(
            `Schedule digest job completed: ${successCount} successful, ${failureCount} failed, ${executionTime}ms`
        )

        return NextResponse.json({
            success: true,
            totalSubscribers: allSubscribers.length,
            dueSubscribers: dueSubscribers.length,
            successful: successCount,
            failed: failureCount,
            executionTime,
            scheduleInfo,
            emailResults: emailResults.slice(0, 10), // Only return first 10 to avoid large responses
        })
    } catch (error) {
        const executionTime = Date.now() - startTime
        console.error('Schedule digest job failed:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime,
            },
            { status: 500 }
        )
    }
}
