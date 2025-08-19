import type { FC } from 'react'
import { motion } from 'framer-motion'

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
}

const slideInLeft = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] },
}

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.2,
        },
    },
}

interface EmailItem {
    url: string
    title: string
    source: string
    snippet: string
    hours: number
}

const EmailPreview: FC = () => {
    const items: EmailItem[] = [
        {
            url: 'https://example.com/et-tech-jobs',
            title: 'US computer science degrees from top universities are leaving graduates jobless: Why is top coding education failing?',
            source: 'The Economic Times',
            snippet:
                'The once-reliable path to high-paying tech jobs via a computer science degree is facing challenges. AI advancements and industry layoffs contribute to...',
            hours: 6,
        },
        {
            url: 'https://example.com/ibs-ai-chips',
            title: 'AMD and Nvidia to Divert 15% of China Chip Sales to US',
            source: 'International Business Times UK',
            snippet:
                "The agreement-covering Nvidia's H20 and AMD's MI308 AI chips-is a precondition for obtaining export licenses, according to multiple officials.",
            hours: 6,
        },
        {
            url: 'https://example.com/msn-new-grads',
            title: "'Gaslit' and ghosted: New tech grads face AI-driven hurdles in search for jobs",
            source: 'MSN',
            snippet:
                "Learning to code and working hard hasn't been quite enough to land the coveted tech jobs and six-figure starting salaries that computer science graduates...",
            hours: 8,
        },
    ]

    const formatHours = (hours: number): string => {
        return hours > 0 ? ` • ⏱️ ${hours}h ago` : ''
    }

    return (
        <div className="bg-gray-50 p-4">
            <div className="mx-auto max-w-[680px] rounded-xl bg-white font-sans">
                <div className="p-6">
                    <div className="text-lg font-extrabold tracking-wide text-gray-900 lowercase">
                        catchup
                    </div>
                    <div className="mt-2 text-sm text-gray-600 opacity-90">
                        your latest updates on topics you care about
                    </div>
                    <div className="my-4 h-px bg-gray-200" />

                    <div className="my-6 text-base font-bold text-gray-900">
                        📢 US layoffs for software engineer
                    </div>

                    {items.map((item, index) => (
                        <div key={index} className="py-3">
                            <a
                                className="block text-sm font-semibold text-blue-700 hover:text-blue-800"
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                📄 {item.title}
                            </a>
                            <div className="mt-1 text-xs text-gray-500">
                                {item.source}
                                {formatHours(item.hours)}
                            </div>
                            {item.snippet && (
                                <p className="mt-1.5 text-sm text-gray-700">
                                    {item.snippet}
                                </p>
                            )}
                            {index < items.length - 1 && (
                                <div className="my-3 h-px bg-gray-100" />
                            )}
                        </div>
                    ))}

                    <div className="pt-4 text-center text-xs text-gray-500">
                        You're receiving this email because you subscribed to
                        catchup.
                    </div>
                </div>
            </div>
        </div>
    )
}

interface HowItWorksStep {
    step: string
    title: string
    description: string
}

interface PricingPlan {
    name: string
    price: string
    description: string
    features: string[]
    ctaText: string
    ctaHref: string
    popular?: boolean
}

