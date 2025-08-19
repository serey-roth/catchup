import { NextResponse } from 'next/server'
import {
    getArticlesByTitleOrUrl,
    getAllSubscriberTopics,
    getSubscriber,
    addArticles,
} from '@/lib/supabase'
import { createEmailService } from '@/lib/services/email-service'
import { createArticleFetcher } from '@/lib/services/article-fetcher'
import { Article, Topic } from '@/lib/schemas'
import { DateParser } from '@/lib/services/date-parser'

// Batch processing constants
const ARTICLE_FETCH_BATCH_SIZE = 5
const EMAIL_SEND_BATCH_SIZE = 10
const EMAIL_SEND_DELAY_MS = 1000 // 1 second delay between batches

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

export async function POST() {
    const subscriberTopics = await getAllSubscriberTopics()

    const uniqueTopicNames = new Map<string, string>(
        subscriberTopics.map((st) => [st.topicId, st.name])
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

        if (newArticles.length > 0) {
            await processInBatches(newArticles, 50, async (batch) => {
                await addArticles(batch)
                return batch
            })
        }
    } else {
        allArticles = []
    }

    const subscribers = new Map<
        string,
        { topics: Topic[]; articles: Article[] }
    >()

    const topics = new Map<string, Topic>(
        subscriberTopics.map((st) => [
            st.topicId,
            { id: st.topicId, name: st.name, createdAt: st.createdAt },
        ])
    )

    const subscriberTopicsMap = new Map<
        string,
        { topicIds: Set<string>; topics: Topic[] }
    >()

    for (const st of subscriberTopics) {
        if (!subscriberTopicsMap.has(st.subscriberId)) {
            subscriberTopicsMap.set(st.subscriberId, {
                topicIds: new Set(),
                topics: [],
            })
        }
        const subscriberData = subscriberTopicsMap.get(st.subscriberId)!

        if (!subscriberData.topicIds.has(st.topicId)) {
            subscriberData.topicIds.add(st.topicId)
            subscriberData.topics.push({
                id: st.topicId,
                name: st.name,
                createdAt: st.createdAt,
            })
        }
    }

    for (const article of allArticles) {
        const topic = topics.get(article.topicId)
        if (!topic) continue

        for (const [
            subscriberId,
            subscriberData,
        ] of subscriberTopicsMap.entries()) {
            if (subscriberData.topicIds.has(article.topicId)) {
                if (!subscribers.has(subscriberId)) {
                    subscribers.set(subscriberId, {
                        topics: subscriberData.topics,
                        articles: [],
                    })
                }

                const subscriber = subscribers.get(subscriberId)!

                if (!subscriber.articles.some((a) => a.url === article.url)) {
                    subscriber.articles.push(article)
                }
            }
        }
    }

    const emailService = createEmailService()

    try {
        const subscriberEntries = Array.from(subscribers.entries())

        const results = await processInBatches(
            subscriberEntries,
            EMAIL_SEND_BATCH_SIZE,
            async (batch) => {
                return Promise.all(
                    batch.map(async ([subscriberId, { topics, articles }]) => {
                        const subscriber = await getSubscriber(subscriberId)
                        if (!subscriber) {
                            throw new Error(
                                `Subscriber not found: ${subscriberId}`
                            )
                        }
                        const result = await emailService.sendDigest(
                            subscriber,
                            topics,
                            articles
                        )
                        return result
                    })
                )
            },
            EMAIL_SEND_DELAY_MS
        )

        return NextResponse.json({
            success: true,
            results,
        })
    } catch (error) {
        console.error('Failed to send daily digest:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
