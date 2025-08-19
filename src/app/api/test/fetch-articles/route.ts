import { NextResponse } from 'next/server'
import { createArticleFetcher } from '@/lib/services/article-fetcher'
import {
    addArticles,
    getAllTopics,
    getArticlesByTitleOrUrl,
} from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const { topicId, maxResults } = await request.json()

        const topics = await getAllTopics()
        const topic = topics.find((t) => t.id === topicId)

        if (!topic) {
            return NextResponse.json(
                { success: false, error: 'Topic not found' },
                { status: 404 }
            )
        }

        const articleFetcher = createArticleFetcher()

        const articles = await articleFetcher.fetchTopicArticles(
            topic.name,
            topic.id,
            maxResults
        )

        if (articles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No new articles found for this topic',
                topic: topic.name,
                articles: [],
            })
        }

        const existingArticles = await getArticlesByTitleOrUrl(
            articles.map((a) => a.title),
            articles.map((a) => a.url)
        )
        const dedupedArticles = articles.filter(
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

        addArticles(newArticles).catch((error) => {
            console.error('Failed to store articles:', error)
        })

        return NextResponse.json({
            success: true,
            message: `Successfully fetched and stored ${newArticles.length} articles`,
            topic: topic.name,
            articles: articles.map((a) => ({
                title: a.title,
                snippet: a.snippet,
                url: a.url,
                domain: a.domain,
                source: a.source,
                publishedDate: a.publishedDate,
            })),
        })
    } catch (error) {
        console.error('Article fetching test error:', error)
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
            },
            { status: 500 }
        )
    }
}
