import { NextRequest, NextResponse } from 'next/server'
import {
    getSubscriber,
    updateSubscriber,
    deleteSubscriber,
    getSubscriberByEmail,
} from '@/lib/supabase'
import { CreateSubscriberSchema } from '@/lib/schemas'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const subscriber = await getSubscriber(id)

        if (!subscriber) {
            return NextResponse.json(
                { success: false, error: 'Subscriber not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: subscriber,
        })
    } catch (error) {
        console.error('Error fetching subscriber:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch subscriber' },
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
        const subscriber = await getSubscriber(id)

        if (!subscriber) {
            return NextResponse.json(
                { success: false, error: 'Subscriber not found' },
                { status: 404 }
            )
        }

        const body = await request.json()

        const validatedData = CreateSubscriberSchema.parse(body)

        const existingSubscriber = await getSubscriberByEmail(
            validatedData.email
        )
        if (existingSubscriber && existingSubscriber.id !== id) {
            return NextResponse.json(
                { success: false, error: 'Email already subscribed' },
                { status: 400 }
            )
        }

        const updatedSubscriber = await updateSubscriber(id, validatedData)

        return NextResponse.json({
            success: true,
            data: updatedSubscriber,
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
        const subscriber = await getSubscriber(id)

        if (!subscriber) {
            return NextResponse.json(
                { success: false, error: 'Subscriber not found' },
                { status: 404 }
            )
        }

        await deleteSubscriber(id)

        return NextResponse.json({
            success: true,
            message: 'Subscriber deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting subscriber:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete subscriber' },
            { status: 500 }
        )
    }
}
