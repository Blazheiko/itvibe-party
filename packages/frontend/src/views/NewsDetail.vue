<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import VoiceInput from '@/components/VoiceInput.vue'

const router = useRouter()
const route = useRoute()
const newsId = ref(parseInt(route.params.id as string))

// Отслеживание ширины окна
const windowWidth = ref(window.innerWidth)

const handleResize = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

// Состояние меню
const isMenuOpen = ref(false)

// Управление меню
const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
    isMenuOpen.value = false
}

// Обработчик клика вне меню
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (isMenuOpen.value && !target.closest('.menu-container')) {
        closeMenu()
    }
}

// Текущий пользователь
const currentUser = {
    id: 0,
    name: 'Current User',
    avatar: '',
}

// Новость
const newsItem = ref({
    id: newsId.value,
    userId: 1,
    userName: 'John Smith',
    content: 'Had an amazing day hiking in the mountains! The view was absolutely breathtaking.',
    images: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    likes: 24,
    isLiked: false,
    comments: 6,
    timeAgo: '2 hours ago',
})

// Комментарии
const comments = ref([
    {
        id: 1,
        userId: 2,
        userName: 'Mary Johnson',
        content: 'Beautiful view! Which trail did you take?',
        likes: 3,
        timeAgo: '1 hour ago',
    },
    {
        id: 2,
        userId: 3,
        userName: 'Alex Wilson',
        content: 'This looks amazing! I need to visit this place.',
        likes: 2,
        timeAgo: '45 minutes ago',
    },
    {
        id: 3,
        userId: 4,
        userName: 'Helen Brown',
        content: 'The colors in the first picture are stunning!',
        likes: 1,
        timeAgo: '30 minutes ago',
    },
])

// Новый комментарий
const newComment = ref('')

// Voice input handler
const handleCommentVoiceInput = (text: string) => {
    newComment.value = newComment.value ? newComment.value + ' ' + text : text
}

// Добавление комментария
const addComment = () => {
    if (newComment.value.trim()) {
        comments.value.unshift({
            id: comments.value.length + 1,
            userId: currentUser.id,
            userName: currentUser.name,
            content: newComment.value.trim(),
            likes: 0,
            timeAgo: 'Just now',
        })
        newComment.value = ''
    }
}

// Лайк новости
interface NewsItem {
    isLiked: boolean
    likes: number
}

const toggleLike = (item: NewsItem) => {
    item.isLiked = !item.isLiked
    if (item.isLiked) {
        item.likes++
    } else {
        item.likes--
    }
}

// Вернуться к списку новостей
const backToNews = () => {
    router.push('/news')
}

// Переход в аккаунт
const goToAccount = () => {
    router.push('/account')
}

// Выход из аккаунта
const logout = () => {
    localStorage.removeItem('user')
    router.push('/')
}

// Получаем первую букву имени пользователя для аватара
const getInitial = (name: string): string => {
    return name.charAt(0)
}

// Добавляем обработчик клика вне меню
window.addEventListener('click', handleClickOutside)

