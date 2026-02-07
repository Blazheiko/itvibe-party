<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContactsStore } from '@/stores/contacts'
import { useUserStore } from '@/stores/user'
import type { Contact } from '@/stores/contacts'
import baseApi from '@/utils/base-api'
import LoaderOverlay from './LoaderOverlay.vue'
// import { TransitionGroup } from 'vue'

const contactsStore = useContactsStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const showNews = ref(false)
const unreadNewsCount = ref(3)
const showAddContactModal = ref(false)
const newContact = ref({
    name: '',
    lastMessage: '',
    lastMessageTime: '',
    isOnline: false,
    unreadCount: 0,
    isActive: false,
})
const shareLink = ref('')
const copySuccess = ref(false)

// Loading state for share link generation
const isGeneratingLink = ref(false)
const emit = defineEmits([
    'toggle-contacts',
    'toggle-news',
    'select-contact',
    'toggle-calendar',
    'toggle-task',
])
const editInput = ref<HTMLInputElement | null>(null)
// Добавляем состояние для поиска
const isSearchActive = ref(false)

// Добавляем состояние для контекстного меню
const contextMenu = ref({
    show: false,
    x: 0,
    y: 0,
    isEditing: false,
    contact: null as Contact | null,
    editName: '',
})

// Добавляем состояние для редактирования контакта
// const editingContact = ref({
//     index: -1,
//     name: '',
// })

// Функция для обработки клика по контакту
const handleContactClick = (contact: Contact) => {
    console.log('handleContactClick')
    if (route.name !== 'Chat' && route.name !== 'JoinChat') router.push('/chat')
    emit('select-contact', contact)
}

// Функция для переключения отображения новостей
const toggleNotes = () => {
    showNews.value = !showNews.value
    if (showNews.value) {
        unreadNewsCount.value = 0
    }
    emit('toggle-news', showNews.value)
    emit('toggle-contacts')
}

// Фильтрация и сортировка контактов
const filteredContacts = computed(() => {
    let filtered = contactsStore.contacts
    filtered = filtered.sort(
        (a, b) => new Date(b.lastMessageAt || '').getTime() - new Date(a.lastMessageAt || '').getTime(),
    )

    // Применяем фильтр по поисковому запросу
    if (searchQuery.value) {
        filtered = filtered.filter((contact) =>
            contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
        )
    }

    return filtered

    // Сортируем контакты: активный контакт всегда сверху
    // return filtered.sort((a, b) => {
    //     if (a.isActive && !b.isActive) return -1
    //     if (!a.isActive && b.isActive) return 1
    //     return 0
    // })
})

// Получение инициалов пользователя из имени
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
}

// Функции для работы с контекстным меню
const showContextMenu = (event: MouseEvent, contact: Contact) => {
    event.preventDefault()
    contextMenu.value = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        contact: contact,
        isEditing: false,
        editName: '',
    }
}

const hideContextMenu = () => {
    contextMenu.value.show = false
    contextMenu.value.isEditing = false
    contextMenu.value.contact = null
    contextMenu.value.editName = ''
}

const startEditing = () => {
    contextMenu.value.isEditing = true
    // Добавляем небольшую задержку, чтобы DOM обновился
    setTimeout(() => {
        editInput.value?.focus()
        editInput.value?.select() // Выделяем весь текст
    }, 0)
}

const saveEdit = () => {
    if (contextMenu.value.contact && contextMenu.value.editName.trim()) {
        contactsStore.updateContact({
            name: contextMenu.value.editName,
        })
        hideContextMenu()
    }
}

const cancelEdit = () => {
    hideContextMenu()
}

const deleteContact = () => {
    if (contextMenu.value.contact) {
        contactsStore.deleteContact(contextMenu.value.contact.id)
        hideContextMenu()
    }
}

// Функции для работы с редактированием контакта
// const startContactEdit = (index: number, name: string) => {
//     editingContact.value = {
//         index,
//         name,
//     }
// }

