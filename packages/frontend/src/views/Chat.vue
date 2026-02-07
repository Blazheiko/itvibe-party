<script setup lang="ts">
import {
    ref,
    defineComponent,
    onMounted,
    onBeforeUnmount,
    nextTick,
    computed,
    watch,
    toRef,
} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useContactsStore } from '@/stores/contacts'
import ContactsList from '@/components/ContactsList.vue'
import ChatArea from '@/components/ChatArea.vue'
import Calendar from '@/components/Calendar.vue'
import TaskManager from '@/components/TaskManager.vue'
import MyNotes from '@/components/MyNotes.vue'
import ProjectsView from '@/views/Projects.vue'
import LoaderOverlay from '@/components/LoaderOverlay.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import formatMessageDate from '@/utils/formatMessageDate'
import baseApi from '@/utils/base-api'
import { useMessagesStore, type Message } from '@/stores/messages'
import type { Contact } from '@/stores/contacts'
import { useEventBus } from '@/utils/event-bus'
import type { WebsocketPayload } from '@/utils/websocket-base'
import { useStateStore } from '@/stores/state'
import api from '@/utils/base-api'
const messagesStore = useMessagesStore()
const eventBus = useEventBus()

// Аудио-элементы для звуковых уведомлений
const notificationSound = ref<HTMLAudioElement | null>(null)
const clickSound = ref<HTMLAudioElement | null>(null)
// Включены ли звуковые уведомления
const notificationsEnabled = ref(localStorage.getItem('notifications_enabled') !== 'false')

// Функция для воспроизведения звука уведомления
const playNotificationSound = () => {
    if (notificationSound.value && notificationsEnabled.value) {
        notificationSound.value.currentTime = 0
        notificationSound.value.play().catch((error) => {
            console.error('Ошибка воспроизведения звука:', error)
        })
    }
}

// Функция для воспроизведения звука щелчка (для активного чата)
const playClickSound = () => {
    if (clickSound.value && notificationsEnabled.value) {
        clickSound.value.currentTime = 0
        clickSound.value.play().catch((error) => {
            console.error('Ошибка воспроизведения звука щелчка:', error)
        })
    }
}

// Функция для переключения звуковых уведомлений
const toggleNotifications = () => {
    notificationsEnabled.value = !notificationsEnabled.value
    localStorage.setItem('notifications_enabled', notificationsEnabled.value.toString())
}

interface ContactResponse {
    id: number
    userId: number
    contactId: number
    rename?: string
    contact: {
        name: string
        id: number
    }
    lastMessage?: {
        id: number
        content: string
        createdAt: string
    }
    lastMessageAt: string
    unreadCount: number
    status: string
    updatedAt: string
    createdAt: string
}

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

interface MessagesResponse {
    messages: ApiMessage[]
    contact: ContactResponse
    onlineUsers: number[]
}

interface ApiInitialResponse {
    status: string
    contactList: ContactResponse[]
    onlineUsers: number[]
}

defineComponent({
    name: 'ChatView',
})

const router = useRouter()
const userStore = useUserStore()
const contactsStore = useContactsStore()
const isContactsVisible = ref(true)
const isLoading = ref(false)

// Loading state for sending messages
const isSendingMessage = ref(false)
const isOffline = ref(false)
const isMenuOpen = ref(false)
const route = useRoute()
const showNews = computed(() => route.meta.tab === 'notes')
const showCalendar = computed(() => route.meta.tab === 'calendar')
const showTaskManager = computed(() => route.meta.tab === 'tasks')
const showProjects = computed(() => route.meta.tab === 'projects')
// Прежний локальный таб больше не нужен, так как табы переехали в AppHeader
const isTyping = ref(false)
const stateStore = useStateStore()
const windowWidth = toRef(stateStore, 'windowWidth')
const chatAreaRef = ref<InstanceType<typeof ChatArea> | null>(null)
const contactsListRef = ref<InstanceType<typeof ContactsList> | null>(null)

const toggleContacts = () => {
    console.log('toggleContacts')
    isContactsVisible.value = !isContactsVisible.value
}
const openAddContactFromChatArea = () => {
    // Показать список контактов и открыть модал создания контакта
    isContactsVisible.value = true
    contactsListRef.value?.openAddContactModal?.()
}