// Удаляем обработчик при уничтожении компонента
onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
    <div class="news-detail-page">
        <!-- Глобальный хедер выводится в App.vue -->

        <div class="content-wrapper">
            <div class="content-container">
                <!-- Новость -->
                <div class="news-item">
                    <div class="news-item-header">
                        <div class="user-avatar">{{ getInitial(newsItem.userName) }}</div>
                        <div class="user-info">
                            <div class="user-name">{{ newsItem.userName }}</div>
                            <div class="post-time">{{ newsItem.timeAgo }}</div>
                        </div>
                    </div>

                    <div class="news-item-content">
                        <p>{{ newsItem.content }}</p>

                        <div
                            v-if="newsItem.images && newsItem.images.length > 0"
                            class="news-images"
                            :class="{
                                'single-image': newsItem.images.length === 1,
                                'multi-image': newsItem.images.length > 1,
                            }"
                        >
                            <div
                                v-for="(image, index) in newsItem.images"
                                :key="index"
                                class="image-container"
                            >
                                <img
                                    :src="image"
                                    :alt="`${newsItem.userName}'s post image ${index + 1}`"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="news-actions">
                        <button
                            class="action-button"
                            :class="{ liked: newsItem.isLiked }"
                            @click="toggleLike(newsItem)"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="currentColor"
                            >
                                <path
                                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                />
                            </svg>
                            <span>{{ newsItem.likes }}</span>
                        </button>

                        <button class="action-button">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="currentColor"
                            >
                                <path
                                    d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                                />
                            </svg>
                            <span>{{ newsItem.comments }}</span>
                        </button>

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

                <!-- Секция комментариев -->
                <div class="comments-section">
                    <h2>Comments ({{ comments.length }})</h2>

                    <!-- Форма добавления комментария -->
                    <div class="comment-form">
                        <div class="user-avatar current">{{ getInitial(currentUser.name) }}</div>
                        <div class="comment-input-container">
                            <div class="input-with-voice">
                                <textarea
                                    v-model="newComment"
                                    class="comment-input"
                                    placeholder="Write a comment..."
                                    rows="3"
                                ></textarea>
                                <VoiceInput @text-recognized="handleCommentVoiceInput" />
                            </div>
                            <button class="post-button" @click="addComment">Post</button>
                        </div>
                    </div>

                    <!-- Список комментариев -->
                    <div class="comments-list">
                        <div v-for="comment in comments" :key="comment.id" class="comment-item">
                            <div class="comment-header">
                                <div class="user-avatar">{{ getInitial(comment.userName) }}</div>
                                <div class="comment-info">
                                    <div class="comment-user-name">{{ comment.userName }}</div>
                                    <div class="comment-time">{{ comment.timeAgo }}</div>
                                </div>
                            </div>
                            <div class="comment-content">
                                {{ comment.content }}
                            </div>
                            <div class="comment-actions">
                                <button class="comment-action">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                        />
                                    </svg>
                                    <span>{{ comment.likes }}</span>
                                </button>
                                <button class="comment-action">Reply</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.news-detail-page {
    width: 100%;
    min-height: calc(100vh - var(--header-height));
    height: calc(100vh - var(--header-height));
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    font-family:
        'Inter',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        sans-serif;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

.dark-theme .news-detail-page {
    background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
}

.news-header {
    width: 100%;
    background-color: var(--primary-color);
    color: white;
    box-shadow: var(--box-shadow);
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    padding: 16px 0;
    position: sticky;
    top: 0;
    z-index: 100;
}

.dark-theme .news-header {
    background-color: #0d47a1;
}

.header-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    max-width: 1400px; /* Широкий контейнер для большего использования пространства */
    margin: 0 auto;
}

.content-wrapper {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #c1c9d6 transparent;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 24px;
}

.content-container {
    width: 100%;
    max-width: 1400px; /* Тот же размер, что и у шапки */
    padding: 24px;
    box-sizing: border-box;
}

.news-header h1 {
    margin: 0;
    font-weight: 600;
    font-size: 24px;
}

.back-button {
    padding: 8px 15px;
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
}

.back-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: white;
    transform: translateY(-1px);
}

.back-button:active {
    transform: translateY(0);
    opacity: 0.9;
}

.menu-container {
    position: relative;
}

.menu-button {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: white;
    padding: 8px 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
}

.menu-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: white;
    transform: translateY(-1px);
}

.menu-button:active {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(0);
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

.dark-theme .dropdown-menu {
    background-color: #1e1e1e;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
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
    color: #212529;
    border-radius: 8px;
    margin: 4px 8px;
    width: calc(100% - 16px);
    font-weight: 500;
    font-size: 14px;
}

.dark-theme .menu-item {
    color: #e0e0e0;
}

.menu-item:last-child {
    color: #dc3545;
}

.menu-item:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
}

.dark-theme .menu-item:hover {
    background-color: #333;
    transform: translateY(-1px);
}

.menu-item:active {
    transform: translateY(0);
}

.content-wrapper::-webkit-scrollbar {
    width: 3px;
}

.content-wrapper::-webkit-scrollbar-track {
    background: transparent;
    margin: 10px 0;
}

.content-wrapper::-webkit-scrollbar-thumb {
    background-color: rgba(193, 201, 214, 0.5);
    border-radius: 6px;
}

.dark-theme .content-wrapper::-webkit-scrollbar-thumb {
    background-color: rgba(168, 179, 195, 0.8);
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
    background-color: rgba(168, 179, 195, 0.8);
}