// const saveContactEdit = () => {
//     if (editingContact.value.index !== -1 && editingContact.value.name.trim()) {
//         contactsStore.updateContact(editingContact.value.index, {
//             name: editingContact.value.name,
//         })
//         editingContact.value.index = -1
//         editingContact.value.name = ''
//     }
// }

// const cancelContactEdit = () => {
//     editingContact.value.index = -1
//     editingContact.value.name = ''
// }

const generateShareLink = async () => {
    isGeneratingLink.value = true

    try {
        // Генерируем уникальный идентификатор для ссылки
        const { error, data } = await baseApi.http('POST', '/api/chat/invitations', {
            name: newContact.value.name,
            userId: userStore.user?.id,
        })
        if (error) {
            console.error('Failed to generate share link: ', error)
        } else if (data && data.status === 'success' && data.token) {
            shareLink.value = `${window.location.origin}/join-chat/${data.token}`
        }
    } catch (error) {
        console.error('Failed to generate share link: ', error)
    } finally {
        isGeneratingLink.value = false
    }
}

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(shareLink.value)
        copySuccess.value = true
        setTimeout(() => {
            copySuccess.value = false
        }, 2000)
    } catch (err) {
        console.error('Failed to copy text: ', err)
    }
}

// Экспортируем метод для открытия модалки добавления контакта из родителя
defineExpose({
    openAddContactModal: () => {
        showAddContactModal.value = true
    },
})

// const handleAddContact = () => {
//     if (newContact.value.name.trim()) {
//         contactsStore.addContact({
//             ...newContact.value,
//             lastMessageTime: new Date().toLocaleTimeString([], {
//                 hour: '2-digit',
//                 minute: '2-digit',
//             }),
//         })
//         showAddContactModal.value = false
//         newContact.value = {
//             name: '',
//             lastMessage: '',
//             lastMessageTime: '',
//             isOnline: false,
//             unreadCount: 0,
//             isActive: false,
//         }
//         shareLink.value = ''
//     }
// }

onMounted(() => {
    // Добавляем обработчик клика вне контекстного меню
    document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
    // Удаляем обработчик клика
    document.removeEventListener('click', hideContextMenu)
})

// Функция для переключения отображения поискового поля
const toggleSearch = () => {
    isSearchActive.value = !isSearchActive.value
    if (isSearchActive.value) {
        setTimeout(() => {
            const searchInput = document.querySelector('.search-input') as HTMLInputElement
            if (searchInput) searchInput.focus()
        }, 100)
    }
}

// Функция для скрытия поискового поля при потере фокуса (если в поле ничего не введено)
const hideSearchOnBlur = () => {
    if (!searchQuery.value) {
        isSearchActive.value = false
    }
}

// Функция для переключения отображения календаря
const toggleCalendar = () => {
    emit('toggle-calendar')
    emit('toggle-contacts')
}

// Функция для переключения отображения task manager
const toggleTask = () => {
    emit('toggle-task')
    emit('toggle-contacts')
}
</script>