const toggleNews = (newsState: boolean) => {
    router.push(newsState ? '/notes' : '/chat')
}

const toggleCalendar = () => {
    router.push(showCalendar.value ? '/chat' : '/calendar')
}

const toggleTaskManager = () => {
    router.push(showTaskManager.value ? '/chat' : '/tasks')
}

// Функция для автоматического скрытия панели контактов на мобильных устройствах
const hideContactsOnMobileIfNeeded = () => {
    if (
        windowWidth.value <= 768 &&
        (showProjects.value || showCalendar.value || showTaskManager.value || showNews.value)
    ) {
        isContactsVisible.value = false
    }
}

// Watchers для автоматического скрытия панели контактов на мобильных при открытии различных вкладок
watch([showProjects, showCalendar, showTaskManager, showNews], hideContactsOnMobileIfNeeded, {
    immediate: true,
})

// Также скрывать при изменении размера окна, если активна любая из вкладок
watch(windowWidth, hideContactsOnMobileIfNeeded)

const handleConnectionRetry = () => {
    isLoading.value = true

    // Имитация попытки переподключения
    setTimeout(() => {
        isLoading.value = false
        isOffline.value = false
    }, 2000)
}

const initChatData = async () => {
    contactsStore.setLoading(true)
    try {
        const { error, data } = await baseApi.http<ApiInitialResponse>(
            'POST',
            '/api/chat/get-contact-list',
            {
                userId: userStore.user?.id,
            },
        )
        if (error) {
            console.error('Failed to get contact list: ', error)
        } else if (data?.status === 'ok' && data.contactList?.length > 0) {
            console.log('Contact list: ', data.contactList)

            const onlineContacts = data.onlineUsers

            const contactList = data.contactList.map((contact: ContactResponse) => ({
                id: contact.id,
                contactId: String(contact.contactId),
                name: contact.rename || contact.contact.name,
                unreadCount: contact.unreadCount,
                isActive: false,
                isOnline: onlineContacts.includes(contact.contactId),
                lastMessage: contact.lastMessage ? contact.lastMessage.content : '',
                lastMessageTime: formatMessageDate(contact.updatedAt),
                lastMessageId: contact.lastMessage ? String(contact.lastMessage.id) : undefined,
                lastMessageAt: contact.lastMessageAt,
                updatedAt: contact.updatedAt,
            }))

            contactsStore.setContactList(contactList)
            if (!contactsStore.selectedContact && windowWidth.value > 600) {
                const currentContactId = String(localStorage.getItem('current_contact_id'))
                if (currentContactId) {
                    const contact = contactList.find(
                        (c) => c.contactId === String(currentContactId),
                    )
                    if (contact) selectContact(contact)
                }
            }
        }
    } finally {
        contactsStore.setLoading(false)
    }
}

// Проверяем состояние сети при загрузке и слушаем события
const setupNetworkListeners = () => {
    // Добавляем слушатели для отслеживания состояния сети
    window.addEventListener('online', () => {
        isOffline.value = false
    })

    window.addEventListener('offline', () => {
        isOffline.value = true
    })

    // Начальная проверка состояния сети
    isOffline.value = !navigator.onLine
}

// Функция для закрытия выпадающего меню при клике вне
const closeMenuOnClickOutside = (event: MouseEvent) => {
    if (isMenuOpen.value) {
        const target = event.target as HTMLElement
        const menu = document.querySelector('.dropdown-menu')
        const menuButton = document.querySelector('.menu-button')

        if (menu && menuButton && !menu.contains(target) && !menuButton.contains(target)) {
            isMenuOpen.value = false
        }
    }
}

// Переход в аккаунт
const goToAccount = () => {
    isMenuOpen.value = false
    router.push('/account')
}

// Переход на страницу новостей
const goToNews = () => {
    isMenuOpen.value = false
    router.push('/news')
}

// Переход на страницу манифеста
const goToManifesto = () => {
    isMenuOpen.value = false
    router.push('/manifesto')
}

// Выход из аккаунта
const logout = () => {
    isMenuOpen.value = false
    // localStorage.removeItem('user')
    router.push('/')
}

