<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
// Menu moved to AppHeader; keep only chat controls locally
import { useMessagesStore, type Message } from '@/stores/messages'
import { useContactsStore } from '@/stores/contacts'
import { messagesApi } from '@/utils/api'
import { useUserStore } from '@/stores/user'
import { useEventBus } from '@/utils/event-bus'
import LoaderOverlay from './LoaderOverlay.vue'
import MessageItem from './MessageItem.vue'
import VoiceInput from './VoiceInput.vue'

const userStore = useUserStore()
const contactsStore = useContactsStore()
const eventBus = useEventBus()
// Тип звонка

// interface Props {
//     selectedContact: Contact | null
// }

const props = defineProps({
    isTyping: {
        type: Boolean,
        default: false,
    },
    notificationsEnabled: {
        type: Boolean,
        default: true,
    },
    isSendingMessage: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits([
    'send-message',
    'toggle-contacts',
    'event-typing',
    'toggle-notifications',
    'open-add-contact',
])

const messagesStore = useMessagesStore()
useRouter()
const newMessage = ref('')
const messageContainerRef = ref(null)
const chatAreaRef = ref<HTMLElement | null>(null)
const chatAreaHeight = ref<string>('100%')

// Используем storeToRefs для получения реактивного selectedContact из стора
const { selectedContact } = storeToRefs(contactsStore)

// Функция для проверки, является ли пользователь владельцем сообщения
const isMessageOwner = (message: Message): boolean => {
    // Проверяем по sender_id, если он есть
    if (message.sender_id && userStore.user?.id) {
        return message.sender_id === userStore.user.id
    }
    // Fallback на isSent для совместимости
    return message.isSent === true
}

// Добавляем состояние для контекстного меню
const contextMenu = ref({
    show: false,
    x: 0,
    y: 0,
    messageIndex: -1,
    isEditing: false,
    editText: '',
})

// Добавляем состояние для редактирования сообщения
const editingMessage = ref({
    index: -1,
    text: '',
})

// WebRTC состояние теперь управляется через useWebRTC в App.vue

// Функция для определения и установки высоты видимой области
const updateChatAreaHeight = () => {
    if (typeof window === 'undefined') return

    // Используем визуальный viewport API для более точного определения высоты на мобильных
    const visualViewport = window.visualViewport
    let visibleHeight: number

    if (visualViewport) {
        // visualViewport.height дает точную высоту видимой области без адресной строки
        visibleHeight = visualViewport.height
    } else {
        // Fallback для браузеров без поддержки visualViewport
        visibleHeight = window.innerHeight
    }

    // Определяем, является ли это Safari на iOS для дополнительных проверок
    const isIOSSafari =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)

    // Логируем информацию для отладки на iOS Safari
    if (isIOSSafari && visualViewport) {
        console.log('iOS Safari detected, viewport height:', visualViewport.height)
    }

    // Используем полную видимую высоту с учетом safe area
    const adjustedHeight = visibleHeight

    // На мобильных устройствах всегда используем видимую область,
    // чтобы избежать проблем, когда родитель выступает за пределы экрана
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
        // На мобильных всегда используем видимую область
        chatAreaHeight.value = `${adjustedHeight}px`
        return
    }

    // На десктопе проверяем родительский контейнер
    if (chatAreaRef.value?.parentElement) {
        const parentHeight = chatAreaRef.value.parentElement.clientHeight
        if (parentHeight > 0 && parentHeight < adjustedHeight) {
            // Родитель меньше видимой области - используем его высоту
            chatAreaHeight.value = `${parentHeight}px`
            return
        }
    }

    // Используем высоту видимой области
    chatAreaHeight.value = `${adjustedHeight}px`
}

// Функция прокрутки чата вниз
const scrollToBottom = () => {
    if (messageContainerRef.value) {
        const container = messageContainerRef.value as HTMLElement
        container.scrollTop = container.scrollHeight
    }
}

defineExpose({
    scrollToBottom,
})