.news-item {
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-bottom: 24px;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.dark-theme .news-item {
    background-color: #1e1e1e;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.news-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.dark-theme .news-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.news-item-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 12px;
}

.user-avatar {
    width: 48px;
    height: 48px;
    background-color: var(--primary-color);
    color: white;
    font-size: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    box-shadow: 0 4px 10px rgba(26, 115, 232, 0.3);
    font-weight: 500;
}

.dark-theme .user-avatar {
    background-color: #0d47a1;
}

.user-avatar.current {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 600;
    color: var(--text-color);
    font-size: 16px;
}

.dark-theme .user-name {
    color: #e0e0e0;
}

.post-time {
    color: #6c757d;
    font-size: 13px;
    margin-top: 2px;
}

.dark-theme .post-time {
    color: #adb5bd;
}

.news-item-content {
    padding: 0 20px 16px;
}

.news-item-content p {
    margin: 0 0 16px;
    line-height: 1.5;
    color: var(--text-color);
    font-size: 16px;
}

.dark-theme .news-item-content p {
    color: #e0e0e0;
}

.news-images {
    border-radius: 12px;
    overflow: hidden;
}

.single-image .image-container {
    width: 100%;
    max-height: 500px;
    overflow: hidden;
}

.multi-image {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
}

.image-container {
    overflow: hidden;
    border-radius: 8px;
    aspect-ratio: 16/9;
}

.image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.image-container:hover img {
    transform: scale(1.03);
}

.news-actions {
    display: flex;
    padding: 12px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    gap: 16px;
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

/* Комментарии */
.comments-section {
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 20px;
    margin-top: 24px;
}

.dark-theme .comments-section {
    background-color: #1e1e1e;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.comments-section h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px;
    color: var(--text-color);
}

.dark-theme .comments-section h2 {
    color: #e0e0e0;
}

.comment-form {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    width: 100%;
    padding: 16px 24px;
    border-bottom: 1px solid #eee;
}

.dark-theme .comment-form {
    border-bottom-color: #333;
}

.comment-input-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.comment-input {
    width: 100%;
    min-height: 80px;
    padding: 12px 16px;
    border: 1px solid #dee2e6;
    border-radius: 12px;
    font-size: 15px;
    resize: vertical;
    font-family: inherit;
    transition: border-color 0.2s ease;
    background-color: white;
    color: var(--text-color);
}

.dark-theme .comment-input {
    background-color: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
}

.comment-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.dark-theme .comment-input:focus {
    border-color: #0d47a1;
    box-shadow: 0 0 0 2px rgba(13, 71, 161, 0.2);
}

.post-button {
    align-self: flex-end;
    padding: 8px 24px;
    background-color: #1a73e8;
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.post-button:hover {
    background-color: #1666d0;
    transform: translateY(-1px);
}

.post-button:active {
    transform: translateY(0);
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-item {
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 12px;
}

.dark-theme .comment-item {
    background-color: #333;
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.comment-user-name {
    font-weight: 600;
    color: var(--text-color);
    font-size: 15px;
}

.dark-theme .comment-user-name {
    color: #e0e0e0;
}

.comment-time {
    color: #6c757d;
    font-size: 12px;
}

.dark-theme .comment-time {
    color: #adb5bd;
}

.comment-info {
    display: flex;
    flex-direction: column;
}

.comment-content {
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-color);
    margin-bottom: 10px;
}

.dark-theme .comment-content {
    color: #e0e0e0;
}

.comment-actions {
    display: flex;
    gap: 16px;
}

.comment-action {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-color);
    padding: 6px 10px;
    border-radius: 20px;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;
}

.dark-theme .comment-action {
    color: #adb5bd;
}

.comment-action:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--primary-color);
}

.dark-theme .comment-action:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #64b5f6;
}

@media (max-width: 768px) {
    .news-page {
        overflow-x: hidden;
    }

    .news-header {
        width: 100%;
    }

    .header-content {
        flex-wrap: wrap;
        padding: 15px 10px;
    }

    .news-header h1 {
        order: -1;
        width: 100%;
        margin-bottom: 10px;
        text-align: center;
        font-size: 20px;
    }

    .back-button span {
        display: none;
    }

    .back-button {
        padding: 8px;
        border-radius: 8px;
        justify-content: center;
    }

    .menu-button span {
        display: none;
    }

    .arrow-icon {
        display: none;
    }

    .content-wrapper {
        padding: 0;
        -ms-overflow-style: none; /* IE и Edge */
        scrollbar-width: none; /* Firefox */
    }

    .content-container {
        padding: 0;
        width: 100%;
    }

    .news-item,
    .comments-section {
        margin: 0 0 8px 0;
        border-radius: 0;
        width: 100%;
    }

    .news-item:hover {
        transform: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .news-item-header {
        padding: 14px 16px;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        font-size: 18px;
    }

    .news-item-content {
        padding: 0 16px 14px;
    }

    .news-item-content p {
        font-size: 15px;
        margin-bottom: 12px;
    }

    .news-actions {
        padding: 10px 16px;
    }

    .action-button {
        font-size: 13px;
        padding: 6px 8px;
    }

    .multi-image {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .comments-section {
        padding: 16px;
    }

    .comments-section h2 {
        font-size: 16px;
        margin-bottom: 16px;
    }

    .comment-form {
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
    }

    .user-avatar.current {
        align-self: flex-start;
    }

    .comment-input {
        min-height: 60px;
    }

    .post-button {
        width: 100%;
        align-self: center;
    }

    .comment-item {
        padding: 14px 16px;
    }
}

@media (min-width: 768px) and (max-width: 1200px) {
    .header-content,
    .content-container {
        max-width: 1400px;
    }
}

/* Voice input wrapper */
.input-with-voice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
}

.input-with-voice .comment-input {
    flex: 1;
}
</style>