<template>
    <div class="contacts-list">
        <div class="contacts-header">
            <button class="close-contacts" @click="emit('toggle-contacts')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                        fill="currentColor"
                    />
                </svg>
            </button>
            <h2>Contacts</h2>
        </div>

        <!-- Переделанный блок search-container -->
        <div class="search-container">
            <div class="icons-wrapper">
                <!-- Иконка таск-менеджера -->
                <!-- <button class="icon-button tasks-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                    >
                        <path
                            d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
                        />
                    </svg>
                </button> -->

                <!-- Иконка избранного
                <button class="icon-button favorites-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                    >
                        <path
                            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        />
                    </svg>
                </button> -->

                <!-- Иконка календаря -->
                <button class="icon-button calendar-icon" @click="toggleCalendar">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                    >
                        <!-- Основа календаря -->
                        <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="3"
                            ry="3"
                            fill="white"
                            stroke="#DDD"
                            stroke-width="1"
                        />

                        <!-- Красная шапка -->
                        <rect x="3" y="4" width="18" height="5" rx="3" ry="3" fill="#FF3B30" />
                        <rect x="3" y="7" width="18" height="2" fill="#FF3B30" />

                        <!-- Отверстия для пружин -->
                        <rect x="7" y="1" width="1.5" height="4" rx="0.75" fill="#CCC" />
                        <rect x="15.5" y="1" width="1.5" height="4" rx="0.75" fill="#CCC" />

                        <!-- Белые кольца на пружинах -->
                        <rect x="6.5" y="2" width="2.5" height="0.8" rx="0.4" fill="white" />
                        <rect x="15" y="2" width="2.5" height="0.8" rx="0.4" fill="white" />

                        <!-- Дата (крупная цифра) -->
                        <text
                            x="12"
                            y="18"
                            text-anchor="middle"
                            font-family="Arial, sans-serif"
                            font-size="8"
                            font-weight="bold"
                            fill="#333"
                        >
                            24
                        </text>

                        <!-- Дни недели (маленькие точки или линии) -->
                        <circle cx="6" cy="12" r="0.8" fill="#DDD" />
                        <circle cx="9" cy="12" r="0.8" fill="#DDD" />
                        <circle cx="12" cy="12" r="0.8" fill="#FF3B30" />
                        <circle cx="15" cy="12" r="0.8" fill="#DDD" />
                        <circle cx="18" cy="12" r="0.8" fill="#DDD" />
                    </svg>
                </button>

                <!-- Иконка task manager -->
                <button class="icon-button task-icon" @click="toggleTask">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                    >
                        <!-- Основа планшета -->
                        <rect
                            x="3"
                            y="2"
                            width="18"
                            height="20"
                            rx="2"
                            ry="2"
                            fill="#E8F5E8"
                            stroke="#4CAF50"
                            stroke-width="1"
                        />

                        <!-- Заголовок -->
                        <rect x="3" y="2" width="18" height="4" rx="2" ry="2" fill="#4CAF50" />
                        <circle cx="6" cy="4" r="0.5" fill="white" />
                        <circle cx="8" cy="4" r="0.5" fill="white" />
                        <circle cx="10" cy="4" r="0.5" fill="white" />

                        <!-- Чекбокс 1 (выполнен) -->
                        <rect x="5" y="8" width="2" height="2" rx="0.3" fill="#4CAF50" />
                        <path
                            d="M5.4 9L6 9.6L7.6 8"
                            stroke="white"
                            stroke-width="0.3"
                            fill="none"
                        />
                        <line x1="8.5" y1="9" x2="16" y2="9" stroke="#4CAF50" stroke-width="0.8" />

                        <!-- Чекбокс 2 (выполнен) -->
                        <rect x="5" y="11.5" width="2" height="2" rx="0.3" fill="#4CAF50" />
                        <path
                            d="M5.4 12.5L6 13.1L7.6 11.5"
                            stroke="white"
                            stroke-width="0.3"
                            fill="none"
                        />
                        <line
                            x1="8.5"
                            y1="12.5"
                            x2="14"
                            y2="12.5"
                            stroke="#4CAF50"
                            stroke-width="0.8"
                        />

                        <!-- Чекбокс 3 (невыполнен) -->
                        <rect
                            x="5"
                            y="15"
                            width="2"
                            height="2"
                            rx="0.3"
                            fill="white"
                            stroke="#DDD"
                            stroke-width="0.5"
                        />
                        <line x1="8.5" y1="16" x2="18" y2="16" stroke="#BBB" stroke-width="0.8" />

                        <!-- Чекбокс 4 (невыполнен) -->
                        <rect
                            x="5"
                            y="18.5"
                            width="2"
                            height="2"
                            rx="0.3"
                            fill="white"
                            stroke="#DDD"
                            stroke-width="0.5"
                        />
                        <line
                            x1="8.5"
                            y1="19.5"
                            x2="15"
                            y2="19.5"
                            stroke="#BBB"
                            stroke-width="0.8"
                        />
                    </svg>
                </button>

                <!-- Иконка блогов -->
                <!-- <button class="icon-button blog-icon" @click="toggleNews">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                    >
                        <path
                            d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                        />
                        <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                </button> -->

                <!-- Иконка заметок -->
                <button class="icon-button notes-icon" @click="toggleNotes">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                    >
                        <!-- Основа блокнота -->
                        <rect x="3" y="2" width="18" height="20" rx="3" ry="3" fill="#FFC107" />
                        <!-- Белая область для линий -->
                        <rect x="3" y="8" width="18" height="14" rx="0" ry="0" fill="white" />
                        <!-- Линии на странице -->
                        <line x1="5" y1="11" x2="19" y2="11" stroke="#E0E0E0" stroke-width="1" />
                        <line x1="5" y1="14" x2="19" y2="14" stroke="#E0E0E0" stroke-width="1" />
                        <line x1="5" y1="17" x2="19" y2="17" stroke="#E0E0E0" stroke-width="1" />
                        <line x1="5" y1="20" x2="19" y2="20" stroke="#E0E0E0" stroke-width="1" />
                        <!-- Красная полоса слева -->
                        <line x1="6.5" y1="8" x2="6.5" y2="22" stroke="#FF5252" stroke-width="1" />
                    </svg>
                </button>

                <!-- Кнопка добавления контакта (человечек с плюсиком) -->
                <button class="icon-button add-contact-button" @click="showAddContactModal = true">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                    >
                        <!-- Фон карточки контакта -->
                        <rect
                            x="2"
                            y="4"
                            width="20"
                            height="16"
                            rx="3"
                            ry="3"
                            fill="#F8F9FA"
                            stroke="#E0E0E0"
                            stroke-width="1"
                        />

                        <!-- Аватар пользователя -->
                        <circle cx="8" cy="10" r="2.5" fill="#007AFF" />
                        <path
                            d="M6.5 9.2C6.5 8.5 7 8 7.5 8S8.5 8.5 8.5 9.2C8.5 9.9 8 10.4 7.5 10.4S6.5 9.9 6.5 9.2Z"
                            fill="white"
                        />
                        <path
                            d="M5.5 12.5C5.5 11.7 6.3 11 7.5 11S9.5 11.7 9.5 12.5V13H5.5V12.5Z"
                            fill="white"
                        />

                        <!-- Линии информации -->
                        <rect x="12" y="8" width="6" height="1" rx="0.5" fill="#DDD" />
                        <rect x="12" y="10.5" width="8" height="1" rx="0.5" fill="#DDD" />
                        <rect x="12" y="13" width="4" height="1" rx="0.5" fill="#DDD" />

                        <!-- Плюсик -->
                        <!-- Тень плюсика -->
                        <circle cx="17.7" cy="6.7" r="4" fill="rgba(0,0,0,0.15)" />
                        <!-- Основной круг плюсика -->
                        <circle
                            cx="17.5"
                            cy="6.5"
                            r="4"
                            fill="#28A745"
                            stroke="white"
                            stroke-width="2.5"
                        />
                        <!-- Черная обводка вертикальной линии -->
                        <line
                            x1="17.5"
                            y1="3.5"
                            x2="17.5"
                            y2="9.5"
                            stroke="#000"
                            stroke-width="4"
                            stroke-linecap="round"
                        />
                        <!-- Черная обводка горизонтальной линии -->
                        <line
                            x1="14.5"
                            y1="6.5"
                            x2="20.5"
                            y2="6.5"
                            stroke="#000"
                            stroke-width="4"
                            stroke-linecap="round"
                        />
                        <!-- Белая вертикальная линия плюса -->
                        <line
                            x1="17.5"
                            y1="3.5"
                            x2="17.5"
                            y2="9.5"
                            stroke="white"
                            stroke-width="2.5"
                            stroke-linecap="round"
                        />
                        <!-- Белая горизонтальная линия плюса -->
                        <line
                            x1="14.5"
                            y1="6.5"
                            x2="20.5"
                            y2="6.5"
                            stroke="white"
                            stroke-width="2.5"
                            stroke-linecap="round"
                        />
                    </svg>
                </button>

                <!-- Кнопка поиска, которая активирует поле ввода -->
                <button class="icon-button search-toggle-button" @click="toggleSearch">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                    >
                        <path
                            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                        />
                    </svg>
                </button>
            </div>

            <!-- Скрытый инпут для поиска, который будет показываться при нажатии на кнопку поиска -->
            <div class="search-input-wrapper" :class="{ active: isSearchActive }">
                <input
                    v-model="searchQuery"
                    type="text"
                    class="search-input"
                    placeholder="Search contacts"
                    @blur="hideSearchOnBlur"
                />
                <button class="close-search-button" @click="isSearchActive = false">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
        </div>

        <!-- <div class="news-button-container">
            <button class="news-button" :class="{ active: showNews }" @click="toggleNews">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                >
                    <path
                        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 9H4v-3h7v3zm0-4H4V6h7v3zm9 4h-7v-3h7v3zm0-4h-7V6h7v3z"
                    />
                </svg>
                <span>Новости</span>
                <span v-if="unreadNewsCount > 0" class="news-unread-count">{{
                    unreadNewsCount
                }}</span>
            </button>
        </div> -->

        <div class="contacts-list-container">
            <!-- Loader overlay -->
            <LoaderOverlay :show="contactsStore.isLoading" />

            <TransitionGroup name="contact-list" tag="div" v-if="!contactsStore.isLoading">
                <div
                    v-for="contact in filteredContacts"
                    :key="contact.id"
                    class="contact"
                    :class="{ active: contact.isActive }"
                    @click="handleContactClick(contact)"
                    @contextmenu="showContextMenu($event, contact)"
                >
                    <div class="contact-avatar">
                        <div class="avatar">{{ getInitials(contact.name) }}</div>
                        <div class="status-indicator" :class="{ online: contact.isOnline }"></div>
                    </div>

                    <div class="contact-details">
                        <div class="contact-header">
                            <span class="contact-name">{{ contact.name }}</span>
                            <span class="message-time">{{ contact.lastMessageTime }}</span>
                        </div>
                        <div class="contact-message">
                            <p class="last-message">{{ contact.lastMessage }}</p>
                            <span v-if="contact.unreadCount" class="unread-count">
                                {{ contact.unreadCount }}
                            </span>
                        </div>
                    </div>
                </div>
            </TransitionGroup>

            <div
                v-if="filteredContacts.length === 0 && !contactsStore.isLoading && !searchQuery"
                class="no-results"
            >
                No contacts yet. Add your first contact!
            </div>

            <div
                v-if="filteredContacts.length === 0 && !contactsStore.isLoading && searchQuery"
                class="no-results"
            >
                No contacts found for "{{ searchQuery }}"
            </div>
        </div>

        <!-- Контекстное меню -->
        <div
            v-if="contextMenu.show"
            class="context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
        >
            <div v-if="contextMenu.isEditing" class="edit-mode">
                <input
                    v-model="contextMenu.editName"
                    type="text"
                    class="edit-input"
                    @keyup.enter="saveEdit"
                    @keyup.esc="cancelEdit"
                    ref="editInput"
                />
                <div class="edit-actions">
                    <button @click="saveEdit" class="edit-button save">Save</button>
                    <button @click="cancelEdit" class="edit-button cancel">Cancel</button>
                </div>
            </div>
            <div v-else class="menu-items">
                <button @click.stop="startEditing" class="menu-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.05C21.1 6.66 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.34 2.9 16.95 3.29L15.66 4.58L19.42 8.34L20.71 7.05Z"
                            fill="currentColor"
                        />
                    </svg>
                    Edit
                </button>
                <button @click.stop="deleteContact" class="menu-item delete">
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

        <!-- Модальное окно добавления контакта -->
        <div v-if="showAddContactModal" class="modal-overlay" @click="showAddContactModal = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Add New Contact</h3>
                    <button class="close-modal-button" @click="showAddContactModal = false">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <div class="modal-form">
                    <div class="form-group">
                        <label for="contactName">Name</label>
                        <input
                            id="contactName"
                            v-model="newContact.name"
                            type="text"
                            class="form-input"
                            placeholder="Enter contact name"
                            @keyup.enter="generateShareLink"
                        />
                    </div>
                    <div class="form-group">
                        <label>Share Link</label>
                        <div class="share-link-container">
                            <input
                                v-model="shareLink"
                                type="text"
                                class="form-input share-link-input"
                                readonly
                                placeholder="Click Generate to create link"
                            />
                            <button
                                class="copy-button"
                                @click="copyToClipboard"
                                :class="{ success: copySuccess }"
                            >
                                <svg
                                    v-if="!copySuccess"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M16 1H4C3 1 2 2 2 3V17H4V3H16V1ZM19 5H8C7 5 6 6 6 7V21C6 22 7 23 8 23H19C20 23 21 22 21 21V7C21 6 20 5 19 5ZM19 21H8V7H19V21Z"
                                        fill="currentColor"
                                    />
                                </svg>
                                <svg
                                    v-else
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="cancel-button" @click="showAddContactModal = false">
                            Cancel
                        </button>
                        <button
                            class="save-button"
                            @click="generateShareLink"
                            :disabled="isGeneratingLink"
                        >
                            <span v-if="isGeneratingLink">Generating...</span>
                            <span v-else>Generate Link</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.contacts-list {
    background-color: white;
    border-right: 1px solid var(--border-color);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.dark-theme .contacts-list {
    background-color: #1e1e1e;
    border-right: 1px solid #444;
}

.contacts-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
}