const sendMessage = async () => {
    const message = newMessage.value.trim()
    if (message) {
        console.log('sendMessage', message)
        emit('send-message', message)

        newMessage.value = ''

        // Прокрутка вниз после отправки сообщения
        setTimeout(scrollToBottom, 100)
    }
}

let userTyping = false

// Демонстрационная функция для имитации печатания
const simulateTyping = () => {
    if (userTyping) return
    userTyping = true
    emit('event-typing')

    setTimeout(() => {
        userTyping = false
    }, 2500)
}

// Функция для начала видеозвонка
const startVideoCall = async () => {
    if (!selectedContact.value) {
        console.error('No contact selected for video call')
        return
    }

    console.log('Starting video call with:', selectedContact.value.contactId)

    // Эмитируем событие для начала WebRTC видеозвонка
    eventBus.emit('webrtc_start_call', {
        targetUserId: selectedContact.value.contactId,
        callType: 'video',
    })
}

// Функция для начала аудиозвонка
// const startAudioCall = () => {
//     if (!selectedContact.value) {
//         console.error('No contact selected for audio call')
//         return
//     }

//     console.log('Starting audio call with:', selectedContact.value.id)

//     // Эмитируем событие для начала WebRTC аудиозвонка
//     eventBus.emit('webrtc_start_call', {
//         targetUserId: selectedContact.value.id,
//         callType: 'audio',
//     })
// }

// WebRTC функции теперь обрабатываются в App.vue через useWebRTC composable

// Функции для работы с контекстным меню
const showContextMenu = (event: MouseEvent, index: number, text: string) => {
    event.preventDefault()

    // Проверяем, является ли пользователь владельцем сообщения
    const message = messagesStore.messages[index]
    if (!isMessageOwner(message)) {
        return // Не показываем контекстное меню для чужих сообщений
    }

    contextMenu.value = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        messageIndex: index,
        isEditing: false,
        editText: text,
    }
}

const hideContextMenu = () => {
    contextMenu.value.show = false
    contextMenu.value.messageIndex = -1
}

const startEditing = () => {
    // Переключаемся на inline редактирование вместо контекстного меню
    const index = contextMenu.value.messageIndex
    const text = contextMenu.value.editText

    hideContextMenu()
    startMessageEdit(index, text)
}

const saveEdit = async () => {
    const trimmedText = contextMenu.value.editText.trim()
    if (contextMenu.value.messageIndex !== -1 && trimmedText) {
        // Валидация длины контента
        if (trimmedText.length > 10000) {
            console.error('Сообщение слишком длинное (максимум 10000 символов)')
            return
        }
        const message = messagesStore.messages[contextMenu.value.messageIndex]

        // Проверяем, есть ли ID сообщения для отправки на сервер
        if (message.id) {
            try {
                // Проверяем наличие userId
                if (!userStore.user?.id) {
                    console.error('User ID не найден')
                    return
                }

                const { data, error } = await messagesApi.updateMessage(
                    message.id,
                    trimmedText,
                    userStore.user.id,
                )

                if (error || !data || !data.message || data.status !== 'ok') {
                    console.error('Ошибка при редактировании сообщения:', error?.message)
                    contextMenu.value.isEditing = false
                    return
                }

                // Если редактирование на сервере прошло успешно, обновляем локальный стор
                const serverData = data?.message
                    ? {
                          id: data.message.id,
                          sender_id: data.message.sender_id,
                          receiver_id: data.message.receiver_id,
                          text: data.message.content,
                          createdAt: data.message.updated_at,
                      }
                    : undefined
                messagesStore.updateMessage(contextMenu.value.messageIndex, trimmedText, serverData)
            } catch (error) {
                console.error('Ошибка сети при редактировании сообщения:', error)
                return
            }
        }
        // else {
        //     // Если нет ID, обновляем только локально
        //     messagesStore.updateMessage(contextMenu.value.messageIndex, trimmedText)
        // }

        contextMenu.value.isEditing = false
    }
}

