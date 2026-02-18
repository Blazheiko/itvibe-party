import { DateTime } from 'luxon';
import type { CalendarRow } from '#app/repositories/calendar-repository.js';

export type SerializedCalendarEvent = Omit<
    CalendarRow,
    'createdAt' | 'updatedAt' | 'startTime' | 'endTime'
> & {
    created_at: string | null;
    updated_at: string | null;
    startTime: string | null;
    endTime: string | null;
};

export const calendarTransformer = {
    serialize(event: CalendarRow): SerializedCalendarEvent {
        const { createdAt, updatedAt, startTime, endTime, ...rest } = event;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            startTime: DateTime.fromJSDate(startTime).toISO(),
            endTime: DateTime.fromJSDate(endTime).toISO(),
        };
    },

    serializeArray(events: CalendarRow[]): SerializedCalendarEvent[] {
        return events.map((e) => calendarTransformer.serialize(e));
    },
};
