<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MyNotes from '../components/MyNotes.vue'
import { defineComponent } from 'vue'
import MenuButton from '../components/MenuButton.vue'
// Локальная шапка ниже будет заменена глобальным AppHeader из App.vue

defineComponent({
    name: 'NewsView',
})

const router = useRouter()

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

// Проверка авторизации
onMounted(() => {
    // const storedUser = localStorage.getItem('user')
    // if (!storedUser) {
    //   router.push('/')
    // }
})

// Вернуться в чат
const backToChat = () => {
    router.push('/chat')
}
</script>

<template>
    <div class="news-page">
        <!-- Глобальный хедер выводится в App.vue -->

        <div class="content-wrapper">
            <div class="content-container">
                <MyNotes :hide-header="true" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.news-page {
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

.dark-theme .news-page {
    background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
}

.news-header {
    width: 100%;
    background-color: var(--primary-color);
    color: white;
    padding: 16px 0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--box-shadow);
}

.dark-theme .news-header {
    background-color: #0d47a1;
}

.header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-content h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: white;
    text-align: center;
    flex: 1;
}

.back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.back-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.content-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
}

.content-container {
    max-width: 1400px;
    margin: 0 auto;
    overflow: hidden;
}

@keyframes menuFadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .news-page {
        overflow-x: hidden;
    }

    .news-header {
        width: 100%;
    }

    .header-content {
        padding: 0 16px;
    }

    .header-content h1 {
        font-size: 18px;
    }

    .back-button span {
        display: none;
    }

    .back-button {
        padding: 8px;
        border-radius: 8px;
        justify-content: center;
    }

    .content-wrapper {
        padding: 8px;
    }

    .content-container {
        padding: 0;
    }

    .content-wrapper::-webkit-scrollbar {
        width: 0;
        display: none;
    }

    .content-wrapper {
        -ms-overflow-style: none; /* IE и Edge */
        scrollbar-width: none; /* Firefox */
    }
}

@media (min-width: 768px) and (max-width: 1200px) {
    .header-content,
    .content-container {
        max-width: 1000px;
    }
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
</style>