.dark-theme .contacts-header {
    border-bottom: 1px solid #444;
    background-color: #0d47a1;
}

.contacts-header h2 {
    flex: 1;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
}

.dark-theme .contacts-header h2 {
    color: white;
}

.close-contacts {
    display: none;
    background: transparent;
    border: none;
    padding: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
    color: var(--text-color);
}

.close-contacts svg {
    width: 24px;
    height: 24px;
}

.close-contacts:hover {
    opacity: 0.8;
}

.search-container {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    gap: 14px;
    align-items: center;
    position: relative;
    min-height: 66px;
}

.icons-wrapper {
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    justify-content: space-around;
    padding: 0 5px;
}

.icon-button {
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;
    color: var(--text-color);
    position: relative;
}

.icon-button svg {
    width: 40px;
    height: 40px;
}

.icon-button:after {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 50%;
    z-index: -1;
    opacity: 0;
    transition: all 0.25s ease;
}

.icon-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
    transform: scale(1.15);
}

.dark-theme .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.icon-button:hover:after {
    opacity: 0.15;
}

.tasks-icon:hover:after {
    background-color: #4caf50;
}

.favorites-icon:hover:after {
    background-color: #ffc107;
}

.calendar-icon:hover:after {
    background-color: #ff3b30;
}

.task-icon:hover:after {
    background-color: #4caf50;
}

