// WebsocketBase больше не используется - заменен на useWebSocketConnection
import { useEventBus } from './event-bus'
import { useWebSocketConnection } from '@/composables/useWebSocketConnection'

interface HttpResponse {
    [key: string]: unknown
}

interface ApiResponse<T> {
    data: T | null
    error: { message: string; code: number } | null
}

interface ApiMethods {
    http: <T = HttpResponse>(
        method: string,
        route: string,
        body?: Record<string, unknown>,
    ) => Promise<ApiResponse<T>>
    ws: <T = HttpResponse>(route: string, body?: Record<string, unknown>) => Promise<T | null>
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string

interface RequestInit {
    method: HttpMethod
    headers: Record<string, string>
    body?: string
}
const normalizeUrl = (url: string): string => {
    if (url.endsWith('/')) {
        return url.slice(0, -1)
    }
    return url
}
const BASE_URL = normalizeUrl(import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:5174')

// Старый WebSocketClient больше не используется - используем useWebSocketConnection
const { websocketApi } = useWebSocketConnection()
const eventBus = useEventBus()

const api: ApiMethods = {
    http: async <T = HttpResponse>(
        method: HttpMethod,
        route: string,
        body: Record<string, unknown> = {},
    ): Promise<ApiResponse<T>> => {
        // const BASE_URL = baseUrl
        const init: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        }

        if (method.toLowerCase() !== 'get' && method.toLowerCase() !== 'delete') {
            init.body = JSON.stringify(body)
        }

        try {
            const response = await fetch(`${BASE_URL}${route}`, init)

            if (!response.ok && response.status === 422) {
                console.log('!response.ok && response.status === 422')
                const errorData = await response.json()
                console.log({ errorData })
                return {
                    data: errorData,
                    error: { code: 422, message: String(errorData.message || 'Validation Error') },
                }
            }

            if (!response.ok) {
                console.log('!response.ok')
                if (response.status === 401) {
                    eventBus.emit('unauthorized')
                    return {
                        data: null,
                        error: { code: 401, message: 'Unauthorized' },
                    }
                }
                return {
                    data: null,
                    error: {
                        code: response.status,
                        message: `HTTP error! status: ${response.status}`,
                    },
                }
            }

            const data = await response.json()
            console.log({ data })
            return { data: data as T, error: null }
        } catch (error: unknown) {
            console.error('Network error:', error)
            return {
                data: null,
                error: {
                    code: 0,
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Network error. Please try again later.',
                },
            }
        }
    },

    // setWebSocketClient метод удален - используется useWebSocketConnection

    ws: async <T = HttpResponse>(
        route: string,
        body: Record<string, unknown> = {},
    ): Promise<T | null> => {
        if (!websocketApi) return null

        try {

            // console.log('websocketApi ws route', route)
            // console.log('websocketApi ws body', body)
            const result = await websocketApi(route as string, body)
            console.log({ result })
            return result as unknown as T
        } catch (e) {
            console.error(e)
            return null
        }
    },
}

export default api
