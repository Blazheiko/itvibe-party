export interface CalendarEvent {
  id: bigint;
  title: string;
  description?: string | null;
  startTime: string | null;
  endTime: string | null;
  userId: bigint;
  created_at: string | null;
  updated_at: string | null;
}

export interface GetEventsResponse {
  status: 'success' | 'error';
  message?: string;
  data?: CalendarEvent[];
}

export interface CreateEventResponse {
  status: 'success' | 'error';
  message?: string;
  data?: CalendarEvent;
}

export interface GetEventResponse {
  status: 'success' | 'error';
  message?: string;
  data?: CalendarEvent | null;
}

export interface UpdateEventResponse {
  status: 'success' | 'error';
  message?: string;
  data?: CalendarEvent | null;
}

export interface DeleteEventResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface GetEventsByDateResponse {
  status: 'success' | 'error';
  message?: string;
  data?: CalendarEvent[];
}

export interface GetEventsByRangeResponse {
  status: 'success' | 'error';
  message?: string;
  data?: CalendarEvent[];
}