const formatChatMesssage = (message: ApiMessage): Message => ({
    id: Number(message.id),
    text: message.content,
    time: new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    }),
    isSent: String(userStore.user?.id) === message.senderId,
    isRead: message.isRead,
    createdAt: message.createdAt,
    taskId: message.taskId ? Number(message.taskId) : undefined,
    calendarId: message.calendarId ? Number(message.calendarId) : undefined,
    date: isToday(new Date(message.createdAt))
        ? 'Today'
        : formatMessageDate(String(message.createdAt)),
})

const sendMessage = async (newMessage: string) => {
    console.log('sendMessage', newMessage)
    if (newMessage && contactsStore.selectedContact && userStore.user) {
        isSendingMessage.value = true

        try {
            // Запрашиваем разрешение на уведомления при отправке сообщения
            try {
                await stateStore.ensureNotificationPermission()
            } catch (error) {
                console.warn('Не удалось получить разрешение на уведомления:', error)
            }

            console.log('selectedContact', contactsStore.selectedContact)
            const contactId = contactsStore.selectedContact.contactId
            const { error, data } = await baseApi.http('POST', '/api/chat/send-chat-messages', {
                contactId,
                content: newMessage,
                userId: userStore.user?.id,
            })
            if (error) {
                console.error(error)
            } else if (data && data.message) {
                const message = formatChatMesssage(data.message as ApiMessage)
                if (messagesStore.messages.length > 0) {
                    const lastMessage = messagesStore.messages[messagesStore.messages.length - 1]
                    const date = isToday(new Date(lastMessage.createdAt))
                        ? 'Today'
                        : formatMessageDate(String(lastMessage.createdAt))
                    if (date === message.date) {
                        message.date = ''
                    }
                }
                messagesStore.addMessage(message)

                contactsStore.updateContact({
                    contactId: contactId,
                    lastMessage: message.text,
                    lastMessageTime: formatMessageDate(String(message.createdAt)),
                    updatedAt: new Date().toISOString(),
                    lastMessageId: String(message.id) || undefined,
                    lastMessageAt: String(message.createdAt),
                })
            }
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            isSendingMessage.value = false
        }
    }
}

const isToday = (date: Date) => {
    const today = new Date()
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    )
}

// Используем selectedContact из стора контактов
// const selectedContact = ref<Contact | null>(null) - удалено, используем из стора

const selectContact = async (contact: Contact) => {
    console.log('selectContact', contact)
    contactsStore.setActiveContact(contact)
    localStorage.setItem('current_contact_id', contact.contactId.toString())
    messagesStore.resetMessages()
    messagesStore.setLoading(true)

    try {
        const { error, data } = await baseApi.http<MessagesResponse>(
            'POST',
            '/api/chat/get-messages',
            {
                contactId: contact.contactId,
                userId: userStore.user?.id,
            },
        )
        if (error) {
            console.error(error)
        } else if (data && data.messages && data.messages.length > 0 && data.contact) {
            console.log(data)
            const newMessages: Message[] = data.messages
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map(formatChatMesssage)

            // Обработка дат сообщений
            let lastDate = ''
            newMessages.forEach((message) => {
                if (lastDate === message.date) {
                    message.date = ''
                } else if (message.date) {
                    lastDate = message.date
                }
            })
            const onlineContacts = data.onlineUsers
            console.log('onlineContacts', onlineContacts)

            messagesStore.setMessages(newMessages)
            const contact = data.contact
            const lastMessage =
                newMessages.length > 0 ? newMessages[newMessages.length - 1].text : ''
            contactsStore.updateContact({
                id: contact.id,
                contactId: String(contact.contact.id),
                name: contact.rename || contact.contact.name,
                unreadCount: contact.unreadCount,
                isActive: true,
                isOnline:
                    onlineContacts && onlineContacts.length > 0
                        ? onlineContacts.includes(contact.contact.id)
                        : false,
                lastMessage: lastMessage,
                lastMessageTime: formatMessageDate(contact.updatedAt),
                updatedAt: contact.updatedAt,
            } as Contact)
            nextTick(() => {
                isContactsVisible.value = false
                scrollToBottom()
            })
        }
    } finally {
        messagesStore.setLoading(false)
    }
}

const scrollToBottom = () => {
    chatAreaRef.value?.scrollToBottom()
}
let typingTimeout: number | null = null

