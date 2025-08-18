import { NextRequest, NextResponse } from 'next/server'
import {
    getTopic,
    updateTopic,
    deleteTopic,
    getAllTopics,
} from '@/lib/supabase'
import { CreateTopicSchema } from '@/lib/schemas'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const topic = await getTopic(id)

        if (!topic) {
            return NextResponse.json(
                { success: false, error: 'Topic not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: topic,
        })
    } catch (error) {
        console.error('Error fetching topic:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch topic' },
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
        const topic = await getTopic(id)

        if (!topic) {
            return NextResponse.json(
                { success: false, error: 'Topic not found' },
                { status: 404 }
            )
        }

        const body = await request.json()

        // Validate input data
        const validatedData = CreateTopicSchema.parse(body)

        // Check if topic name already exists (excluding current topic)
        const existingTopics = await getAllTopics()
        const existingTopic = existingTopics.find(
            (t) =>
                t.name.toLowerCase() === validatedData.name.toLowerCase() &&
                t.id !== id
        )

        if (existingTopic) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Topic with this name already exists',
                },
                { status: 400 }
            )
        }

        // Update topic
        const updatedTopic = await updateTopic(id, validatedData)

        return NextResponse.json({
            success: true,
            data: updatedTopic,
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
        const topic = await getTopic(id)

        if (!topic) {
            return NextResponse.json(
                { success: false, error: 'Topic not found' },
                { status: 404 }
            )
        }

        await deleteTopic(id)

        return NextResponse.json({
            success: true,
            message: 'Topic deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting topic:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete topic' },
            { status: 500 }
        )
    }
}
