<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import VoiceInput from './VoiceInput.vue'

// Добавляем проп для управления отображением шапки
defineProps({
    hideHeader: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['toggle-contacts'])

interface NewsItem {
    id: string | number
    userId: string | number
    userName: string
    userAvatar?: string
    title: string
    description: string
    images?: string[]
    timeAgo: string
}

// Демонстрационные данные
const newsItems = ref<NewsItem[]>([
    {
        id: 1,
        userId: 1,
        userName: 'John Doe',
        // userAvatar: '/avatars/user1.png',
        title: 'Vue 3 Composition API Guide',
        description:
            'When using a language model for code completion, we typically want the model to produce a completion that begins with what the user has typed.However, modern language models operate on sequences of tokens, not characters, so naively tokenizing the users input and sending it to the model produces wrong results if the users cursor doesnt happen to lie on a token boundary.Instead, we need an algorithm that samples a sequence of tokens conditional on a prefix of characters, rather than the more typical case of sampling conditional on a prefix of tokens.We call this character prefix conditioning, an algorithm for sampling a sequence of tokens conditioned on a character prefix.Just found this amazing article about Vue 3 composition API and how it changes the way we build Vue apps!',
        images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
        ],
        timeAgo: '3h ago',
    },
    {
        id: 2,
        userId: 2,
        userName: 'Mary Johnson',
        title: 'Book Recommendation',
        description: 'Just finished reading this amazing book. Highly recommend it to everyone!',
        images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
        ],
        timeAgo: '5 hours ago',
    },
    {
        id: 3,
        userId: 3,
        userName: 'Alex Wilson',
        title: 'New Job at Google!',
        description:
            'Just got a new job at Google! So excited to start this new chapter in my life.',
        timeAgo: '1 day ago',
    },
    {
        id: 4,
        userId: 4,
        userName: 'Helen Brown',
        title: 'Dinner at Italian Restaurant',
        description:
            'Had a wonderful dinner with friends last night at the new Italian restaurant downtown. The pasta was incredible!',
        images: [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
        ],
        timeAgo: '1 day ago',
    },
    {
        id: 5,
        userId: 5,
        userName: 'James Wilson',
        title: 'iPhone Upgrade Thoughts',
        description:
            "Thoughts on the new iPhone? Thinking about upgrading but not sure if it's worth it.",
        timeAgo: '2 days ago',
    },
    {
        id: 6,
        userId: 6,
        userName: 'Sarah Parker',
        title: 'Trip to Japan - Tokyo & Kyoto',
        description:
            'Just came back from my trip to Japan! Here are some pictures from Tokyo and Kyoto. The culture, food, and people were amazing!',
        images: [
            'https://images.unsplash.com/photo-1528360983277-13d401cdc186?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        ],
        timeAgo: '3 days ago',
    },
    {
        id: 7,
        userId: 7,
        userName: 'Michael Chen',
        title: 'First Marathon Completed!',
        description:
            'Just completed my first marathon! It was tough but so rewarding. Thanks to everyone who supported me along the way.',
        images: [
            'https://images.unsplash.com/photo-1528360983277-13d401cdc186?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        ],
        timeAgo: '5 days ago',
    },
])

// Лайки и комментарии убраны из интерфейса

// Получение инициалов пользователя
const getUserInitials = (name: string) => {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

// Добавляем функцию для перехода к детальному просмотру
const router = useRouter()

// Подробный просмотр новости
const viewNewsDetail = (newsId: string | number) => {
    router.push(`/news/${newsId}`)
}

const showCreateNews = ref(false)
const goToCreatePost = () => {
    showCreateNews.value = true
}

const closeCreatePost = () => {
    showCreateNews.value = false
    // Reset form state
    newsTitle.value = ''
    newsDescription.value = ''
    newsImages.value = []
    error.value = ''
}

// Переменные для создания новости
const newsTitle = ref('')
const newsDescription = ref('')
const newsImages = ref<string[]>([])
const isLoading = ref(false)
const error = ref('')

// Обработка загрузки изображений
const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    // Максимум 5 изображений
    if (newsImages.value.length + input.files.length > 5) {
        error.value = 'You can upload maximum 5 images'
        return
    }

    Array.from(input.files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === 'string') {
                newsImages.value.push(e.target.result)
            }
        }
        reader.readAsDataURL(file)
    })

    // Сбрасываем значение input чтобы можно было загружать одинаковые файлы
    input.value = ''
}