.blog-icon:hover:after {
    background-color: #03a9f4;
}

.notes-icon:hover:after {
    background-color: #ffc107;
}

.add-contact-button:hover:after {
    background-color: #28a745;
}

.search-toggle-button:hover:after {
    background-color: #607d8b;
}

.search-input-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    display: flex;
    align-items: center;
    padding: 0 20px;
    z-index: 10;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
}

.dark-theme .search-input-wrapper {
    background-color: #1e1e1e;
}

.search-input-wrapper.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.search-input {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 14px;
    background-color: #f8f9fa;
    transition: all 0.2s ease;
    height: 40px;
}

.close-search-button {
    background: none;
    border: none;
    padding: 8px;
    margin-left: 8px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
}

.close-search-button svg {
    width: 18px;
    height: 18px;
}

.dark-theme .search-input {
    background-color: #333;
    border-color: #444;
    color: #e0e0e0;
}

.dark-theme .search-input:focus {
    border-color: var(--primary-color);
    background-color: #444;
    box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.2);
}

.add-contact-button {
    font-size: 0;
}

.blog-icon {
    color: #03a9f4; /* Голубой цвет для блогов */
    font-size: 0;
}

.notes-icon {
    font-size: 0;
}

.calendar-icon {
    font-size: 0;
}

