import { NextRequest, NextResponse } from 'next/server'
import {
    getArticle,
    updateArticle,
    deleteArticle,
    getArticleByTitleOrUrl,
} from '@/lib/supabase'
import { CreateArticleSchema } from '@/lib/schemas'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const article = await getArticle(id)

        if (!article) {
            return NextResponse.json(
                { success: false, error: 'Article not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: article,
        })
    } catch (error) {
        console.error('Error fetching article:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch article' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const article = await getArticle(id)

        if (!article) {
            return NextResponse.json(
                { success: false, error: 'Article not found' },
                { status: 404 }
            )
        }

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

        const updatedArticle = await updateArticle(id, validatedData)

        return NextResponse.json({
            success: true,
            data: updatedArticle,
        })
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const article = await getArticle(id)

        if (!article) {
            return NextResponse.json(
                { success: false, error: 'Article not found' },
                { status: 404 }
            )
        }

        await deleteArticle(id)

        return NextResponse.json({
            success: true,
            message: 'Article deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting article:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete article' },
            { status: 500 }
        )
    }
}
