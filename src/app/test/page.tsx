'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Subscriber, Topic, Article } from '@/lib/schemas'

type TabType =
    | 'overview'
    | 'subscribers'
    | 'topics'
    | 'articles'
    | 'fetch-articles'
    | 'email'

export default function TestPage() {
    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [subscribers, setSubscribers] = useState<Subscriber[]>([])
    const [topics, setTopics] = useState<Topic[]>([])
    const [articles, setArticles] = useState<Article[]>([])

    const [showCreateForm, setShowCreateForm] = useState<
        'subscriber' | 'topic' | 'article' | null
    >(null)

    const [subscriberForm, setSubscriberForm] = useState({
        subscriberEmail: '',
        subscriberName: '',
        topicNames: [''],
        plan: 'free' as 'free' | 'pro',
        deliverySchedule: 'daily' as 'daily' | 'weekly' | 'monthly',
        isAdmin: false,
    })

    const [topicForm, setTopicForm] = useState({ name: '' })

    const [articleForm, setArticleForm] = useState({
        title: '',
        snippet: '',
        tldr: '',
        url: '',
        domain: '',
        source: '',
        topicId: '',
        publishedDate: new Date().toISOString().split('T')[0],
    })

    const [fetchArticlesForm, setFetchArticlesForm] = useState({
        topicId: '',
        maxResults: 5,
    })
    const [fetchingArticles, setFetchingArticles] = useState(false)
    const [fetchResults, setFetchResults] = useState<{
        success: boolean
        message: string
        topic: string
        newArticles: Array<{
            title: string
            snippet: string
            url: string
            domain: string
            source: string
            publishedDate: string
        }>
        articles: Array<{
            title: string
            snippet: string
            url: string
            domain: string
            source: string
            publishedDate: string
        }>
    } | null>(null)

    const [sendingDailyDigest, setSendingDailyDigest] = useState(false)
    const [dailyDigestResults, setDailyDigestResults] = useState<
        | {
              success: boolean
              message: string
              messageId?: string
          }[]
        | null
    >(null)

    const fetchTestData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            await Promise.all([
                fetchSubscribers(),
                fetchTopics(),
                fetchArticles(),
            ])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchSubscribers = async () => {
        try {
            const response = await fetch('/api/subscribers')
            if (!response.ok) throw new Error('Failed to fetch subscribers')
            const data = await response.json()
            setSubscribers(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const fetchTopics = async () => {
        try {
            const response = await fetch('/api/topics')
            if (!response.ok) throw new Error('Failed to fetch topics')
            const data = await response.json()
            setTopics(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const fetchArticles = async () => {
        try {
            const response = await fetch('/api/articles')
            if (!response.ok) throw new Error('Failed to fetch articles')
            const data = await response.json()
            setArticles(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleSubscriberSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (
            !subscriberForm.subscriberEmail ||
            !subscriberForm.subscriberName ||
            !subscriberForm.topicNames[0]
        ) {
            setError('Please fill in all required fields')
            return
        }

        try {
            const topicIds: string[] = []
            for (const topicName of subscriberForm.topicNames) {
                if (topicName.trim()) {
                    const topicResponse = await fetch('/api/topics', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: topicName.trim() }),
                    })
                    if (!topicResponse.ok)
                        throw new Error(`Failed to create topic: ${topicName}`)
                    const topicData = await topicResponse.json()
                    topicIds.push(topicData.data.id)
                }
            }

            const subscriberResponse = await fetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: subscriberForm.subscriberEmail,
                    name: subscriberForm.subscriberName,
                    topicIds: topicIds,
                    plan: subscriberForm.plan,
                    deliverySchedule: subscriberForm.deliverySchedule,
                    isAdmin: subscriberForm.isAdmin,
                }),
            })
            if (!subscriberResponse.ok)
                throw new Error('Failed to create subscriber')

            await Promise.all([fetchSubscribers(), fetchTopics()])
            resetSubscriberForm()
            setShowCreateForm(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleTopicSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!topicForm.name.trim()) {
            setError('Topic name is required')
            return
        }

        try {
            const response = await fetch('/api/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: topicForm.name.trim() }),
            })
            if (!response.ok) throw new Error('Failed to create topic')

            await fetchTopics()
            setTopicForm({ name: '' })
            setShowCreateForm(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleArticleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!articleForm.title || !articleForm.url || !articleForm.topicId) {
            setError('Title, URL, and Topic are required')
            return
        }

        try {
            const articleData = {
                ...articleForm,
                normalizedTitle: articleForm.title.toLowerCase().trim(),
                normalizedUrl: articleForm.url.toLowerCase().trim(),
            }

            const response = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(articleData),
            })
            if (!response.ok) throw new Error('Failed to create article')

            await fetchArticles()
            resetArticleForm()
            setShowCreateForm(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const resetSubscriberForm = () => {
        setSubscriberForm({
            subscriberEmail: '',
            subscriberName: '',
            topicNames: [''],
            plan: 'free',
            deliverySchedule: 'daily',
            isAdmin: false,
        })
    }

    const resetArticleForm = () => {
        setArticleForm({
            title: '',
            snippet: '',
            tldr: '',
            url: '',
            domain: '',
            source: '',
            topicId: '',
            publishedDate: new Date().toISOString().split('T')[0],
        })
    }

    const addTopicField = () => {
        setSubscriberForm((prev) => ({
            ...prev,
            topicNames: [...prev.topicNames, ''],
        }))
    }

    const removeTopicField = (index: number) => {
        setSubscriberForm((prev) => ({
            ...prev,
            topicNames: prev.topicNames.filter((_, i) => i !== index),
        }))
    }

    const updateTopicField = (index: number, value: string) => {
        setSubscriberForm((prev) => ({
            ...prev,
            topicNames: prev.topicNames.map((name, i) =>
                i === index ? value : name
            ),
        }))
    }

    const deleteSubscriber = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subscriber?')) return
        try {
            const response = await fetch(`/api/subscribers/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete subscriber')
            await fetchSubscribers()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const deleteTopic = async (id: string) => {
        if (!confirm('Are you sure you want to delete this topic?')) return
        try {
            const response = await fetch(`/api/topics/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete topic')
            await fetchTopics()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const deleteArticle = async (id: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return
        try {
            const response = await fetch(`/api/articles/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete article')
            await fetchArticles()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const fetchLatestArticles = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fetchArticlesForm.topicId) {
            setError('Please select a topic')
            return
        }

        setFetchingArticles(true)
        setError(null)
        try {
            const response = await fetch('/api/test/fetch-articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topicId: fetchArticlesForm.topicId,
                    maxResults: fetchArticlesForm.maxResults,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch articles')
            }

            const data = await response.json()
            setFetchResults(data)

            await fetchArticles()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setFetchingArticles(false)
        }
    }

    const sendDailyDigest = async (e: React.FormEvent) => {
        e.preventDefault()
        setSendingDailyDigest(true)
        setError(null)
        try {
            const response = await fetch('/api/test/send-digest', {
                method: 'POST',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(
                    errorData.error || 'Failed to send daily digest'
                )
            }

            const data = await response.json()
            setDailyDigestResults(data.results || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setSendingDailyDigest(false)
        }
    }

    useEffect(() => {
        fetchTestData()
    }, [fetchTestData])

    const getTopicName = (topicId: string) => {
        return topics.find((t) => t.id === topicId)?.name || 'Unknown Topic'
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'subscribers', label: 'Subscribers', icon: '👥' },
        { id: 'topics', label: 'Topics', icon: '🏷️' },
        { id: 'articles', label: 'Articles', icon: '📰' },
        { id: 'fetch-articles', label: 'Fetch Articles', icon: '🔍' },
        { id: 'email', label: 'Email', icon: '📧' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <Link
                                href="/"
                                className="text-xl font-bold text-gray-900 hover:text-gray-700"
                            >
                                ← Back to CatchUp
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">
                                API Test Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={fetchTestData}
                            disabled={loading}
                            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="mr-2 text-red-400">⚠️</span>
                                {error}
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-400 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() =>
                                        setActiveTab(tab.id as TabType)
                                    }
                                    className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                            <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-blue-100 p-2">
                                        <span className="text-2xl">👥</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Total Subscribers
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {subscribers.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-100 p-2">
                                        <span className="text-2xl">🏷️</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Total Topics
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {topics.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-purple-100 p-2">
                                        <span className="text-2xl">📰</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Total Articles
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {articles.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-yellow-100 p-2">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            API Status
                                        </p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ✅ Active
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-lg bg-white p-6 shadow">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Recent Subscribers
                                </h3>
                                <div className="space-y-3">
                                    {subscribers
                                        .slice(0, 5)
                                        .map((subscriber) => (
                                            <div
                                                key={subscriber.id}
                                                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {subscriber.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {subscriber.email}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs ${
                                                        subscriber.plan ===
                                                        'pro'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {subscriber.plan}
                                                </span>
                                            </div>
                                        ))}
                                    {subscribers.length === 0 && (
                                        <p className="py-4 text-center text-gray-500">
                                            No subscribers yet
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg bg-white p-6 shadow">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Recent Articles
                                </h3>
                                <div className="space-y-3">
                                    {articles.slice(0, 5).map((article) => (
                                        <div
                                            key={article.id}
                                            className="rounded-lg bg-gray-50 p-3"
                                        >
                                            <h4 className="line-clamp-2 text-sm font-medium text-gray-900">
                                                {article.title}
                                            </h4>
                                            <p className="mt-1 text-xs text-gray-600">
                                                {article.domain}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {getTopicName(article.topicId)}
                                            </p>
                                        </div>
                                    ))}
                                    {articles.length === 0 && (
                                        <p className="py-4 text-center text-gray-500">
                                            No articles yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subscribers' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Subscribers
                            </h2>
                            <button
                                onClick={() => setShowCreateForm('subscriber')}
                                className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                            >
                                ➕ Add Subscriber
                            </button>
                        </div>

                        {showCreateForm === 'subscriber' && (
                            <div className="rounded-lg border-2 border-green-200 bg-white p-6 shadow">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Create New Subscriber
                                </h3>
                                <form
                                    onSubmit={handleSubscriberSubmit}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <input
                                            type="email"
                                            placeholder="Subscriber Email *"
                                            value={
                                                subscriberForm.subscriberEmail
                                            }
                                            onChange={(e) =>
                                                setSubscriberForm({
                                                    ...subscriberForm,
                                                    subscriberEmail:
                                                        e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Subscriber Name *"
                                            value={
                                                subscriberForm.subscriberName
                                            }
                                            onChange={(e) =>
                                                setSubscriberForm({
                                                    ...subscriberForm,
                                                    subscriberName:
                                                        e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Topics
                                        </label>
                                        {subscriberForm.topicNames.map(
                                            (topicName, index) => (
                                                <div
                                                    key={index}
                                                    className="mb-2 flex items-center space-x-2"
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder={`Topic ${index + 1} Name`}
                                                        value={topicName}
                                                        onChange={(e) =>
                                                            updateTopicField(
                                                                index,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                                        required={index === 0}
                                                    />
                                                    {subscriberForm.topicNames
                                                        .length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeTopicField(
                                                                    index
                                                                )
                                                            }
                                                            className="p-2 text-red-600 hover:text-red-800"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        )}
                                        <button
                                            type="button"
                                            onClick={addTopicField}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            ➕ Add Another Topic
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <select
                                            value={subscriberForm.plan}
                                            onChange={(e) =>
                                                setSubscriberForm({
                                                    ...subscriberForm,
                                                    plan: e.target.value as
                                                        | 'free'
                                                        | 'pro',
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="free">
                                                Free Plan
                                            </option>
                                            <option value="pro">
                                                Pro Plan
                                            </option>
                                        </select>
                                        <select
                                            value={
                                                subscriberForm.deliverySchedule
                                            }
                                            onChange={(e) =>
                                                setSubscriberForm({
                                                    ...subscriberForm,
                                                    deliverySchedule: e.target
                                                        .value as
                                                        | 'daily'
                                                        | 'weekly'
                                                        | 'monthly',
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">
                                                Weekly
                                            </option>
                                            <option value="monthly">
                                                Monthly
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={subscriberForm.isAdmin}
                                                onChange={(e) =>
                                                    setSubscriberForm({
                                                        ...subscriberForm,
                                                        isAdmin:
                                                            e.target.checked,
                                                    })
                                                }
                                                className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            />
                                            Is Admin
                                        </label>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                        >
                                            Create Subscriber
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(null)
                                                resetSubscriberForm()
                                            }}
                                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Plan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Schedule
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Preferred Send Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Admin
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {subscribers.map((subscriber) => (
                                            <tr
                                                key={subscriber.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                                    {subscriber.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {subscriber.email}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs ${
                                                            subscriber.plan ===
                                                            'pro'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {subscriber.plan}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {
                                                        subscriber.deliverySchedule
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {subscriber.preferredSendTime ? (
                                                        <span className="flex items-center gap-2 text-gray-500">
                                                            {' '}
                                                            {new Date(
                                                                subscriber.preferredSendTime
                                                            ).toLocaleTimeString()}{' '}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">
                                                            9am{' '}
                                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-400">
                                                                default
                                                            </span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {subscriber.isAdmin
                                                        ? 'Yes'
                                                        : 'No'}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    <button
                                                        onClick={() =>
                                                            deleteSubscriber(
                                                                subscriber.id
                                                            )
                                                        }
                                                        className="text-red-600 transition-colors hover:text-red-900"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'topics' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Topics
                            </h2>
                            <button
                                onClick={() => setShowCreateForm('topic')}
                                className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                            >
                                ➕ Add Topic
                            </button>
                        </div>

                        {showCreateForm === 'topic' && (
                            <div className="rounded-lg border-2 border-green-200 bg-white p-6 shadow">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Create New Topic
                                </h3>
                                <form
                                    onSubmit={handleTopicSubmit}
                                    className="space-y-4"
                                >
                                    <div className="max-w-md">
                                        <input
                                            type="text"
                                            placeholder="Topic Name *"
                                            value={topicForm.name}
                                            onChange={(e) =>
                                                setTopicForm({
                                                    ...topicForm,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                        >
                                            Create Topic
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(null)
                                                setTopicForm({ name: '' })
                                            }}
                                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {topics.map((topic) => (
                                <div
                                    key={topic.id}
                                    className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {topic.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                ID: {topic.id.slice(0, 8)}...
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Created:{' '}
                                                {new Date(
                                                    topic.createdAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                deleteTopic(topic.id)
                                            }
                                            className="p-2 text-red-600 transition-colors hover:text-red-900"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'articles' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Articles
                            </h2>
                            <button
                                onClick={() => setShowCreateForm('article')}
                                className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                            >
                                ➕ Add Article
                            </button>
                        </div>

                        {showCreateForm === 'article' && (
                            <div className="rounded-lg border-2 border-green-200 bg-white p-6 shadow">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Create New Article
                                </h3>
                                <form
                                    onSubmit={handleArticleSubmit}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <input
                                            type="text"
                                            placeholder="Article Title *"
                                            value={articleForm.title}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    title: e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                        <input
                                            type="url"
                                            placeholder="Article URL *"
                                            value={articleForm.url}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    url: e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Domain"
                                            value={articleForm.domain}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    domain: e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Source"
                                            value={articleForm.source}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    source: e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                        />
                                        <select
                                            value={articleForm.topicId}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    topicId: e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                            required
                                        >
                                            <option value="">
                                                Select Topic *
                                            </option>
                                            {topics.map((topic) => (
                                                <option
                                                    key={topic.id}
                                                    value={topic.id}
                                                >
                                                    {topic.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="date"
                                            value={articleForm.publishedDate}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    publishedDate:
                                                        e.target.value,
                                                })
                                            }
                                            className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <textarea
                                            placeholder="Article Snippet"
                                            value={articleForm.snippet}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    snippet: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <textarea
                                            placeholder="TL;DR Summary"
                                            value={articleForm.tldr}
                                            onChange={(e) =>
                                                setArticleForm({
                                                    ...articleForm,
                                                    tldr: e.target.value,
                                                })
                                            }
                                            rows={2}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                        >
                                            Create Article
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(null)
                                                resetArticleForm()
                                            }}
                                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {articles.map((article) => (
                                <div
                                    key={article.id}
                                    className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">
                                                {article.title}
                                            </h3>
                                            <a
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mb-2 max-w-full truncate text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                {article.url}
                                            </a>
                                            <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                                                {article.snippet}
                                            </p>
                                            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                                                <span>🌐 {article.domain}</span>
                                                <span>📰 {article.source}</span>
                                                <span>
                                                    🏷️{' '}
                                                    {getTopicName(
                                                        article.topicId
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-400">
                                                Published:{' '}
                                                {new Date(
                                                    article.publishedDate
                                                ).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                ID: {article.id.slice(0, 8)}...
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                deleteArticle(article.id)
                                            }
                                            className="ml-4 p-2 text-red-600 transition-colors hover:text-red-900"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'fetch-articles' && (
                    <div className="space-y-6">
                        <div className="rounded-lg border-2 border-blue-200 bg-white p-6 shadow">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Fetch Latest Articles
                            </h3>
                            <form
                                onSubmit={fetchLatestArticles}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <select
                                        value={fetchArticlesForm.topicId}
                                        onChange={(e) =>
                                            setFetchArticlesForm({
                                                ...fetchArticlesForm,
                                                topicId: e.target.value,
                                            })
                                        }
                                        className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Topic *</option>
                                        {topics.map((topic) => (
                                            <option
                                                key={topic.id}
                                                value={topic.id}
                                            >
                                                {topic.name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Max Results"
                                        value={fetchArticlesForm.maxResults}
                                        onChange={(e) =>
                                            setFetchArticlesForm({
                                                ...fetchArticlesForm,
                                                maxResults:
                                                    parseInt(e.target.value) ||
                                                    5,
                                            })
                                        }
                                        min="1"
                                        max="20"
                                        className="rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={
                                        fetchingArticles ||
                                        !fetchArticlesForm.topicId
                                    }
                                    className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {fetchingArticles
                                        ? '🔍 Fetching...'
                                        : '🔍 Fetch Articles'}
                                </button>
                            </form>
                        </div>

                        {fetchResults && (
                            <div className="rounded-lg border-2 border-green-200 bg-white p-6 shadow">
                                <h3 className="mb-4 text-lg font-semibold text-green-900">
                                    ✅ Fetch Results
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="rounded-lg bg-green-50 p-4">
                                            <p className="text-sm font-medium text-green-600">
                                                Topic
                                            </p>
                                            <p className="text-lg font-semibold text-green-900">
                                                {fetchResults.topic}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 p-4">
                                            <p className="text-sm font-medium text-blue-600">
                                                Articles Fetched
                                            </p>
                                            <p className="text-lg font-semibold text-blue-900">
                                                {fetchResults.articles
                                                    ?.length || 0}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-purple-50 p-4">
                                            <p className="text-sm font-medium text-purple-600">
                                                Status
                                            </p>
                                            <p className="text-lg font-semibold text-purple-900">
                                                Success
                                            </p>
                                        </div>
                                    </div>

                                    {fetchResults.articles &&
                                        fetchResults.articles.length > 0 && (
                                            <div>
                                                <h4 className="text-md mb-3 font-medium text-gray-900">
                                                    Fetched Articles:
                                                </h4>
                                                <div className="space-y-3">
                                                    {fetchResults.articles.map(
                                                        (
                                                            article,
                                                            index: number
                                                        ) => (
                                                            <div
                                                                key={index}
                                                                className="rounded-lg bg-gray-50 p-4"
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <h5 className="font-medium text-gray-900">
                                                                            {
                                                                                article.title
                                                                            }
                                                                        </h5>
                                                                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                                                            {
                                                                                article.snippet
                                                                            }
                                                                        </p>
                                                                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                                            <span>
                                                                                🌐{' '}
                                                                                {
                                                                                    article.domain
                                                                                }
                                                                            </span>
                                                                            <span>
                                                                                📰{' '}
                                                                                {
                                                                                    article.source
                                                                                }
                                                                            </span>
                                                                            <span>
                                                                                📅{' '}
                                                                                {new Date(
                                                                                    article.publishedDate
                                                                                ).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <a
                                                                            href={
                                                                                article.url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800"
                                                                        >
                                                                            🔗
                                                                            View
                                                                            Article
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg bg-white p-6 shadow">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Recent Articles (Click to Delete)
                            </h3>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {articles.slice(0, 10).map((article) => (
                                    <div
                                        key={article.id}
                                        className="rounded-lg border border-gray-200 p-4 transition-all hover:border-red-300 hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="line-clamp-2 text-sm font-medium text-gray-900">
                                                    {article.title}
                                                </h4>
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mb-2 max-w-full truncate text-xs text-blue-600 hover:text-blue-800"
                                                >
                                                    {article.url}
                                                </a>
                                                <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                                    {article.snippet}
                                                </p>
                                                <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                                                    <span>
                                                        🌐 {article.domain}
                                                    </span>
                                                    <span>
                                                        🏷️{' '}
                                                        {getTopicName(
                                                            article.topicId
                                                        )}
                                                    </span>
                                                    <span>
                                                        📅{' '}
                                                        {new Date(
                                                            article.publishedDate
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    deleteArticle(article.id)
                                                }
                                                className="ml-3 rounded-full p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                                                title="Delete Article"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {articles.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-gray-500">
                                        No articles found. Fetch some articles
                                        above!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="space-y-6">
                        <div className="rounded-lg border-2 border-orange-200 bg-white p-6 shadow">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Send Daily Digest
                            </h3>
                            <form
                                onSubmit={sendDailyDigest}
                                className="space-y-4"
                            >
                                <button
                                    type="submit"
                                    disabled={sendingDailyDigest}
                                    className="rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {sendingDailyDigest
                                        ? '📰 Sending Digest...'
                                        : '📰 Send Daily Digest'}
                                </button>
                            </form>
                        </div>

                        {dailyDigestResults && (
                            <div className="rounded-lg border-2 border-green-200 bg-white p-6 shadow">
                                <h3 className="mb-4 text-lg font-semibold text-green-900">
                                    ✅ Daily Digest Results
                                </h3>
                                {dailyDigestResults.map((result, index) => (
                                    <div key={index}>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="rounded-lg bg-green-50 p-4">
                                                    <p className="text-sm font-medium text-green-600">
                                                        Status
                                                    </p>
                                                    <p className="text-lg font-semibold text-green-900">
                                                        {result.success
                                                            ? 'Success'
                                                            : 'Failed'}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-blue-50 p-4">
                                                    <p className="text-sm font-medium text-blue-600">
                                                        Due Subscribers
                                                    </p>
                                                    <p className="text-lg font-semibold text-blue-900">
                                                        {result.messageId ||
                                                            'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="rounded-lg bg-gray-50 p-4">
                                                <p className="text-sm font-medium text-gray-600">
                                                    Message
                                                </p>
                                                <p className="text-gray-900">
                                                    {result.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