const cancelEdit = () => {
    contextMenu.value.isEditing = false
    contextMenu.value.editText = ''
}

const deleteMessage = async () => {
    if (contextMenu.value.messageIndex !== -1) {
        const message = messagesStore.messages[contextMenu.value.messageIndex]

        // Проверяем, является ли пользователь владельцем сообщения
        if (!isMessageOwner(message)) {
            console.error('Нельзя удалить чужое сообщение')
            hideContextMenu()
            return
        }

        // Проверяем, есть ли ID сообщения для отправки на сервер
        if (message.id) {
            try {
                const { error } = await messagesApi.deleteMessage(message.id)

                if (error) {
                    console.error('Ошибка при удалении сообщения:', error.message)
                    // Можно показать уведомление об ошибке пользователю
                    return
                }

                // Если удаление на сервере прошло успешно, удаляем из локального стора
                messagesStore.deleteMessage(contextMenu.value.messageIndex)
            } catch (error) {
                console.error('Ошибка сети при удалении сообщения:', error)
                // Можно показать уведомление об ошибке пользователю
                return
            }
        } else {
            // Если нет ID (например, для локальных сообщений), удаляем только локально
            messagesStore.deleteMessage(contextMenu.value.messageIndex)
        }

        hideContextMenu()
    }
}

const createTask = () => {
    if (contextMenu.value.messageIndex !== -1) {
        const message = messagesStore.messages[contextMenu.value.messageIndex]
        // Здесь можно добавить логику создания задачи из сообщения
        console.log('Creating task from message:', message.text)
        hideContextMenu()
    }
}

// Функции для работы с редактированием сообщения
const startMessageEdit = (index: number, text: string) => {
    // Проверяем, является ли пользователь владельцем сообщения
    const message = messagesStore.messages[index]
    if (!isMessageOwner(message)) {
        return // Не позволяем редактировать чужие сообщения
    }

    editingMessage.value = {
        index,
        text,
    }
}

const saveMessageEdit = async () => {
    const trimmedText = editingMessage.value.text.trim()
    if (editingMessage.value.index !== -1 && trimmedText) {
        // Валидация длины контента
        if (trimmedText.length > 10000) {
            console.error('Сообщение слишком длинное (максимум 10000 символов)')
            return
        }
        const message = messagesStore.messages[editingMessage.value.index]

        // Проверяем, есть ли ID сообщения для отправки на сервер
        if (message.id) {
            try {
                // Проверяем наличие userId
                if (!userStore.user?.id) {
                    console.error('User ID не найден')
                    return
                }

                const { data, error } = await messagesApi.updateMessage(
                    message.id,
                    trimmedText,
                    userStore.user.id,
                )

                if (error) {
                    console.error('Ошибка при редактировании сообщения:', error.message)
                    // Можно показать уведомление об ошибке пользователю
                    return
                }

                // Если редактирование на сервере прошло успешно, обновляем локальный стор
                const serverData = data?.message
                    ? {
                          id: data.message.id,
                          sender_id: data.message.sender_id,
                          receiver_id: data.message.receiver_id,
                          text: data.message.content,
                          createdAt: data.message.updated_at,
                      }
                    : undefined
                messagesStore.updateMessage(editingMessage.value.index, trimmedText, serverData)
            } catch (error) {
                console.error('Ошибка сети при редактировании сообщения:', error)
                // Можно показать уведомление об ошибке пользователю
                return
            }
        } else {
            // Если нет ID (например, для локальных сообщений), обновляем только локально
            messagesStore.updateMessage(editingMessage.value.index, trimmedText)
        }

        // Выходим из режима редактирования
        editingMessage.value.index = -1
        editingMessage.value.text = ''
    }
}

const cancelMessageEdit = () => {
    editingMessage.value.index = -1
    editingMessage.value.text = ''
}

// Voice input handler
const handleTextRecognized = (text: string) => {
    newMessage.value = newMessage.value ? newMessage.value + ' ' + text : text
    // Optionally, auto-send the message
    // nextTick(() => sendMessage())
}