// Подписываемся на события
onMounted(() => {
    // Инициализация аудио-элементов
    notificationSound.value = new Audio('/audio/notification.mp3')
    clickSound.value = new Audio('/audio/click-button-140881.mp3')

    // Получение сохраненной настройки уведомлений из localStorage
    notificationsEnabled.value = localStorage.getItem('notifications_enabled') !== 'false'

    setupNetworkListeners()
    document.addEventListener('click', closeMenuOnClickOutside)

    // Подписка на события
    eventBus.on('new_message', (payload: WebsocketPayload) => {
        console.log('event new_message', payload)
        const message: ApiMessage = payload.message as ApiMessage
        if (message?.senderId) {
            contactsStore.updateContactById(String(message.senderId), {
                lastMessage: message.content,
            })
            if (
                contactsStore.selectedContact &&
                message.senderId === String(contactsStore.selectedContact.contactId)
            ) {
                console.log('new_message')
                messagesStore.addMessage({
                    id: Number(message.id),
                    text: message.content,
                    time: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    isSent: false,
                    isRead: true,
                    createdAt: new Date().toISOString(),
                    taskId: message.taskId ? Number(message.taskId) : undefined,
                    calendarId: message.calendarId ? Number(message.calendarId) : undefined,
                    date: isToday(new Date())
                        ? 'Today'
                        : formatMessageDate(new Date().toISOString()),
                })
                // Воспроизводим звук щелчка при получении сообщения в активный чат
                playClickSound()
                nextTick(() => {
                    scrollToBottom()
                })
                api.ws('main/read_message', {
                    userId: userStore.user?.id,
                    contactId: contactsStore.selectedContact.contactId,
                })
            } else {
                console.log('new_message not for this contact')
                // Воспроизводим звук при получении нового сообщения в неактивный чат
                playNotificationSound()
                contactsStore.incrementUnreadCount(String(message.senderId))
                contactsStore.updateContactById(String(message.senderId), {
                    isOnline: true,
                    lastMessage: message.content,
                    lastMessageTime: formatMessageDate(String(message.createdAt)),
                    updatedAt: new Date().toISOString(),
                })
            }
        }
    })

    eventBus.on('user_online', (payload: WebsocketPayload) => {
        if (
            contactsStore.selectedContact &&
            payload.userId === contactsStore.selectedContact.contactId
        ) {
            contactsStore.updateContact({
                contactId: contactsStore.selectedContact.contactId,
                isOnline: payload.isOnline as boolean,
            })
        }
    })

    eventBus.on('event_typing', (payload: WebsocketPayload) => {
        if (
            contactsStore.selectedContact &&
            payload.userId === contactsStore.selectedContact.contactId
        ) {
            console.log('event_typing in chat', payload)
            isTyping.value = true
            if (typingTimeout) window.clearTimeout(typingTimeout)
            typingTimeout = setTimeout(() => {
                isTyping.value = false
            }, 3000)
        }
    })

    if (!userStore.hasUser()) {
        console.log('no user')
        router.push('/')
    } else {
        initChatData()
    }
})

const eventTyping = async () => {
    console.log('eventTyping')
    if (contactsStore.selectedContact) {
        const res = await baseApi.ws('main/event_typing', {
            userId: userStore.user?.id,
            contactId: contactsStore.selectedContact.contactId,
        })
        console.log('eventTyping res', res)
    }
}

// Функция startCall удалена - теперь используется webrtc_start_call через event bus
// ChatArea.vue эмитирует webrtc_start_call, который обрабатывается в App.vue
// Отписываемся от событий при размонтировании
onBeforeUnmount(() => {
    document.removeEventListener('click', closeMenuOnClickOutside)
    eventBus.off('new_message')
    eventBus.off('user_online')
})
</script>