// Удаление изображения из предпросмотра
const removeImage = (index: number) => {
    newsImages.value.splice(index, 1)
}

// Voice input handlers
const handleTitleVoiceInput = (text: string) => {
    newsTitle.value = newsTitle.value ? newsTitle.value + ' ' + text : text
}

const handleDescriptionVoiceInput = (text: string) => {
    newsDescription.value = newsDescription.value ? newsDescription.value + ' ' + text : text
}

// Функция для публикации новости
const postNews = async () => {
    if (!newsTitle.value.trim()) {
        error.value = 'Please enter a title for your post'
        return
    }

    if (!newsDescription.value.trim()) {
        error.value = 'Please enter some content for your post'
        return
    }

    isLoading.value = true
    error.value = ''

    try {
        // Симуляция отправки на сервер
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Создаем новый объект новости
        const newPost = {
            id: `news-${Date.now()}`,
            userId: 'current-user',
            userName: 'You',
            userAvatar: '/avatars/user1.png',
            title: newsTitle.value,
            description: newsDescription.value,
            images: [...newsImages.value],
            timeAgo: 'Just now',
        }

        // Добавляем в начало списка
        newsItems.value.unshift(newPost)

        // Сбрасываем форму
        newsTitle.value = ''
        newsDescription.value = ''
        newsImages.value = []

        // Закрываем форму создания новости
        showCreateNews.value = false
    } catch (err) {
        error.value = 'Failed to post news. Please try again.'
        console.error('Error posting news:', err)
    } finally {
        isLoading.value = false
    }
}

const windowWidth = ref(window.innerWidth)

onMounted(() => {
    window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateWindowWidth)
})

function updateWindowWidth() {
    windowWidth.value = window.innerWidth
}
</script>