// Кнопка уведомлений перенесена в AppHeader

onMounted(() => {
    // Устанавливаем высоту компонента при монтировании
    nextTick(() => {
        updateChatAreaHeight()

        // Обновляем высоту при изменении размера окна
        window.addEventListener('resize', updateChatAreaHeight)

        // Используем visualViewport API для более точного отслеживания на мобильных
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateChatAreaHeight)
            window.visualViewport.addEventListener('scroll', updateChatAreaHeight)
        }
    })

    // Прокрутка к последнему сообщению при загрузке
    // setTimeout(scrollToBottom, 100)

    // Добавляем обработчик клика вне контекстного меню
    document.addEventListener('click', hideContextMenu)
})

// Очистка ресурсов при размонтировании компонента
onUnmounted(() => {
    // Удаляем обработчики изменения размера
    window.removeEventListener('resize', updateChatAreaHeight)
    if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateChatAreaHeight)
        window.visualViewport.removeEventListener('scroll', updateChatAreaHeight)
    }

    // Удаляем обработчик клика
    document.removeEventListener('click', hideContextMenu)
})
</script>

<template>
    <div class="chat-area" ref="chatAreaRef" :style="{ height: chatAreaHeight }">
        <div class="chat-header">
            <button class="toggle-contacts" @click="$emit('toggle-contacts')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z"
                        fill="currentColor"
                    />
                </svg>
            </button>
            <div class="contact-info">
                <h2>
                    {{ selectedContact ? selectedContact.name : 'Not selected!' }}
                </h2>
                <div
                    v-if="selectedContact"
                    class="online-indicator"
                    :class="{
                        online: selectedContact.isOnline,
                        offline: !selectedContact.isOnline,
                    }"
                    :title="selectedContact.isOnline ? 'Online' : 'Offline'"
                ></div>
            </div>

            <div class="header-buttons"></div>
        </div>

        <div class="messages-container">
            <!-- Loader overlay for messages -->
            <LoaderOverlay :show="messagesStore.isLoading" />

            <div
                v-if="selectedContact && !messagesStore.isLoading"
                class="messages"
                ref="messageContainerRef"
            >
                <template v-for="(message, index) in messagesStore.messages" :key="index">
                    <div v-if="message.date" class="date-divider">
                        <span>{{ message.date }}</span>
                    </div>
                    <MessageItem
                        :message="message"
                        :index="index"
                        :is-owner="isMessageOwner(message)"
                        :is-editing="editingMessage.index === index"
                        :edit-text="editingMessage.text"
                        @start-edit="startMessageEdit"
                        @save-edit="saveMessageEdit"
                        @cancel-edit="cancelMessageEdit"
                        @context-menu="showContextMenu"
                        @update:edit-text="(text) => (editingMessage.text = text)"
                    />
                </template>
            </div>
            <div
                v-else-if="!selectedContact && !messagesStore.isLoading"
                class="no-contact-placeholder"
            >
                <div class="placeholder-content">
                    <div class="placeholder-title">Select a contact to start chatting</div>
                    <div class="placeholder-subtitle">
                        Or add a new contact to start a conversation
                    </div>
                    <div class="placeholder-actions">
                        <button
                            class="placeholder-button primary mobile-only"
                            @click="$emit('toggle-contacts')"
                        >
                            Open contacts
                        </button>
                        <button class="placeholder-button" @click="$emit('open-add-contact')">
                            Add contact
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="typing-indicator" v-if="isTyping && selectedContact">
            <span>{{ selectedContact.name }} is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>

        <div class="input-area">
            <button
                class="video-call-button"
                title="Start video call"
                @click="startVideoCall"
                :disabled="!selectedContact?.isOnline"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                >
                    <path
                        d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                    />
                </svg>
            </button>
            <!-- <button
                class="voice-call-button"
                title="Start voice call"
                @click="startAudioCall"
                :disabled="!selectedContact?.isOnline"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                >
                    <path
                        d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
                    />
                </svg>
            </button> -->
            <input
                v-model="newMessage"
                type="text"
                class="message-input"
                :placeholder="
                    selectedContact ? 'Type a message...' : 'Select a contact to send a message'
                "
                @keyup.enter="sendMessage"
                @keypress="simulateTyping"
                :disabled="!selectedContact"
            />

            <!-- Show voice input button when message is empty, send button when there's text -->
            <VoiceInput
                v-if="!newMessage.trim() && selectedContact"
                @text-recognized="handleTextRecognized"
            />
            <button
                v-else
                class="send-button"
                @click="sendMessage"
                :disabled="!newMessage.trim() || !selectedContact || props.isSendingMessage"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
                </svg>
            </button>
        </div>

        <!-- Модальное окно звонка теперь обрабатывается в IncomingCallModal в App.vue -->

        <!-- Контекстное меню -->
        <div
            v-if="contextMenu.show"
            class="context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        >
            <div v-if="contextMenu.isEditing" class="edit-mode">
                <input
                    v-model="contextMenu.editText"
                    type="text"
                    class="edit-input"
                    @keyup.enter="saveEdit"
                    @keyup.esc="cancelEdit"
                />
                <div class="edit-actions">
                    <button @click="saveEdit" class="edit-button save">Save</button>
                    <button @click="cancelEdit" class="edit-button cancel">Cancel</button>
                </div>
            </div>
            <div v-else class="menu-items">
                <button @click="startEditing" class="menu-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.05C21.1 6.66 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.34 2.9 16.95 3.29L15.66 4.58L19.42 8.34L20.71 7.05Z"
                            fill="currentColor"
                        />
                    </svg>
                    Edit
                </button>
                <button @click="createTask" class="menu-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19L21 7l-1.41-1.41L9 16.17z"
                            fill="currentColor"
                        />
                        <path
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
                            fill="currentColor"
                        />
                    </svg>
                    Task
                </button>
                <button @click="deleteMessage" class="menu-item delete">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                            fill="currentColor"
                        />
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-area {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    background-color: var(--background-color);
    position: relative;
    /* Высота устанавливается программно через :style binding */
}

