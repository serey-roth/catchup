import { NextRequest, NextResponse } from 'next/server'
import {
    getAllArticles,
    addArticle,
    getArticleByTitleOrUrl,
} from '@/lib/supabase'
import { CreateArticleSchema } from '@/lib/schemas'

export async function GET() {
    try {
        const articleList = await getAllArticles()
        return NextResponse.json({
            success: true,
            data: articleList,
            count: articleList.length,
        })
    } catch (error) {
        console.error('Error fetching articles:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch articles' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const validatedData = CreateArticleSchema.parse(body)

        const existingArticle = await getArticleByTitleOrUrl(
            validatedData.title,
            validatedData.url
        )

        if (existingArticle) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Article with this URL already exists',
                },
                { status: 400 }
            )
        }

        const newArticle = await addArticle(validatedData)

        return NextResponse.json(
            {
                success: true,
                data: newArticle,
            },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, error: 'Invalid request data' },
            { status: 500 }
        )
    }
}
