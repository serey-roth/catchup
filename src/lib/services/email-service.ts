import { Resend } from 'resend'
import { Subscriber, Article, Topic } from '@/lib/schemas'
import { DigestHtmlRenderer } from './digest-html-renderer'

const resend = new Resend(process.env.RESEND_API_KEY)

interface IEmailService {
    sendDigest(
        subscriber: Subscriber,
        topics: Topic[],
        articles: Article[]
    ): Promise<{ success: boolean; messageId?: string; error?: string }>
}

export class EmailService implements IEmailService {
    private fromEmail: string
    private digestHtmlRenderer: DigestHtmlRenderer

    constructor() {
        this.fromEmail = process.env.SENDER_EMAIL || 'noreply@usecatchup.xyz'
        this.digestHtmlRenderer = new DigestHtmlRenderer()
    }

    private getDateRange(): {
        start: Date
        end: Date
        dateRange: string
    } {
        const end = new Date()
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
        const formatDate = (d: Date) =>
            d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
        const dateRange = `${formatDate(start)} - ${formatDate(end)}`
        return { start, end, dateRange }
    }

    async sendDigest(
        subscriber: Subscriber,
        topics: Topic[],
        articles: Article[]
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const { dateRange } = this.getDateRange()

            const subject = `catchup on your topics (${dateRange})`

            const { data, error } = await resend.emails.send({
                from: this.fromEmail,
                to: subscriber.email,
                subject,
                html: this.digestHtmlRenderer.render(topics, articles),
                text: this.generateDigestText(topics, articles),
            })

            if (error) {
                throw new Error(`Resend error: ${error.message}`)
            }

            return { success: true, messageId: data?.id }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            return { success: false, error: errorMessage }
        }
    }

    private generateDigestText(topics: Topic[], articles: Article[]): string {
        const { dateRange } = this.getDateRange()
        const articlesByTopic = new Map<string, Article[]>(
            topics.map((topic) => [topic.id, []])
        )

        articles.forEach((article) => {
            const topicArticles = articlesByTopic.get(article.topicId)
            if (topicArticles) {
                topicArticles.push(article)
            }
        })

        let digestText = `catchup — your last 24h updates (${dateRange})\n\n`

        if (articles.length > 0) {
            topics.forEach((topic) => {
                const topicArticles = articlesByTopic.get(topic.id) || []
                if (topicArticles.length > 0) {
                    digestText += `📢 ${topic.name}\n`
                    topicArticles.forEach((article) => {
                        digestText += `📄 ${article.title}\n`
                        digestText += `  ${article.url}\n`
                        if (article.snippet) {
                            digestText += `  ${article.snippet}\n\n`
                        }
                    })
                    digestText += `\n\n`
                }
            })
        } else {
            digestText += `📭 Looks like you're all caught up — no new updates for now.
Check back later for fresh stories.\n\n`
        }

        digestText += `You're receiving this email because you subscribed to catchup.\nManage preferences or unsubscribe anytime.`

        return digestText
    }
}

export function createEmailService(): EmailService {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable is required')
    }

    return new EmailService()
}