.chat-header {
    background-color: var(--primary-color);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    width: 100%;
    flex-shrink: 0;
    box-shadow: var(--box-shadow);
}

.contact-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    padding-left: 40px;
    min-width: 0;
}

.chat-header h2 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
    font-size: 18px;
    color: white;
    margin: 0;
    min-width: 0;
}

.online-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid white;
    transition: all 0.3s ease;
}

.online-indicator.online {
    background-color: #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
}

.online-indicator.offline {
    background-color: #9e9e9e;
}

.header-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Tabs были перенесены в глобальный AppHeader */

.news-button {
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

.news-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: white;
    transform: translateY(-1px);
}

.news-button:active {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(0);
}

.messages-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 0;
    background-color: var(--background-color);
    position: relative;
}

/* Переопределяем стили лоадера для контейнера сообщений */
.messages-container .loader-overlay {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(6px);
    border-radius: 0;
}

.dark-theme .messages-container .loader-overlay {
    background-color: rgba(30, 30, 30, 0.95);
}

.messages {
    flex: 1 1 auto;
    padding: 20px;
    padding-bottom: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
    background-color: var(--background-color);
}

.messages > :first-child {
    margin-top: auto;
}

.dark-theme .messages {
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.messages::-webkit-scrollbar {
    width: 5px;
}

.messages::-webkit-scrollbar-track {
    background: transparent;
}

.messages::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.date-divider {
    text-align: center;
    margin: 20px 0;
    position: relative;
    width: 100%;
}

.date-divider::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.08);
    z-index: 1;
}

.dark-theme .date-divider::before {
    background-color: rgba(255, 255, 255, 0.08);
}

