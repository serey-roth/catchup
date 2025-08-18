import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
    CreateSubscriberSchema,
    CreateTopicSchema,
    CreateArticleSchema,
    CreateDeliveryLogSchema,
    type Subscriber,
    type Topic,
    type Article,
    type DeliveryLog,
    SubscriberTopic,
} from './schemas'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_PUBLIC_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

function convertFromDb<T extends Record<string, unknown>>(obj: T): T {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
            letter.toUpperCase()
        )
        converted[camelKey] = value
    }
    return converted as T
}

function convertToDb<T extends Record<string, unknown>>(obj: T): T {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(
            /[A-Z]/g,
            (letter) => `_${letter.toLowerCase()}`
        )
        converted[snakeKey] = value
    }
    return converted as T
}

export async function createSubscriber(
    data: z.infer<typeof CreateSubscriberSchema>
): Promise<Subscriber> {
    const dbData = convertToDb(data)

    const { data: result, error } = await supabase
        .from('subscribers')
        .insert(dbData)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create subscriber: ${error.message}`)
    }

    return convertFromDb(result) as Subscriber
}

export async function getSubscriber(id: string): Promise<Subscriber | null> {
    const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to get subscriber: ${error.message}`)
    }

    return convertFromDb(data) as Subscriber
}

export async function getSubscriberByEmail(
    email: string
): Promise<Subscriber | null> {
    const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', email)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to get subscriber by email: ${error.message}`)
    }

    return convertFromDb(data) as Subscriber
}

export async function updateSubscriber(
    id: string,
    data: Partial<z.infer<typeof CreateSubscriberSchema>>
): Promise<Subscriber> {
    const dbData = convertToDb(data)

    const { data: result, error } = await supabase
        .from('subscribers')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update subscriber: ${error.message}`)
    }

    return convertFromDb(result) as Subscriber
}

export async function deleteSubscriber(id: string): Promise<void> {
    const { error } = await supabase.from('subscribers').delete().eq('id', id)

    if (error) {
        throw new Error(`Failed to delete subscriber: ${error.message}`)
    }
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
    const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to get subscribers: ${error.message}`)
    }

    return data.map(convertFromDb) as Subscriber[]
}

export async function createTopic(
    data: z.infer<typeof CreateTopicSchema>
): Promise<Topic> {
    const dbData = convertToDb(data)

    const { data: result, error } = await supabase
        .from('topics')
        .insert(dbData)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create topic: ${error.message}`)
    }

    return convertFromDb(result) as Topic
}

export async function getTopic(id: string): Promise<Topic | null> {
    const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to get topic: ${error.message}`)
    }

    return convertFromDb(data) as Topic
}

export async function getAllTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        throw new Error(`Failed to get topics: ${error.message}`)
    }

    return data.map(convertFromDb) as Topic[]
}

export async function updateTopic(
    id: string,
    data: Partial<z.infer<typeof CreateTopicSchema>>
): Promise<Topic> {
    const dbData = convertToDb(data)

    const { data: result, error } = await supabase
        .from('topics')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update topic: ${error.message}`)
    }

    return convertFromDb(result) as Topic
}

export async function deleteTopic(id: string): Promise<void> {
    const { error } = await supabase.from('topics').delete().eq('id', id)

    if (error) {
        throw new Error(`Failed to delete topic: ${error.message}`)
    }
}

export async function getAllSubscriberTopics(): Promise<SubscriberTopic[]> {
    const { data, error } = await supabase
        .from('subscriber_topics')
        .select('topic_id, subscriber_id, created_at, topics (id, name)')
        .overrideTypes<
            Array<{
                topic_id: string
                subscriber_id: string
                created_at: Date
                topics: {
                    id: string
                    name: string
                }
            }>,
            { merge: false }
        >()

    if (error) {
        throw new Error(`Failed to get all subscriber topics: ${error.message}`)
    }

    return data.map((item) => ({
        topicId: item.topic_id,
        subscriberId: item.subscriber_id,
        name: item.topics.name,
        createdAt: item.created_at,
    })) as SubscriberTopic[]
}

export async function addSubscriberToTopic(
    subscriberId: string,
    topicId: string
): Promise<void> {
    const { error } = await supabase.from('subscriber_topics').insert({
        subscriber_id: subscriberId,
        topic_id: topicId,
    })

    if (error) {
        throw new Error(`Failed to add subscriber to topic: ${error.message}`)
    }
}

export async function getSubscribersWithTopics(): Promise<
    (Subscriber & { topics: Topic[] })[]
> {
    const { data, error } = await supabase
        .from('subscribers')
        .select(
            '*, subscriber_topics (topic_id, topics (id, name, created_at))'
        )
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(
            `Failed to get subscribers with topics: ${error.message}`
        )
    }

    return data.map((item) => ({
        ...convertFromDb(item),
        topics: item.subscriber_topics.map((st: { topics: Topic }) =>
            convertFromDb(st.topics)
        ),
    })) as (Subscriber & { topics: Topic[] })[]
}

export async function addArticle(
    data: z.infer<typeof CreateArticleSchema>
): Promise<Article> {
    const dbData = convertToDb(data)

    const { data: result, error } = await supabase
        .from('articles')
        .insert(dbData)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create article: ${error.message}`)
    }

    return convertFromDb(result) as Article
}

export async function addArticles(articles: Article[]): Promise<Article[]> {
    const dbData = articles.map(convertToDb)
    const { data, error } = await supabase
        .from('articles')
        .insert(dbData)
        .select()
    if (error) {
        throw new Error(`Failed to add articles: ${error.message}`)
    }
    return data.map(convertFromDb) as Article[]
}

export async function getArticle(id: string): Promise<Article | null> {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to get article: ${error.message}`)
    }

    return convertFromDb(data) as Article
}

export async function getArticleByTitleOrUrl(
    title: string,
    url: string
): Promise<Article | null> {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .or(`title.eq.${title},url.eq.${url}`)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(
            `Failed to get article by title or url: ${error.message}`
        )
    }

    return convertFromDb(data) as Article
}

export async function getArticlesByTitleOrUrl(
    title: string[],
    url: string[]
): Promise<Article[]> {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .or(`title.in.(${title.join(',')}),url.in.(${url.join(',')})`)
        .order('published_date', { ascending: false })

    if (error) {
        throw new Error(`Failed to get articles by title: ${error.message}`)
    }

    return data.map(convertFromDb) as Article[]
}

export async function getAllArticles(): Promise<Article[]> {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_date', { ascending: false })

    if (error) {
        throw new Error(`Failed to get articles: ${error.message}`)
    }

    return data.map(convertFromDb) as Article[]
}

export async function updateArticle(
    id: string,
    data: Partial<z.infer<typeof CreateArticleSchema>>
): Promise<Article> {
    const dbData = convertToDb(data)

    const { data: result, error } = await supabase
        .from('articles')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update article: ${error.message}`)
    }

    return convertFromDb(result) as Article
}

export async function deleteArticle(id: string): Promise<void> {
    const { error } = await supabase.from('articles').delete().eq('id', id)

    if (error) {
        throw new Error(`Failed to delete article: ${error.message}`)
    }
}

export async function logDelivery(
    data: z.infer<typeof CreateDeliveryLogSchema>
): Promise<DeliveryLog> {
    const dbData = convertToDb(data)

    const { data: result, error } = await supabase
        .from('delivery_logs')
        .insert(dbData)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create delivery log: ${error.message}`)
    }

    return convertFromDb(result) as DeliveryLog
}
