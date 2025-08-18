import { NextRequest, NextResponse } from 'next/server'
import {
    getAllSubscribers,
    createSubscriber,
    getSubscriberByEmail,
    addSubscriberToTopic,
} from '@/lib/supabase'
import { CreateSubscriberSchema } from '@/lib/schemas'

export async function GET() {
    try {
        const subscriberList = await getAllSubscribers()
        return NextResponse.json({
            success: true,
            data: subscriberList,
            count: subscriberList.length,
        })
    } catch (error) {
        console.error('Error fetching subscribers:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch subscribers' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const validatedData = CreateSubscriberSchema.parse(body)

        const existingSubscriber = await getSubscriberByEmail(
            validatedData.email
        )

        if (existingSubscriber) {
            return NextResponse.json(
                { success: false, error: 'Email already subscribed' },
                { status: 400 }
            )
        }

        const { topicIds, ...subscriberData } = validatedData

        const newSubscriber = await createSubscriber(subscriberData)

        if (topicIds && topicIds.length > 0) {
            for (const topicId of topicIds) {
                await addSubscriberToTopic(newSubscriber.id, topicId)
            }
        }

        return NextResponse.json(
            {
                success: true,
                data: newSubscriber,
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
            { status: 400 }
        )
    }
}