<template>
    <div class="news-feed" :class="{ 'no-padding': hideHeader }">
        <!-- Встроенная шапка для режима hideHeader=true (embedded режим) -->
        <div v-if="hideHeader" class="chat-header">
            <button class="back-button" @click="emit('toggle-contacts')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
            <h2>Notes</h2>
            <button class="create-post-icon-button" @click="goToCreatePost" title="Create Post">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                <!-- <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg> -->
            </button>
            <!-- <div class="header-buttons">
                <MenuButton />
            </div> -->
        </div>

        <!-- Основная шапка для standalone режима -->
        <div v-if="!hideHeader" class="news-header">
            <button class="back-button" @click="emit('toggle-contacts')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
            <h2>Notes</h2>
            <button class="create-post-button" @click="goToCreatePost">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                    class="add-icon"
                >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                <span>Create Post</span>
            </button>
        </div>

        <div
            v-if="showCreateNews"
            class="create-news-content"
            :class="{ 'mobile-container': windowWidth <= 768 }"
        >
            <div class="news-form">
                <div class="form-header">
                    <h3>Create News Post</h3>
                    <button class="close-button" @click="closeCreatePost">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="currentColor"
                        >
                            <path
                                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                            />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="postNews">
                    <div class="error-message" v-if="error">{{ error }}</div>
                    <div class="form-group">
                        <div class="input-with-voice">
                            <input
                                id="news-title"
                                v-model="newsTitle"
                                class="content-input"
                                placeholder="Enter title..."
                                type="text"
                            />
                            <VoiceInput @text-recognized="handleTitleVoiceInput" />
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-with-voice">
                            <textarea
                                id="news-content"
                                v-model="newsDescription"
                                class="content-input"
                                placeholder="What's on your mind?"
                                rows="4"
                            ></textarea>
                            <VoiceInput @text-recognized="handleDescriptionVoiceInput" />
                        </div>
                    </div>

                    <div class="form-group no-margin">
                        <div class="upload-label">Add Photos</div>
                        <div class="image-upload-container">
                            <label for="image-upload" class="image-upload-label">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"
                                    />
                                </svg>
                                <span>Upload Image</span>
                            </label>
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                multiple
                                class="hidden-upload"
                                @change="handleImageUpload"
                            />
                        </div>

                        <!-- Preview of uploaded images -->
                        <div v-if="newsImages.length > 0" class="image-previews">
                            <div
                                v-for="(image, index) in newsImages"
                                :key="index"
                                class="image-preview"
                            >
                                <img :src="image" alt="Preview" />
                                <button class="remove-image" @click="removeImage(index)">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="publish-button" :disabled="isLoading">
                        {{ isLoading ? 'Publishing...' : 'Publish' }}
                    </button>
                </form>
            </div>
        </div>

        <div v-else class="news-content-container">
            <div class="news-items-grid">
                <div
                    class="news-item"
                    v-for="item in newsItems"
                    :key="item.id"
                    :title="item.description"
                >
                    <div class="news-header">
                        <div class="news-user">
                            <div class="user-avatar" v-if="item.userAvatar">
                                <img :src="item.userAvatar" alt="User Avatar" />
                            </div>
                            <div class="user-avatar-placeholder" v-else>
                                {{ getUserInitials(item.userName) }}
                            </div>
                            <div class="user-info">
                                <div class="user-name">{{ item.userName }}</div>
                                <div class="post-time">{{ item.timeAgo }}</div>
                            </div>
                        </div>
                        <button class="more-button">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                fill="currentColor"
                            >
                                <path
                                    d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                                />
                            </svg>
                        </button>
                    </div>

                    <div class="news-content" @click="viewNewsDetail(item.id)">
                        <h3 class="news-title">{{ item.title }}</h3>
                        <p>{{ item.description }}</p>

                        <div
                            v-if="item.images && item.images.length > 0"
                            class="news-images"
                            :class="{
                                'single-image': item.images.length === 1,
                                'multi-image': item.images.length > 1,
                            }"
                        >
                            <div
                                v-for="(image, index) in item.images"
                                :key="index"
                                class="news-image"
                            >
                                <img
                                    :src="image"
                                    :alt="`${item.userName}'s post image ${index + 1}`"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="news-actions">
                        <button class="action-button">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="currentColor"
                            >
                                <path
                                    d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"
                                />
                            </svg>
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="load-more">
                <button class="load-more-button">Load More</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.news-feed {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 12px 0;
    height: 100vh;
    min-width: 0;
    overflow: hidden;
    background-color: var(--background-color);
}

.news-feed.no-padding {
    padding: 0;
    height: 100%;
}

.news-items-grid {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    gap: 16px;
}

.dark-theme .news-items-grid {
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.news-items-grid::-webkit-scrollbar {
    width: 5px;
}

.news-items-grid::-webkit-scrollbar-track {
    background: transparent;
}

.news-items-grid::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.no-padding .news-items-grid {
    padding: 12px;
}

.news-item {
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    width: 100%;
    box-sizing: border-box;
    height: auto;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
}

.dark-theme .news-item {
    background-color: #242424;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid #3a3a3a;
}

.news-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.dark-theme .news-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    border-color: #444;
}

.news-item .news-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dark-theme .news-item .news-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.news-feed > .news-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    /* Без рамки, как в ChatArea, чтобы высота совпадала пиксель-в-пиксель */
    border-bottom: none;
    background-color: rgba(255, 193, 7, 0.7);
    color: white;
    justify-content: space-between;
    box-shadow: var(--box-shadow);
}

.news-feed > .news-header h2 {
    flex: 1;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
}

.back-to-chat-button {
    display: flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: white;
    font-size: 14px;
    transition: opacity 0.2s;
}

.back-button,
.menu-button {
    background: transparent;
    border: none;
    /* Компактные размеры как в ChatArea */
    padding: 0;
    width: 24px;
    height: 24px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    cursor: pointer;
    transition: opacity 0.2s;
}

.back-button svg,
.menu-button svg {
    width: 24px;
    height: 24px;
}

.back-button:hover,
.menu-button:hover {
    opacity: 0.8;
}

.back-to-chat-button svg {
    width: 20px;
    height: 20px;
}