.date-divider span {
    background-color: var(--background-color);
    padding: 0 12px;
    color: #6c757d;
    font-size: 13px;
    position: relative;
    z-index: 2;
    font-weight: 500;
}

.dark-theme .date-divider span {
    color: #adb5bd;
}

.typing-indicator {
    padding: 10px 20px;
    color: #6c757d;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
    width: 100%;
    background-color: var(--background-color);
    animation: fadeIn 0.3s ease;
}

.dark-theme .typing-indicator {
    color: #adb5bd;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dot {
    width: 8px;
    height: 8px;
    background-color: #adb5bd;
    border-radius: 50%;
    animation: typingAnimation 1.4s infinite;
}

.typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes typingAnimation {
    0%,
    100% {
        opacity: 0.3;
        transform: scale(0.8);
    }
    50% {
        opacity: 1;
        transform: scale(1);
    }
}

.input-area {
    padding: 16px 20px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 20px));
    background-color: white;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
    display: flex;
    gap: 12px;
    width: 100%;
    flex-shrink: 0;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
    position: relative;
    z-index: 10;
    /* Дополнительная защита для Safari iOS */
    min-height: calc(72px + env(safe-area-inset-bottom, 20px));
}

.dark-theme .input-area {
    background-color: #1e1e1e;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
}

.video-call-button,
.voice-call-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 5px rgba(26, 115, 232, 0.2);
}

.video-call-button:hover,
.voice-call-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(26, 115, 232, 0.3);
}

.video-call-button:active,
.voice-call-button:active {
    background-color: var(--accent-color);
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(26, 115, 232, 0.2);
}

.video-call-button svg,
.voice-call-button svg {
    width: 20px;
    height: 20px;
}

.message-input {
    flex-grow: 1;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 24px;
    outline: none;
    width: 100%;
    max-width: calc(100% - 110px);
    font-size: 15px;
    transition: all 0.2s ease;
    background-color: white;
    color: var(--text-color);
}

.dark-theme .message-input {
    background-color: #333;
    color: #e0e0e0;
    border-color: #444;
}

.message-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.dark-theme .message-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.2);
}

.send-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    box-shadow: 0 2px 5px rgba(26, 115, 232, 0.2);
    position: relative;
    overflow: hidden;
    transform: translateY(0) scale(1);
}

.send-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4);
}

.send-button:active {
    background-color: var(--accent-color);
    transform: translateY(1px) scale(0.95);
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.5);
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.send-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition:
        width 0.3s ease,
        height 0.3s ease;
}

.send-button:active::before {
    width: 80px;
    height: 80px;
}

.send-button:disabled {
    background-color: #e9ecef;
    color: #adb5bd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.send-button:disabled::before {
    display: none;
}

.toggle-contacts {
    display: none;
    background: transparent;
    border: none;
    padding: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
    color: white;
}

.toggle-contacts svg {
    width: 24px;
    height: 24px;
}

.toggle-contacts:hover {
    opacity: 0.8;
}

@media (max-width: 1024px) {
    .chat-area {
        height: 100%;
        width: 100%;
        min-height: 0;
    }
}

@media (max-width: 768px) {
    .chat-area {
        height: 100%;
        width: 100%;
        min-height: 0;
        /* На мобильных используем фиксированную высоту через inline style */
    }

    .chat-header {
        padding: 14px 16px;
    }

    .contact-info {
        padding-left: 10px;
        gap: 8px;
    }

    .chat-header h2 {
        font-size: 16px;
    }

    .online-indicator {
        width: 10px;
        height: 10px;
    }

    .message {
        max-width: 85%;
        font-size: 14px;
        padding: 10px 14px;
    }

    .input-area {
        padding: 12px;
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 25px));
        /* Гарантируем, что input-area всегда виден */
        position: relative;
        z-index: 100;
        /* Дополнительная защита для Safari iOS на мобильных */
        min-height: calc(62px + env(safe-area-inset-bottom, 25px));
    }

    /* Убеждаемся, что messages-container не перекрывает input-area */
    .messages-container {
        padding-bottom: 0;
    }

    .message-input {
        padding: 10px 12px;
        font-size: 14px;
        max-width: calc(100% - 100px);
    }

    .send-button,
    .video-call-button,
    .voice-call-button {
        width: 38px;
        height: 38px;
    }

    .video-call-button svg,
    .voice-call-button svg,
    .send-button svg {
        width: 18px;
        height: 18px;
    }

    .toggle-contacts {
        display: block;
    }

    .news-button span {
        display: none;
    }

    .news-button {
        padding: 8px;
        justify-content: center;
    }

    .messages::-webkit-scrollbar {
        display: none;
    }

    .messages {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .date-divider span {
        font-size: 12px;
    }

    .message-footer {
        font-size: 11px;
    }
}

