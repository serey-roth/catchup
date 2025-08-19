/**
 * Date parser for relative time strings from Serper AI
 * Handles formats like "4 hours ago", "2 days ago", "1 week ago", etc.
 * Supports multiple languages
 */

export class DateParser {
    // English time patterns
    private static englishPatterns = [
        // "X hours ago", "X hour ago"
        { regex: /(\d+)\s*(?:hour|hr)s?\s*ago/i, multiplier: 60 * 60 * 1000 },
        // "X minutes ago", "X minute ago"
        { regex: /(\d+)\s*(?:minute|min)s?\s*ago/i, multiplier: 60 * 1000 },
        // "X days ago", "X day ago"
        {
            regex: /(\d+)\s*(?:day|d)s?\s*ago/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        // "X weeks ago", "X week ago"
        {
            regex: /(\d+)\s*(?:week|w)s?\s*ago/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        // "X months ago", "X month ago"
        {
            regex: /(\d+)\s*(?:month|mo)s?\s*ago/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        // "X years ago", "X year ago"
        {
            regex: /(\d+)\s*(?:year|yr)s?\s*ago/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
        // "X seconds ago", "X second ago"
        { regex: /(\d+)\s*(?:second|sec)s?\s*ago/i, multiplier: 1000 },
    ]

    private static spanishPatterns = [
        {
            regex: /hace\s*(\d+)\s*(?:hora|hr)s?/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /hace\s*(\d+)\s*(?:minuto|min)s?/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /hace\s*(\d+)\s*(?:día|d)s?/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /hace\s*(\d+)\s*(?:semana|sem)s?/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /hace\s*(\d+)\s*(?:mes|mes)s?/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /hace\s*(\d+)\s*(?:año|años)s?/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
        // Also support "atrás" format
        {
            regex: /(\d+)\s*(?:hora|hr)s?\s*atrás/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:minuto|min)s?\s*atrás/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:día|d)s?\s*atrás/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:semana|sem)s?\s*atrás/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:mes|mes)s?\s*atrás/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:año|años)s?\s*atrás/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
    ]

    private static frenchPatterns = [
        {
            regex: /(?:il y a|depuis)\s*(\d+)\s*(?:heure|h)s?/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(?:il y a|depuis)\s*(\d+)\s*(?:minute|min)s?/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(?:il y a|depuis)\s*(\d+)\s*(?:jour|j)s?/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:il y a|depuis)\s*(\d+)\s*(?:semaine|sem)s?/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:il y a|depuis)\s*(\d+)\s*(?:mois)s?/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:il y a|depuis)\s*(\d+)\s*(?:année|an)s?/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
        // Also support reverse order
        {
            regex: /(\d+)\s*(?:heure|h)s?\s*(?:il y a|depuis)/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:minute|min)s?\s*(?:il y a|depuis)/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:jour|j)s?\s*(?:il y a|depuis)/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:semaine|sem)s?\s*(?:il y a|depuis)/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:mois)s?\s*(?:il y a|depuis)/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:année|an)s?\s*(?:il y a|depuis)/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
    ]

    private static germanPatterns = [
        {
            regex: /(?:vor|her)\s*(\d+)\s*(?:stunde|std)s?/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(?:vor|her)\s*(\d+)\s*(?:minute|min)s?/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(?:vor|her)\s*(\d+)\s*(?:tag|t)s?/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:vor|her)\s*(\d+)\s*(?:woche|w)s?/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:vor|her)\s*(\d+)\s*(?:monat|mon)s?/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:jahr|j)s?\s*(?:vor|her)/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
        // Also support reverse order
        {
            regex: /(\d+)\s*(?:stunde|std)s?\s*(?:vor|her)/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:minute|min)s?\s*(?:vor|her)/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:tag|t)s?\s*(?:vor|her)/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:woche|w)s?\s*(?:vor|her)/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:monat|mon)s?\s*(?:vor|her)/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
    ]

    private static portuguesePatterns = [
        {
            regex: /(?:há|atrás)\s*(\d+)\s*(?:hora|hr)s?/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(?:há|atrás)\s*(\d+)\s*(?:minuto|min)s?/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(?:há|atrás)\s*(\d+)\s*(?:dia|d)s?/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:há|atrás)\s*(\d+)\s*(?:semana|sem)s?/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:há|atrás)\s*(\d+)\s*(?:mês|mes)s?/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:há|atrás)\s*(\d+)\s*(?:ano|anos)s?/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
        // Also support reverse order
        {
            regex: /(\d+)\s*(?:hora|hr)s?\s*(?:atrás|há)/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:minuto|min)s?\s*(?:atrás|há)/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:dia|d)s?\s*(?:atrás|há)/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:semana|sem)s?\s*(?:atrás|há)/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:mês|mes)s?\s*(?:atrás|há)/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:ano|anos)s?\s*(?:atrás|há)/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
    ]

    private static italianPatterns = [
        {
            regex: /(?:fa|indietro)\s*(\d+)\s*(?:ora|ore)s?/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(?:fa|indietro)\s*(\d+)\s*(?:minuto|minuti)s?/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(?:fa|indietro)\s*(\d+)\s*(?:giorno|giorni)s?/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:fa|indietro)\s*(\d+)\s*(?:settimana|settimane)s?/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:fa|indietro)\s*(\d+)\s*(?:mese|mesi)s?/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(?:fa|indietro)\s*(\d+)\s*(?:anno|anni)s?/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
        // Also support reverse order
        {
            regex: /(\d+)\s*(?:ora|ore)s?\s*(?:fa|indietro)/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:minuto|minuti)s?\s*(?:fa|indietro)/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:giorno|giorni)s?\s*(?:fa|indietro)/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:settimana|settimane)s?\s*(?:fa|indietro)/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:mese|mesi)s?\s*(?:fa|indietro)/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:anno|anni)s?\s*(?:fa|indietro)/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
    ]

    private static allPatterns = [
        ...this.englishPatterns,
        ...this.spanishPatterns,
        ...this.frenchPatterns,
        ...this.germanPatterns,
        ...this.portuguesePatterns,
        ...this.italianPatterns,
        // Additional common patterns
        {
            regex: /(\d+)\s*(?:hr|hour)s?\s*ago/i,
            multiplier: 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:min|minute)s?\s*ago/i,
            multiplier: 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:d|day)s?\s*ago/i,
            multiplier: 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:w|week)s?\s*ago/i,
            multiplier: 7 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:mo|month)s?\s*ago/i,
            multiplier: 30 * 24 * 60 * 60 * 1000,
        },
        {
            regex: /(\d+)\s*(?:y|year)s?\s*ago/i,
            multiplier: 365 * 24 * 60 * 60 * 1000,
        },
    ]

    /**
     * Parse a relative time string into a Date object
     */
    static parseRelativeTime(timeString: string): Date {
        if (!timeString || typeof timeString !== 'string') {
            return new Date()
        }

        const absoluteDate = this.parseAbsoluteDate(timeString)
        if (absoluteDate) {
            return absoluteDate
        }

        const relativeDate = this.parseRelativeTimeString(timeString)
        if (relativeDate) {
            return relativeDate
        }

        console.warn(
            `Could not parse date string: "${timeString}", using current date`
        )
        return new Date()
    }

    /**
     * Try to parse as absolute date (ISO, RFC, etc.)
     */
    private static parseAbsoluteDate(timeString: string): Date | null {
        try {
            // Try ISO format
            if (timeString.includes('T') || timeString.includes('Z')) {
                const date = new Date(timeString)
                if (!isNaN(date.getTime())) {
                    return date
                }
            }

            // Multi-language month abbreviation mapping
            const monthMappings = {
                // English
                en: {
                    jan: 0,
                    feb: 1,
                    mar: 2,
                    apr: 3,
                    may: 4,
                    jun: 5,
                    jul: 6,
                    aug: 7,
                    sep: 8,
                    oct: 9,
                    nov: 10,
                    dec: 11,
                },
                // Spanish
                es: {
                    ene: 0,
                    feb: 1,
                    mar: 2,
                    abr: 3,
                    may: 4,
                    jun: 5,
                    jul: 6,
                    ago: 7,
                    sep: 8,
                    oct: 9,
                    nov: 10,
                    dic: 11,
                },
                // French
                fr: {
                    jan: 0,
                    fév: 1,
                    mar: 2,
                    avr: 3,
                    mai: 4,
                    juin: 5,
                    juil: 6,
                    août: 7,
                    sept: 8,
                    oct: 9,
                    nov: 10,
                    déc: 11,
                },
                // German
                de: {
                    jan: 0,
                    feb: 1,
                    mär: 2,
                    apr: 3,
                    mai: 4,
                    jun: 5,
                    jul: 6,
                    aug: 7,
                    sep: 8,
                    okt: 9,
                    nov: 10,
                    dez: 11,
                },
                // Portuguese
                pt: {
                    jan: 0,
                    fev: 1,
                    mar: 2,
                    abr: 3,
                    mai: 4,
                    jun: 5,
                    jul: 6,
                    ago: 7,
                    set: 8,
                    out: 9,
                    nov: 10,
                    dez: 11,
                },
                // Italian
                it: {
                    gen: 0,
                    feb: 1,
                    mar: 2,
                    apr: 3,
                    mag: 4,
                    giu: 5,
                    lug: 6,
                    ago: 7,
                    set: 8,
                    ott: 9,
                    nov: 10,
                    dic: 11,
                },
            }

            // Try multi-language date format like "28 ene 2025", "11 dic 2024", "15 jan 2025", etc.
            const dateMatch = timeString.match(/(\d+)\s+(\w{3,})\s+(\d{4})/i)
            if (dateMatch) {
                const day = parseInt(dateMatch[1])
                const monthStr = dateMatch[2].toLowerCase()
                const year = parseInt(dateMatch[3])

                // Try to find the month in any language mapping
                let month: number | undefined
                for (const langMapping of Object.values(monthMappings)) {
                    if (monthStr in langMapping) {
                        month =
                            langMapping[monthStr as keyof typeof langMapping]
                        break
                    }
                }

                if (month !== undefined) {
                    const date = new Date(year, month, day)
                    if (!isNaN(date.getTime())) {
                        return date
                    }
                }
            }

            // Try RFC format
            const date = new Date(timeString)
            if (!isNaN(date.getTime())) {
                return date
            }

            return null
        } catch {
            return null
        }
    }

    /**
     * Parse relative time string like "4 hours ago"
     */
    private static parseRelativeTimeString(timeString: string): Date | null {
        const trimmed = timeString.trim().toLowerCase()

        for (const pattern of this.allPatterns) {
            const match = trimmed.match(pattern.regex)
            if (match) {
                const value = parseInt(match[1], 10)
                if (!isNaN(value)) {
                    const millisecondsAgo = value * pattern.multiplier
                    const now = new Date()
                    return new Date(now.getTime() - millisecondsAgo)
                }
            }
        }

        return null
    }

    /**
     * Get human-readable time difference
     */
    static getTimeDiffFromNow(date: Date): {
        diffDays: number
        diffHours: number
        diffMinutes: number
        diffSeconds: number
    } {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffSeconds = Math.floor(diffMs / 1000)
        const diffMinutes = Math.floor(diffSeconds / 60)
        const diffHours = Math.floor(diffMinutes / 60)
        const diffDays = Math.floor(diffHours / 24)
        return {
            diffDays,
            diffHours,
            diffMinutes,
            diffSeconds,
        }
    }

    /**
     * Check if a string looks like a relative time
     */
    static isRelativeTime(timeString: string): boolean {
        if (!timeString || typeof timeString !== 'string') {
            return false
        }

        const trimmed = timeString.trim().toLowerCase()

        // Check if it contains common relative time indicators
        const relativeIndicators = [
            'ago',
            'atrás',
            'hace',
            'il y a',
            'depuis',
            'vor',
            'her',
            'há',
            'fa',
            'indietro',
        ]

        return relativeIndicators.some((indicator) =>
            trimmed.includes(indicator)
        )
    }

    /**
     * Get supported languages
     */
    static getSupportedLanguages(): string[] {
        return [
            'English',
            'Spanish',
            'French',
            'German',
            'Portuguese',
            'Italian',
        ]
    }
}
