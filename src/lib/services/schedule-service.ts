import { Subscriber, Topic } from '@/lib/schemas'

interface IScheduleService {
    isSubscriberDue(subscriber: Subscriber & { topics: Topic[] }): boolean
    getDueSubscribers(
        subscribers: Array<Subscriber & { topics: Topic[] }>
    ): Array<Subscriber & { topics: Topic[] }>
    getNextRunTime(subscriber: Subscriber): Date
}

export class ScheduleService implements IScheduleService {
    isSubscriberDue(subscriber: Subscriber & { topics: Topic[] }): boolean {
        if (subscriber.topics.length === 0) {
            return false
        }

        const now = new Date()
        const lastSent = subscriber.lastSent

        if (!lastSent) {
            return true
        }

        const timeSinceLastSent = now.getTime() - new Date(lastSent).getTime()
        const hoursSinceLastSent = timeSinceLastSent / (1000 * 60 * 60)

        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()
        const isLeapYear =
            currentYear % 4 === 0 &&
            (currentYear % 100 !== 0 || currentYear % 400 === 0)
        const daysInMonth =
            currentMonth === 2 && isLeapYear
                ? 29
                : currentMonth === 2
                  ? 28
                  : [4, 6, 9, 11].includes(currentMonth)
                    ? 30
                    : 31

        switch (subscriber.deliverySchedule) {
            case 'daily':
                return hoursSinceLastSent >= 24

            case 'weekly':
                return hoursSinceLastSent >= 168

            case 'monthly':
                return hoursSinceLastSent >= daysInMonth * 24

            default:
                return false
        }
    }

    getPreferredSendTime(subscriber: Subscriber): Date {
        if (subscriber.preferredSendTime) {
            return subscriber.preferredSendTime
        }

        const defaultTime = new Date()
        defaultTime.setUTCHours(17, 0, 0, 0)
        return defaultTime
    }

    isRightTimeToSend(subscriber: Subscriber): boolean {
        const now = new Date()
        const preferredTime = this.getPreferredSendTime(subscriber)

        const currentHour = now.getHours()
        const preferredHour = preferredTime.getHours()

        return Math.abs(currentHour - preferredHour) <= 1
    }

    getDueSubscribers(
        subscribers: Array<Subscriber & { topics: Topic[] }>
    ): Array<Subscriber & { topics: Topic[] }> {
        return subscribers.filter(
            (subscriber) =>
                this.isSubscriberDue(subscriber) &&
                this.isRightTimeToSend(subscriber)
        )
    }

    getNextRunTime(subscriber: Subscriber): Date {
        const now = new Date()
        const lastSent = subscriber.lastSent || now
        const preferredTime = this.getPreferredSendTime(subscriber)

        const nextRun = new Date(lastSent)

        switch (subscriber.deliverySchedule) {
            case 'daily':
                nextRun.setDate(nextRun.getDate() + 1)
                break
            case 'weekly':
                nextRun.setDate(nextRun.getDate() + 7)
                break
            case 'monthly':
                nextRun.setMonth(nextRun.getMonth() + 1)
                break
        }

        nextRun.setHours(
            preferredTime.getHours(),
            preferredTime.getMinutes(),
            0,
            0
        )

        return nextRun
    }
}