.task-icon {
    font-size: 0;
}

.tasks-icon {
    color: #4caf50; /* Зеленый цвет для задач */
    font-size: 0;
}

.favorites-icon {
    color: #ffc107; /* Золотистый цвет для избранного */
    font-size: 0;
}

.contacts-list-container {
    position: relative;
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

/* Переопределяем стили лоадера для контейнера контактов */
.contacts-list-container .loader-overlay {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    border-radius: 0;
}

.dark-theme .contacts-list-container .loader-overlay {
    background-color: rgba(30, 30, 30, 0.9);
}

.contacts-list-container::-webkit-scrollbar {
    width: 5px;
}

.contacts-list-container::-webkit-scrollbar-track {
    background: transparent;
}

.contacts-list-container::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.contact {
    padding: 12px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.dark-theme .contact {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.contact-avatar {
    position: relative;
    flex-shrink: 0;
}

.avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background-color: var(--primary-color);
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 500;
    font-size: 16px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #dee2e6;
    border: 2px solid white;
    position: absolute;
    bottom: 0;
    right: 0;
    transition: all 0.2s ease;
}

.dark-theme .status-indicator {
    border-color: #1e1e1e;
}

.status-indicator.online {
    background-color: #28a745;
    box-shadow: 0 0 5px rgba(40, 167, 69, 0.5);
}

.contact-details {
    flex: 1;
    min-width: 0;
}

.contact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.contact-name {
    font-weight: 500;
    font-size: 15px;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dark-theme .contact-name {
    color: #e0e0e0;
}

.message-time {
    font-size: 12px;
    color: #6c757d;
    white-space: nowrap;
    margin-left: 8px;
}

.dark-theme .message-time {
    color: #adb5bd;
}

.contact-message {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.last-message {
    margin: 0;
    font-size: 13px;
    color: #6c757d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}

.dark-theme .last-message {
    color: #adb5bd;
}

.contact:hover {
    background-color: rgba(26, 115, 232, 0.05);
}

.dark-theme .contact:hover {
    background-color: rgba(100, 181, 246, 0.1);
}

.contact.active {
    background-color: rgba(26, 115, 232, 0.1);
}

.dark-theme .contact.active {
    background-color: rgba(100, 181, 246, 0.15);
}

.contact.active .contact-name {
    color: var(--primary-color);
    font-weight: 600;
}

.contact.active .status-indicator.online {
    background-color: #2ecc71;
    box-shadow: 0 0 5px rgba(46, 204, 113, 0.5);
}

.unread-count {
    background-color: var(--primary-color);
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 12px;
    min-width: 22px;
    height: 22px;
    text-align: center;
    font-weight: 500;
    flex-shrink: 0;
}

.no-results {
    padding: 30px 20px;
    text-align: center;
    color: #6c757d;
    font-size: 14px;
}

.dark-theme .no-results {
    color: #adb5bd;
}

.news-button-container {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
}

.news-button {
    width: 100%;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.news-button:hover {
    background-color: var(--accent-color);
}

.news-button.active {
    background-color: #0d47a1;
    box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.3);
}

.dark-theme .news-button {
    background-color: #0d47a1;
}

.dark-theme .news-button:hover {
    background-color: #1565c0;
}

.dark-theme .news-button.active {
    background-color: #1565c0;
    box-shadow: 0 0 0 3px rgba(13, 71, 161, 0.5);
}

.dark-theme .news-button-container {
    border-bottom: 1px solid #444;
}

.news-unread-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #ff4d4f;
    color: white;
    border-radius: 12px;
    padding: 2px 6px;
    font-size: 12px;
    min-width: 20px;
    height: 20px;
    text-align: center;
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    border: 2px solid white;
}

.dark-theme .news-unread-count {
    background-color: #f5222d;
    border-color: #1e1e1e;
}

@media (max-width: 768px) {
    .contacts-list {
        background-color: white;
        width: 100%;
        max-width: 100%;
    }

    .dark-theme .contacts-list {
        background-color: #1e1e1e;
    }

    .contacts-header {
        padding: 14px 16px;
        background-color: var(--primary-color);
        color: white;
    }

    .contacts-header h2 {
        color: white;
    }

    .close-contacts {
        display: block;
        color: white;
    }

    .close-contacts svg path {
        fill: white;
    }

    .search-container {
        padding: 8px 12px;
        flex-direction: row;
        align-items: center;
        min-height: 54px;
    }

    .search-input-wrapper {
        flex: 1;
    }

    .contact {
        padding: 12px 16px;
    }

    .contacts-list-container::-webkit-scrollbar {
        display: none;
    }

    .contacts-list-container {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .last-message {
        max-width: 200px;
    }

    .news-button-container {
        padding: 12px 16px;
    }

    .news-unread-count {
        top: -5px;
        right: -5px;
        font-size: 11px;
        min-width: 18px;
        height: 18px;
        padding: 1px 5px;
    }

    .add-contact-button {
        width: auto;
        min-width: 60px;
        padding: 6px 10px;
    }

    .modal-content {
        width: 95%;
        padding: 20px;
    }

    .icon-button svg {
        width: 32px;
        height: 32px;
    }
}

/* Анимации для списка контактов */
.contact-list-move,
.contact-list-enter-active,
.contact-list-leave-active {
    transition: all 0.3s ease;
}

.contact-list-enter-from,
.contact-list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

.contact-list-leave-active {
    position: absolute;
}

.contact-edit-mode {
    flex: 1;
    margin-right: 8px;
}

.contact-edit-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 15px;
    background-color: white;
    color: var(--text-color);
}

.dark-theme .contact-edit-input {
    background-color: #333;
    border-color: #444;
    color: #e0e0e0;
}

.contact-edit-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.dark-theme .contact-edit-input:focus {
    box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.2);
}

.context-menu {
    position: fixed;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px;
    z-index: 1000;
    min-width: 150px;
    user-select: none;
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
    outline: none;
}

.dark-theme .edit-input {
    background-color: #333;
    border-color: #444;
    color: #e0e0e0;
}

.edit-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.dark-theme .edit-input:focus {
    box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.2);
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

.contact {
    cursor: pointer;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dark-theme .modal-content {
    background-color: #2a2a2a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
}

.modal-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
}

.form-input {
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
    color: var(--text-color);
    outline: none;
}

.dark-theme .form-input {
    background-color: #333;
    border-color: #444;
    color: #e0e0e0;
}

.form-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.dark-theme .form-input:focus {
    box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.2);
}

.form-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
}

.cancel-button,
.save-button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    transform: translateY(0) scale(1);
}

