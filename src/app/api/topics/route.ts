import { NextRequest, NextResponse } from 'next/server'
import { getAllTopics, createTopic } from '@/lib/supabase'
import { CreateTopicSchema } from '@/lib/schemas'

export async function GET() {
    try {
        const topicList = await getAllTopics()
        return NextResponse.json({
            success: true,
            data: topicList,
            count: topicList.length,
        })
    } catch (error) {
        console.error('Error fetching topics:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch topics' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const validatedData = CreateTopicSchema.parse(body)

        const existingTopics = await getAllTopics()
        const existingTopic = existingTopics.find(
            (t) => t.name.toLowerCase() === validatedData.name.toLowerCase()
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

        const newTopic = await createTopic(validatedData)

        return NextResponse.json(
            {
                success: true,
                data: newTopic,
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