.back-to-chat-button:hover {
    opacity: 0.8;
}

.news-user {
    display: flex;
    align-items: center;
}

.user-avatar,
.user-avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
    overflow: hidden;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-color) 0%, #3b82f6 100%);
    color: white;
    font-size: 18px;
    font-weight: 600;
    border: 2px solid white;
    box-shadow: 0 4px 10px rgba(26, 115, 232, 0.3);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1;
}

.user-avatar-placeholder::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    z-index: -1;
    background: transparent;
    box-shadow: 0 0 10px 2px rgba(26, 115, 232, 0.15);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.news-item:hover .user-avatar-placeholder::after {
    opacity: 1;
}

.dark-theme .user-avatar-placeholder {
    background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
    border-color: #333;
    box-shadow: 0 4px 10px rgba(13, 71, 161, 0.5);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 600;
    font-size: 16px;
    color: #111827;
}

.dark-theme .user-name {
    color: #f3f4f6;
}

.post-time {
    font-size: 13px;
    color: #6b7280;
}

.dark-theme .post-time {
    color: #9ca3af;
}

.more-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.more-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .more-button {
    color: #9ca3af;
}

.dark-theme .more-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.news-content {
    padding: 0 16px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.news-content:hover {
    background-color: rgba(0, 0, 0, 0.01);
}

.news-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.3;
}

.dark-theme .news-title {
    color: #f3f4f6;
}

.news-content p {
    margin: 0 0 12px;
    line-height: 1.45;
    color: var(--text-color);
    font-size: 15px;
}

.dark-theme .news-content p {
    color: #e0e0e0;
}

.news-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin-top: 12px;
    width: 100%;
}

.single-image.news-images {
    display: block;
    margin-top: 12px;
}

.news-image {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    width: 100%;
    aspect-ratio: 16/9;
}

.news-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.news-image:hover img {
    transform: scale(1.03);
}

/* Одиночные изображения */
.single-image .news-image {
    max-height: 500px;
    aspect-ratio: auto;
    padding-bottom: 60%; /* Соотношение сторон примерно 5:3 */
}

/* Мультиизображения */
.multi-image {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
}

.image-previews {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    margin: 10px 0;
}

.image-preview {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    width: 100%;
    padding-bottom: 75%; /* Соотношение сторон 4:3 */
}

.image-preview img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-image {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
}

.remove-image:hover {
    background: rgba(0, 0, 0, 0.7);
}

.remove-image svg {
    width: 16px;
    height: 16px;
}

.hidden-upload {
    display: none;
}

.image-upload-label {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background-color: #f3f4f6;
    color: #374151;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 14px;
}

.dark-theme .image-upload-label {
    background-color: #2d2d2d;
    color: #e0e0e0;
}

.image-upload-label:hover {
    background-color: #e5e7eb;
}

.dark-theme .image-upload-label:hover {
    background-color: #3d3d3d;
}

.image-upload-label svg {
    width: 18px;
    height: 18px;
    margin-right: 6px;
}

.news-actions {
    display: flex;
    padding: 10px 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    gap: 12px;
}

.dark-theme .news-actions {
    border-top-color: #333;
}

.action-button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-color);
    padding: 8px 12px;
    border-radius: 20px;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
}

.dark-theme .action-button {
    color: #adb5bd;
}

.action-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--primary-color);
}

.dark-theme .action-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #64b5f6;
}

.action-button.liked {
    color: var(--primary-color);
}

.dark-theme .action-button.liked {
    color: #64b5f6;
}

.action-button svg {
    opacity: 0.8;
}

.action-button:hover svg {
    opacity: 1;
}

.load-more {
    display: flex;
    justify-content: center;
    padding: 16px;
    background-color: #ffffff;
    border-top: 1px solid #e5e7eb;
}

.dark-theme .load-more {
    background-color: #1e1e1e;
    border-top: 1px solid #333;
}

.load-more-button {
    background-color: #f3f4f6;
    color: #4b5563;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.load-more-button:hover {
    background-color: #e5e7eb;
}

.dark-theme .load-more-button {
    background-color: #2d2d2d;
    color: #d1d5db;
}

