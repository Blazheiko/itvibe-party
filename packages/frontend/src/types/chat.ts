export interface ApiMessage {
    id: string
    content: string
    createdAt: string
    senderId: string
    receiverId: string
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO'
    src?: string | null
    taskId?: string | null
    calendarId?: string | null
    isRead: boolean
    updatedAt?: string | null
}
