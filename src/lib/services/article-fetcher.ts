import {
    SearchArticleResult,
    ProcessedSearchArticle,
    SearchArticleResponseSchema,
    ProcessedSearchArticleSchema,
} from '@/lib/schemas'
import { DateParser } from './date-parser'

export class ArticleFetcher {
    private apiKey: string
    private baseUrl = 'https://google.serper.dev/search'

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    async fetchTopicArticles(
        topicName: string,
        topicId: string,
        maxResults: number = 10
    ): Promise<ProcessedSearchArticle[]> {
        try {
            console.log(`Fetching articles for topic: ${topicName}`)

            const searchQuery = `Latest news articles about ${topicName} in the last 24 hours`

            const searchResults = await this.callSerper(searchQuery, maxResults)

            const processedArticles = searchResults.map((result) =>
                this.processArticle(result, topicId)
            )

            console.log(
                `Found ${processedArticles.length} new articles for topic: ${topicName}`
            )

            return processedArticles
        } catch (error) {
            console.error(
                `Failed to fetch articles for topic ${topicName}:`,
                error
            )
            return []
        }
    }

    private async callSerper(
        query: string,
        maxResults: number
    ): Promise<SearchArticleResult[]> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: query,
                    num: Math.min(maxResults * 2, 10),
                    gl: 'us', // Geographic location
                    hl: 'en', // Language,
                    tbs: 'qdr:d', // Last 24 hours
                }),
            })

            if (!response.ok) {
                throw new Error(
                    `Serper API error: ${response.status} ${response.statusText}`
                )
            }

            const rawData = await response.json()

            const responseData =
                await SearchArticleResponseSchema.safeParseAsync(rawData)

            if (!responseData.success) {
                throw new Error(
                    `Invalid response from Serper API: ${JSON.stringify(responseData.error)}`
                )
            }

            const results: SearchArticleResult[] = []

            if (responseData.data.organic) {
                results.push(...responseData.data.organic)
            }

            return results.slice(0, maxResults)
        } catch (error) {
            console.error('Serper API search failed:', error)
            throw error
        }
    }

    private processArticle(
        result: SearchArticleResult,
        topicId: string
    ): ProcessedSearchArticle {
        const domain = this.extractDomain(result.link)
        const publishedDate = this.parseDate(result.date)

        const processedArticle = {
            title: result.title,
            topicId,
            normalizedTitle: result.title
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ''),
            snippet: result.snippet,
            url: result.link,
            normalizedUrl: result.link.toLowerCase(),
            domain,
            source: domain,
            publishedDate,
        }

        return ProcessedSearchArticleSchema.parse(processedArticle)
    }

    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace('www.', '')
        } catch {
            return 'unknown'
        }
    }

    private parseDate(dateString?: string): Date {
        if (!dateString) {
            return new Date()
        }

        try {
            const parsedDate = DateParser.parseRelativeTime(dateString)

            if (DateParser.isRelativeTime(dateString)) {
                console.log(
                    `📅 Parsed relative time: "${dateString}" → ${parsedDate.toISOString()}`
                )
            }

            return parsedDate
        } catch {
            console.warn(
                `⚠️ Failed to parse date: "${dateString}", using current date`
            )
            return new Date()
        }
    }
}

export function createArticleFetcher(): ArticleFetcher {
    const apiKey = process.env.SERPER_API_KEY

    if (!apiKey) {
        throw new Error('SERPER_API_KEY environment variable is required')
    }

    return new ArticleFetcher(apiKey)
}