/* Стили для модального окна звонка */
.call-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.3s ease;
}

.call-modal-content {
    background-color: var(--background-color);
    border-radius: var(--border-radius);
    width: 100%;
    max-width: 1400px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.call-header {
    background-color: var(--primary-color);
    color: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.call-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.call-duration {
    font-size: 16px;
    font-family: monospace;
}

.call-body {
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 300px;
}

.user-avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.avatar-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 40px;
    font-weight: bold;
}

.avatar-circle.large {
    width: 220px;
    height: 220px;
    font-size: 70px;
}

.avatar-circle.small {
    width: 80px;
    height: 80px;
    font-size: 24px;
}

.call-status {
    font-size: 18px;
    font-weight: 500;
    color: var(--text-color);
}

.video-container {
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
}

.remote-video {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    position: relative;
}

.remote-video .avatar-circle.large {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.local-video {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 5px;
    z-index: 2;
}

.local-video .avatar-circle.small {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.call-actions {
    padding: 15px;
    display: flex;
    justify-content: center;
    gap: 20px;
    background-color: rgba(0, 0, 0, 0.05);
    margin-top: 10px;
}

.dark-theme .call-actions {
    background-color: rgba(255, 255, 255, 0.05);
}

.action-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: rgba(0, 0, 0, 0.1);
    color: var(--text-color);
}

.dark-theme .action-button {
    background-color: rgba(255, 255, 255, 0.1);
}

.action-button svg {
    width: 24px;
    height: 24px;
}

.action-button:hover {
    transform: translateY(-2px);
    background-color: rgba(0, 0, 0, 0.2);
}

.dark-theme .action-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.action-button.end-call {
    background-color: #e74c3c;
    color: white;
}

.action-button.end-call:hover {
    background-color: #c0392b;
}

.action-button.active {
    background-color: #f44336;
    color: white;
}

.mute,
.speaker,
.camera {
    background-color: var(--primary-color);
    color: white;
}

.mute.active {
    background-color: #f44336;
}

.mute:hover,
.speaker:hover,
.camera:hover {
    background-color: var(--accent-color);
}

.mute.active:hover {
    background-color: #d32f2f;
}

@media (max-width: 768px) {
    .call-modal-content {
        max-width: 100%;
        height: 100%;
        border-radius: 0;
    }

    .call-body {
        min-height: auto;
        flex: 1;
    }

    .avatar-circle {
        width: 100px;
        height: 100px;
        font-size: 36px;
    }

    .avatar-circle.large {
        width: 140px;
        height: 140px;
        font-size: 50px;
    }

    .action-button {
        width: 45px;
        height: 45px;
    }

    .video-player.remote {
        height: 300px;
    }

    .video-player.local {
        width: 90px;
        height: 70px;
    }
}

.video-player {
    border-radius: 10px;
    background-color: #000;
    object-fit: cover;
}

.video-player.remote {
    width: 100%;
    height: 600px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.video-player.local {
    width: 120px;
    height: 90px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.remote-video {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    position: relative;
}

.remote-video .avatar-circle.large {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.local-video {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 5px;
    z-index: 2;
}

.local-video .avatar-circle.small {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.context-menu {
    position: fixed;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px;
    z-index: 1000;
    min-width: 150px;
}

.dark-theme .context-menu {
    background-color: #2a2a2a;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.menu-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: none;
    background: none;
    color: var(--text-color);
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s ease;
}

.menu-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.menu-item svg {
    width: 16px;
    height: 16px;
}

.menu-item.delete {
    color: #dc3545;
}

.menu-item.delete:hover {
    background-color: rgba(220, 53, 69, 0.1);
}

.edit-mode {
    padding: 8px;
}

.edit-input {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 8px;
    font-size: 14px;
    background-color: white;
    color: var(--text-color);
}

.dark-theme .edit-input {
    background-color: #333;
    border-color: #444;
    color: #e0e0e0;
}

.edit-actions {
    display: flex;
    gap: 8px;
}

.edit-button {
    flex: 1;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
}

.edit-button.save {
    background-color: var(--primary-color);
    color: white;
}

.edit-button.save:hover {
    background-color: var(--accent-color);
}

.edit-button.cancel {
    background-color: #e9ecef;
    color: #6c757d;
}

.dark-theme .edit-button.cancel {
    background-color: #444;
    color: #adb5bd;
}

.edit-button.cancel:hover {
    background-color: #dee2e6;
}

.dark-theme .edit-button.cancel:hover {
    background-color: #555;
}

.notification-button {
    background-color: transparent;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.notification-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.notification-button svg {
    width: 24px;
    height: 24px;
}

/* Disabled states for call buttons */
.video-call-button:disabled,
.voice-call-button:disabled {
    background-color: #e9ecef;
    color: #adb5bd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Disabled input */
.message-input:disabled {
    background-color: #f1f3f5;
    color: #adb5bd;
    cursor: not-allowed;
}

/* Placeholder when no contact selected */
.no-contact-placeholder {
    flex: 1 1 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background-color);
    padding: 20px;
}

.placeholder-content {
    text-align: center;
    max-width: 520px;
    width: 100%;
    background: white;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.dark-theme .placeholder-content {
    background: #1e1e1e;
}

.placeholder-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
}

.placeholder-subtitle {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 16px;
}

.dark-theme .placeholder-subtitle {
    color: #adb5bd;
}

.placeholder-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.placeholder-button {
    border: 1px solid var(--border-color);
    background: white;
    color: var(--text-color);
    border-radius: 22px;
    padding: 10px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.placeholder-button:hover {
    background-color: #f8f9fa;
}

.placeholder-button.primary {
    background-color: var(--primary-color);
    color: white;
    border: none;
}

.placeholder-button.primary:hover {
    background-color: var(--accent-color);
}

/* Темная тема для кнопки Add contact */
.dark-theme .placeholder-button {
    background: #2a2a2a;
    color: #e0e0e0;
    border-color: #444;
}

.dark-theme .placeholder-button:hover {
    background-color: #333;
}

/* Показывать кнопку открытия контактов только на мобильных */
.mobile-only {
    display: none;
}

@media (max-width: 768px) {
    .mobile-only {
        display: inline-flex;
    }
}

/* Специальные правила для Safari на iOS */
@supports (-webkit-touch-callout: none) {
    /* Это правило применяется только в Safari на iOS */
    .input-area {
        padding-bottom: calc(16px + env(safe-area-inset-bottom, 30px));
        min-height: calc(72px + env(safe-area-inset-bottom, 30px));
    }

    @media (max-width: 768px) {
        .input-area {
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 30px));
            min-height: calc(62px + env(safe-area-inset-bottom, 30px));
            /* Дополнительная защита от перекрытия */
            position: sticky;
            bottom: 0;
        }

        /* Убеждаемся, что чат не перекрывается input-area */
        .messages-container {
            padding-bottom: calc(80px + env(safe-area-inset-bottom, 30px));
        }

        .messages {
            padding-bottom: calc(20px + env(safe-area-inset-bottom, 10px));
        }
    }
}
</style>
