import { z } from 'zod'

export const SubscriberSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().min(1),
    createdAt: z.date(),
    isAdmin: z.boolean().default(false),
    plan: z.enum(['free', 'pro']),
    lastSent: z.date().optional(),
    deliverySchedule: z.enum(['daily', 'weekly', 'monthly']),
    preferredSendTime: z.date().optional(),
})

export const TopicSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    createdAt: z.date(),
})

export const SubscriberTopicSchema = z.object({
    topicId: z.string(),
    subscriberId: z.string(),
    name: z.string().min(1),
    createdAt: z.date(),
})

export const ArticleSchema = z.object({
    id: z.string(),
    topicId: z.string(),
    title: z.string().min(1),
    normalizedTitle: z.string().min(1),
    snippet: z.string().min(10),
    url: z.string().url(),
    normalizedUrl: z.string().url(),
    domain: z.string().min(1),
    source: z.string().min(1),
    publishedDate: z.date(),
    createdAt: z.date(),
})

export const DeliveryLogSchema = z.object({
    id: z.string(),
    subscriberId: z.string(),
    sentDate: z.date(),
    articlesSent: z.array(z.string()),
    success: z.boolean(),
})

export const SearchArticleResultSchema = z.object({
    title: z.string(),
    link: z.string().url(),
    snippet: z.string(),
    date: z.string().optional(),
})

export const SearchArticleResponseSchema = z.object({
    organic: z.array(SearchArticleResultSchema),
})

export const ProcessedSearchArticleSchema = z.object({
    title: z.string(),
    topicId: z.string(),
    normalizedTitle: z.string(),
    snippet: z.string(),
    url: z.string().url(),
    normalizedUrl: z.string(),
    domain: z.string(),
    source: z.string(),
    publishedDate: z.date(),
})

export type Subscriber = z.infer<typeof SubscriberSchema>
export type Topic = z.infer<typeof TopicSchema>
export type SubscriberTopic = z.infer<typeof SubscriberTopicSchema>
export type Article = z.infer<typeof ArticleSchema>
export type DeliveryLog = z.infer<typeof DeliveryLogSchema>

export type SearchArticleResult = z.infer<typeof SearchArticleResultSchema>
export type SearchArticleResponse = z.infer<typeof SearchArticleResponseSchema>
export type ProcessedSearchArticle = z.infer<
    typeof ProcessedSearchArticleSchema
>

export const CreateSubscriberSchema = SubscriberSchema.omit({
    id: true,
    createdAt: true,
}).extend({
    topicIds: z.array(z.string().min(1)).optional(),
})

export const CreateTopicSchema = TopicSchema.omit({
    id: true,
    createdAt: true,
})

export const CreateArticleSchema = ArticleSchema.omit({
    id: true,
    createdAt: true,
})

export const CreateDeliveryLogSchema = DeliveryLogSchema.omit({
    id: true,
})