const LandingPage: FC = () => {
    const howItWorksSteps: HowItWorksStep[] = [
        {
            step: '1',
            title: 'Pick your topics',
            description:
                "Tell us the subjects you care about most - whether it's tech, sports, fashion, local events, or something else entirely.",
        },
        {
            step: '2',
            title: 'We find the best articles',
            description:
                'We search the web for the latest and most relevant articles on your topics.',
        },
        {
            step: '3',
            title: 'Get curated links daily',
            description:
                'Receive one clean email with the best article links, delivered when you want them.',
        },
    ]

    const pricingPlans: PricingPlan[] = [
        {
            name: 'Free',
            price: '$0',
            description: 'Good for trying things out.',
            features: [
                '1 topic of your choice',
                '1 article per day',
                'Weekday delivery at 9 AM',
            ],
            ctaText: 'Start now',
            ctaHref: 'https://tally.so/r/YOUR_TALLY_FORM_ID?plan=free',
        },
        {
            name: 'Pro',
            price: '$4',
            description: 'For folks who want more.',
            features: [
                'Up to 3 topics',
                'More articles per topic',
                'Flexible delivery schedule',
            ],
            ctaText: 'Start Pro',
            ctaHref: '#',
            popular: true,
        },
    ]

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <motion.header
                className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <a href="#" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black font-bold text-white">
                            c
                        </div>
                        <span className="text-xl font-semibold tracking-tight">
                            catchup
                        </span>
                    </a>
                    <nav className="hidden items-center gap-6 text-sm md:flex">
                        <a
                            href="#how"
                            className="transition-colors hover:text-black"
                        >
                            How it works
                        </a>
                        <a
                            href="#pricing"
                            className="transition-colors hover:text-black"
                        >
                            Pricing
                        </a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <a
                            href="#pricing"
                            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
                        >
                            Get started
                        </a>
                    </div>
                </div>
            </motion.header>

            <section className="relative">
                <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                    >
                        <motion.h1
                            variants={slideInLeft}
                            className="text-4xl leading-tight font-extrabold tracking-tight md:text-6xl"
                        >
                            Your last 24h,{' '}
                            <motion.span
                                className="underline decoration-yellow-300 decoration-4 underline-offset-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                            >
                                curated
                            </motion.span>
                            .
                        </motion.h1>
                        <motion.p
                            variants={fadeInUp}
                            className="mt-5 text-lg text-gray-600"
                        >
                            Pick your topics and we'll deliver the latest
                            updates straight to your inbox.
                        </motion.p>
                        <motion.div
                            variants={fadeInUp}
                            className="mt-8 flex flex-col gap-3 sm:flex-row"
                        >
                            <a
                                href="#how"
                                className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 font-medium text-white transition-all duration-300 hover:opacity-90 hover:shadow-md"
                            >
                                Learn more
                            </a>
                            <a
                                href="#pricing"
                                className="inline-flex items-center justify-center rounded-xl border px-5 py-3 font-medium transition-all duration-300 hover:bg-gray-50 hover:shadow-sm"
                            >
                                See pricing
                            </a>
                        </motion.div>
                        <motion.p
                            variants={fadeInUp}
                            className="mt-4 text-xs text-gray-500"
                        >
                            No spam. Cancel anytime.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.3 }}
                        whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        className="relative overflow-hidden rounded-2xl border bg-white shadow-sm"
                    >
                        <EmailPreview />
                    </motion.div>
                </div>
            </section>

            <section id="how" className="border-t bg-gray-50">
                <div className="mx-auto max-w-6xl px-4 py-20">
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        className="mx-auto mb-12 max-w-2xl text-center"
                    >
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                            How it works
                        </h2>
                        <p className="mt-3 text-gray-600">
                            Here's how we keep you in the loop with topics you
                            care about.
                        </p>
                    </motion.div>
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        className="grid gap-8 md:grid-cols-3"
                    >
                        {howItWorksSteps.map((step) => (
                            <motion.div
                                key={step.step}
                                variants={fadeInUp}
                                whileHover="hover"
                                className="rounded-2xl border bg-white p-6"
                            >
                                <div className="flex size-8 items-center justify-center rounded-xl bg-black font-semibold text-white">
                                    {step.step}
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section id="pricing" className="border-t bg-gray-50">
                <div className="mx-auto max-w-6xl px-4 py-20">
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Choose Your Plan
                        </h2>
                        <p className="mt-3 text-gray-600">
                            Start free now. Upgrade to Pro if you want more
                            topics.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        className="mt-10 grid gap-6 md:grid-cols-2"
                    >
                        {pricingPlans.map((plan) => (
                            <motion.div
                                key={plan.name}
                                variants={fadeInUp}
                                whileHover="hover"
                                className="relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6"
                            >
                                {plan.popular && (
                                    <motion.span
                                        className="absolute top-4 right-4 rounded-full bg-black px-2 py-1 text-xs text-white"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                        }}
                                    >
                                        Popular
                                    </motion.span>
                                )}
                                <h3 className="text-xl font-semibold">
                                    {plan.name}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    {plan.description}
                                </p>
                                <div className="mt-4 text-4xl font-bold tracking-tight">
                                    {plan.price}
                                    {plan.name === 'Pro' && (
                                        <span className="align-top text-base">
                                            /mo
                                        </span>
                                    )}
                                </div>
                                <ul className="mt-6 space-y-2 text-sm text-gray-700">
                                    {plan.features.map((feature, index) => (
                                        <li key={index}>• {feature}</li>
                                    ))}
                                </ul>
                                <div className="mt-6">
                                    {plan.name === 'Free' ? (
                                        <>
                                            <a
                                                href={plan.ctaHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 font-medium transition-all duration-300 hover:bg-gray-50"
                                            >
                                                {plan.ctaText}
                                            </a>
                                            <p className="mt-2 text-center text-xs text-gray-500">
                                                We'll send your first catchup
                                                within 24h.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="grid gap-2">
                                            <a
                                                href={plan.ctaHref}
                                                data-ls-checkout="STORE_ID:PRODUCT_ID"
                                                data-ls-success-url="https://tally.so/r/YOUR_TALLY_FORM_ID?plan=pro"
                                                className="lemonsqueezy-button inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2 font-medium text-white transition-all duration-300 hover:opacity-90"
                                            >
                                                {plan.ctaText}
                                            </a>
                                            <span className="text-center text-[11px] text-gray-500">
                                                Secure payment • You'll be
                                                redirected to set up your topics
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="border-t bg-white">
                <div className="mx-auto max-w-4xl px-4 py-20 text-center">
                    <motion.h2
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
                    >
                        What matters to you, delivered daily
                    </motion.h2>
                    <motion.p
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mb-8 max-w-2xl text-lg text-gray-600"
                    >
                        Skip the scrolling. Get curated links to the best
                        articles on your topics.
                    </motion.p>
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-center"
                    >
                        <a
                            href="#pricing"
                            className="inline-flex items-center justify-center rounded-xl bg-black px-8 py-4 text-lg font-medium text-white transition-all duration-300 hover:opacity-90 hover:shadow-md"
                        >
                            Start now
                        </a>
                    </motion.div>
                    <motion.p
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 text-sm text-gray-500"
                    >
                        No credit card required • Cancel anytime • First catchup
                        within 24 hours
                    </motion.p>
                </div>
            </section>

            <motion.footer
                className="border-t bg-gray-50"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-gray-600 md:flex-row">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black text-xs font-bold text-white">
                            c
                        </div>
                        <span>catchup</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a
                            href="mailto:hello@usecatchup.xyz"
                            className="transition-colors hover:text-black"
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </motion.footer>
        </div>
    )
}

export default LandingPage