<template>
    <div class="chat-container">
        <ConnectionStatus :show="isOffline" @retry="handleConnectionRetry" />
        <LoaderOverlay :show="isLoading" />

        <!-- Аудио-элементы для звуковых уведомлений -->
        <audio
            ref="notificationSound"
            preload="auto"
            src="/audio/notification_1.mp3"
            style="display: none"
        ></audio>
        <audio
            ref="clickSound"
            preload="auto"
            src="/audio/click-button-140881.mp3"
            style="display: none"
        ></audio>

        <div class="chat-main">
            <ContactsList
                :class="{ show: isContactsVisible }"
                ref="contactsListRef"
                @toggle-contacts="toggleContacts"
                @toggle-news="toggleNews"
                @select-contact="selectContact"
                @toggle-calendar="toggleCalendar"
                @toggle-task="toggleTaskManager"
            />
            <div class="main-content">
                <MyNotes
                    v-if="showNews"
                    :hide-header="true"
                    @back-to-chat="router.push('/chat')"
                    @toggle-contacts="toggleContacts"
                />
                <Calendar
                    v-else-if="showCalendar"
                    @back-to-chat="router.push('/chat')"
                    @toggle-contacts="toggleContacts"
                />
                <TaskManager
                    v-else-if="showTaskManager"
                    @back-to-chat="router.push('/chat')"
                    @toggle-contacts="toggleContacts"
                />
                <ProjectsView v-else-if="showProjects" @toggle-contacts="toggleContacts" />
                <ChatArea
                    v-else
                    ref="chatAreaRef"
                    :is-typing="isTyping"
                    :notifications-enabled="notificationsEnabled"
                    :is-sending-message="isSendingMessage"
                    @toggle-contacts="toggleContacts"
                    @open-add-contact="openAddContactFromChatArea"
                    @go-to-account="goToAccount"
                    @go-to-news="goToNews"
                    @go-to-manifesto="goToManifesto"
                    @logout="logout"
                    @send-message="sendMessage"
                    @event-typing="eventTyping"
                    @toggle-notifications="toggleNotifications"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: calc(100vh - var(--header-height));
    background-color: var(--background-color);
    position: relative;
    overflow: hidden;
}

.chat-header {
    height: var(--header-height);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    background-color: var(--primary-color);
    color: white;
    box-shadow: var(--box-shadow);
}

.dark-theme .chat-header {
    background-color: #0d47a1;
}

.chat-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.chat-main {
    display: grid;
    grid-template-columns: 300px 1fr;
    flex: 1;
    height: 100%;
    overflow: hidden;
}

.main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

.mini-header {
    background: var(--primary-color);
    color: #fff;
    padding: 8px 12px;
    box-shadow: var(--box-shadow);
}

.dark-theme .mini-header {
    background: #0d47a1;
}

.tabs {
    display: flex;
    gap: 8px;
    align-items: center;
}

.tab {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: #fff;
    padding: 4px 10px;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 500;
    height: 26px;
    transition: all 0.2s ease;
}

.tab:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

.tab.active {
    background: #fff;
    color: var(--primary-color);
}
.dark-theme .tab.active {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
}

.contact-toggle,
.menu-button {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: white;
    padding: 8px 15px;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
}

.contact-toggle:hover,
.menu-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: white;
    transform: translateY(-1px);
}

.contact-toggle:active,
.menu-button:active {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(0);
}

.menu-container {
    position: relative;
}

.arrow-icon {
    transition: transform 0.3s ease;
}

.menu-button.open .arrow-icon {
    transform: rotate(180deg);
}

.dropdown-menu {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 200px;
    background-color: white;
    border: none;
    border-radius: 12px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
    z-index: 100;
    overflow: hidden;
    opacity: 0;
    transform: translateY(-10px);
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    padding: 6px 0;
}

.dropdown-menu.show {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    text-align: left;
    padding: 12px 15px;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.25s ease;
    color: var(--text-color);
    border-radius: 8px;
    margin: 4px 8px;
    width: calc(100% - 16px);
    font-weight: 500;
    font-size: 14px;
}

.menu-item.logout {
    color: #dc3545;
}

.menu-item:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
}

.menu-item:active {
    transform: translateY(0);
}

@media (max-width: 600px) {
    .chat-header {
        padding: 0 16px;
    }

    .chat-header h1 {
        font-size: 18px;
    }

    .contact-toggle span,
    .menu-button span,
    .arrow-icon {
        display: none;
    }

    .contact-toggle,
    .menu-button {
        padding: 10px;
        justify-content: center;
    }

    .chat-main {
        grid-template-columns: 1fr;
    }

    :deep(.contacts-list) {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        z-index: 10;
        transition: all 0.3s ease;
    }

    :deep(.contacts-list.show) {
        left: 0;
    }
}

.dark-theme .chat-container {
    background-color: #121212;
}
</style>