.dark-theme .load-more-button:hover {
    background-color: #3d3d3d;
}

.create-post-icon-button {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    /* Совмещаем с высотой хедера за счёт отсутствия внутренних отступов */
    padding: 0;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.create-post-icon-button:hover {
    background: rgba(255, 255, 255, 0.2);
}

.create-post-icon-button svg {
    width: 20px;
    height: 20px;
}

@media (max-width: 768px) {
    .news-feed {
        gap: 12px;
        width: 100%;
        max-width: 100%;
        padding: 8px 6px 0;
        margin: 0;
    }

    .news-feed.no-padding {
        padding: 0;
        gap: 8px;
    }

    .news-items-grid {
        display: flex;
        flex-direction: column;
        padding: 10px;
    }

    .no-padding .news-items-grid {
        padding: 0;
    }

    .news-item {
        margin-bottom: 12px;
        min-height: 120px;
    }

    .news-item:hover {
        transform: none;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .dark-theme .news-item:hover {
        box-shadow: 0 1px 2px rgba(255, 255, 255, 0.05);
    }

    .news-feed > .news-header {
        padding: 14px 16px;
    }

    .back-to-chat-button span {
        display: none;
    }

    .news-item .news-header {
        padding: 12px 16px;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        font-size: 18px;
        box-shadow: 0 2px 6px rgba(26, 115, 232, 0.25);
        border-width: 1.5px;
    }

    .news-content {
        padding: 0 16px 14px;
    }

    .news-title {
        font-size: 16px;
        margin-bottom: 6px;
    }

    .news-content p {
        font-size: 15px;
        margin-bottom: 12px;
    }

    .news-images {
        margin-top: auto;
        border-radius: 12px;
        overflow: hidden;
    }

    .single-image.news-images {
        display: block;
        border-radius: 8px;
    }

    .news-actions {
        padding: 10px 16px;
    }

    .action-button {
        font-size: 13px;
        padding: 6px 8px;
    }

    /* Keep the same sizing as in Task Manager (no overrides) */

    .load-more {
        padding: 8px 16px 16px;
        margin: 0;
        width: 100%;
    }

    .load-more-button {
        width: 100%;
        border-radius: 8px;
        padding: 10px 16px;
        margin: 0;
    }
}

/* Стили для встроенной шапки */
.chat-header {
    background-color: rgba(255, 193, 7, 0.7);
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

.chat-header h2 {
    padding-left: 40px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    font-weight: 600;
    font-size: 18px;
    color: white;
}

.header-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
}

.toggle-contacts {
    background: none;
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    padding: 0;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.toggle-contacts svg {
    width: 24px;
    height: 24px;
}

.back-to-chat-button.embedded {
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

.back-to-chat-button.embedded:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: white;
    transform: translateY(-1px);
}

.back-to-chat-button.embedded:active {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(0);
}

@media (max-width: 768px) {
    .chat-header {
        padding: 14px 16px;
    }

    .chat-header h2 {
        font-size: 16px;
    }

    .toggle-contacts {
        left: 16px;
    }

    .back-to-chat-button.embedded {
        padding: 6px 12px;
        font-size: 13px;
    }
}

/* Добавим отзывчивую сетку для широких экранов */
@media (min-width: 992px) {
    .news-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 16px;
    }

    .news-items-grid .news-item {
        margin-bottom: 0;
    }

    .no-padding .news-items-grid {
        display: block;
    }

    .no-padding .news-item {
        margin-bottom: 16px;
    }
}

/* Стили для create-news-content */
.create-news-content {
    width: 100%;
    max-width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 16px;
    background-color: #f9fafb;
    height: calc(100vh - 60px);
}

.dark-theme .create-news-content {
    background-color: #111827;
}

.create-news-content::-webkit-scrollbar {
    width: 5px;
}

.create-news-content::-webkit-scrollbar-track {
    background: transparent;
}

.create-news-content::-webkit-scrollbar-thumb {
    background-color: rgba(193, 201, 214, 0.5);
    border-radius: 6px;
}

.dark-theme .create-news-content::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
}

.no-padding .create-news-content {
    height: calc(100vh - 60px);
    padding: 12px;
}

.news-form {
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    width: 100%;
    margin: 0 auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark-theme .news-form {
    background-color: #1e1e1e;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
}

.dark-theme .form-header {
    background-color: #1e1e1e;
    border-bottom: 1px solid #333;
}

.form-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0;
}

.dark-theme .form-header h3 {
    color: #f3f4f6;
}

.close-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.close-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .close-button {
    color: #9ca3af;
}

.dark-theme .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.close-button svg {
    width: 18px;
    height: 18px;
}

.news-form form {
    padding: 16px;
}

.error-message {
    background-color: #fee2e2;
    color: #b91c1c;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
}

.dark-theme .error-message {
    background-color: rgba(185, 28, 28, 0.2);
    color: #ef4444;
}

.form-group {
    margin-bottom: 20px;
}

.content-input {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 12px;
    font-size: 15px;
    color: #111827;
    background-color: #ffffff;
    resize: vertical;
    min-height: 100px;
    transition: border-color 0.2s;
    font-family: inherit;
}

.dark-theme .content-input {
    background-color: #2d2d2d;
    border-color: #444;
    color: #e5e7eb;
}

.content-input:focus {
    outline: none;
    border-color: rgba(255, 193, 7, 0.9);
    box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1);
}