.cancel-button {
    background-color: #e9ecef;
    color: #6c757d;
}

.dark-theme .cancel-button {
    background-color: #444;
    color: #adb5bd;
}

.save-button {
    background-color: var(--primary-color);
    color: white;
}

.cancel-button:hover {
    background-color: #dee2e6;
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .cancel-button:hover {
    background-color: #555;
}

.save-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

.cancel-button:active,
.save-button:active {
    transform: translateY(1px) scale(0.98);
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-button:active {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.save-button:active {
    box-shadow: 0 2px 6px rgba(26, 115, 232, 0.4);
}

.cancel-button::before,
.save-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition:
        width 0.3s ease,
        height 0.3s ease;
}

.cancel-button:active::before,
.save-button:active::before {
    width: 150px;
    height: 150px;
}

.save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.save-button:disabled:hover {
    transform: none;
    box-shadow: none;
    background-color: var(--primary-color);
}

.save-button:disabled::before {
    display: none;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
}

.close-modal-button {
    position: absolute;
    top: -12px;
    right: -12px;
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--text-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .close-modal-button {
    background-color: #2a2a2a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.close-modal-button svg {
    width: 20px;
    height: 20px;
}

.close-modal-button:hover {
    background-color: #f8f9fa;
    transform: scale(1.1);
}

.dark-theme .close-modal-button:hover {
    background-color: #333;
}

.share-link-container {
    display: flex;
    gap: 8px;
    align-items: center;
}

.share-link-input {
    flex: 1;
}

.copy-button {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--text-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.copy-button svg {
    width: 20px;
    height: 20px;
}

.copy-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .copy-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.copy-button.success {
    color: #28a745;
}

.dark-theme .copy-button.success {
    color: #2ecc71;
}

.search-toggle-button {
    color: #607d8b; /* Серо-синий цвет для поиска */
    font-size: 0;
}
</style>