.dark-theme .content-input:focus {
    border-color: rgba(255, 193, 7, 0.9);
    box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
}

.image-upload-container {
    margin-bottom: 16px;
}

.publish-button {
    background-color: rgba(255, 193, 7, 0.9);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
    margin-top: 8px;
}

.publish-button:hover {
    background-color: rgba(255, 193, 7, 1);
}

.publish-button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
}

.dark-theme .publish-button:disabled {
    background-color: #4b5563;
}

@media (max-width: 768px) {
    .news-form {
        border-radius: 0;
        box-shadow: none;
        max-width: 100%;
    }
}

.news-content-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    width: 100%;
    height: 100%;
}

.create-post-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 193, 7, 0.9);
    color: white;
    border: none;
    /* Фиксируем высоту кнопки, чтобы не увеличивать высоту хедера */
    height: 24px;
    padding: 0 12px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 500;
    line-height: 24px;
    transition: background-color 0.2s;
}

.create-post-button:hover {
    background-color: rgba(255, 193, 7, 1);
}

.create-post-button .add-icon {
    margin-right: 6px;
    width: 18px;
    height: 18px;
}

.back-to-chat-button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: #4b5563;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 20px;
    transition: background-color 0.2s;
}

.back-to-chat-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .back-to-chat-button {
    color: #e0e0e0;
}

.dark-theme .back-to-chat-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.back-to-chat-button svg {
    width: 20px;
    height: 20px;
    margin-right: 6px;
}

.news-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
}

.dark-theme .news-header {
    background-color: #1e1e1e;
    border-bottom: 1px solid #333;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
}

.dark-theme .form-group label {
    color: #e5e7eb;
}

.hidden-upload {
    display: none;
}

.image-upload-container {
    margin-bottom: 16px;
}

.form-group.no-margin {
    margin-bottom: 12px;
}

.upload-label {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 8px;
}

.dark-theme .upload-label {
    color: #9ca3af;
}

@media (max-width: 768px) {
    .create-news-content {
        padding: 10px;
        height: calc(100vh - 50px);
    }

    .no-padding .create-news-content {
        padding: 0;
        height: calc(100vh - 50px);
    }

    .news-form {
        border-radius: 0;
        box-shadow: none;
        max-width: 100%;
    }

    .publish-button {
        font-size: 15px;
        padding: 10px;
    }
}

@media (max-width: 768px) {
    .news-images {
        margin-top: auto;
        border-radius: 12px;
        overflow: hidden;
    }

    .single-image.news-images {
        display: block;
        border-radius: 8px;
    }

    .multi-image {
        grid-template-columns: 1fr;
    }

    .news-image {
        border-radius: 4px;
    }
}

/* Voice input wrapper */
.input-with-voice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
}

.input-with-voice .content-input {
    flex: 1;
}
</style>
