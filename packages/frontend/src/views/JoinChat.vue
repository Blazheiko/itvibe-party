<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AuthModals from '@/components/AuthModals.vue'
import baseApi from '@/utils/base-api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
// const user = ref(userStore.user)

const showAuthModal = ref(false)
const token = ref('')

onMounted(() => {
    // Получаем ID чата из URL
    token.value = route.params.token as string
    console.log({token: token.value})
    if (token.value) {

        joinChat(token.value).then(() => {
            console.log('joinChat success')
        }).catch((error) => {
            console.error('Error joinChat:', error)
        })
        // Если пользователь не авторизован, показываем модальное окно регистрации
        if (!userStore.user) {
            showAuthModal.value = true
        }
    }
})

onBeforeUnmount(() => {
    console.log('onBeforeUnload joinChat')
})

const joinChat = async (token: string) => {
    console.log('joinChat')
    const { data, error } = await baseApi.http('POST', '/api/main/invitations/use', {
        token: token
    })
    if (error) {
        console.error('Error joinChat:', error)

    } else if (data && data.status === 'success' ) {
        console.log(data)
        // router.push({ name: 'Chat' })
    }
}

const handleAuthSuccess = () => {
    // После успешной авторизации перенаправляем на страницу чата
    router.push({ name: 'Chat'})
}

const handleCloseAuthModal = () => {
    showAuthModal.value = false
}

const isLoginModalVisible = ref(false)
const isRegisterModalVisible = ref(true)

const showLoginModal = () => {
    isLoginModalVisible.value = true
    isRegisterModalVisible.value = false
}

const showRegisterModal = () => {
    isLoginModalVisible.value = false
    isRegisterModalVisible.value = true
}
</script>

<template>
    <div class="join-chat-container">
        <div v-if="userStore.user" class="welcome-section">
            <h1>Welcome, {{ userStore.user.name }}!</h1>
            <p>You're about to join a conversation. Click the button below to continue.</p>
            <button class="join-button" @click="handleAuthSuccess">Join Chat</button>
        </div>

        <div v-else class="auth-section">
            <h1>Join the Chat</h1>
            <p>Please register or sign in to join the conversation.</p>
            <button class="auth-button" @click="showAuthModal = true">Sign In / Register</button>
        </div>

        <AuthModals
            :show-login="isLoginModalVisible"
            :show-register="isRegisterModalVisible"
            :token="token"
            @close="handleCloseAuthModal"
            @auth-success="handleAuthSuccess"
            @show-login="showLoginModal"
            @show-register="showRegisterModal"
            v-if="showAuthModal"
        />
    </div>
</template>

<style scoped>
.join-chat-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: #f8f9fa;
}

.dark-theme .join-chat-container {
    background-color: #1e1e1e;
}

.welcome-section,
.auth-section {
    text-align: center;
    max-width: 500px;
    padding: 40px;
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.dark-theme .welcome-section,
.dark-theme .auth-section {
    background-color: #2a2a2a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

h1 {
    margin: 0 0 16px 0;
    font-size: 28px;
    font-weight: 700;
    color: var(--text-color);
}

.dark-theme h1 {
    color: #e0e0e0;
}

p {
    margin: 0 0 24px 0;
    font-size: 16px;
    color: #6c757d;
    line-height: 1.5;
}

.dark-theme p {
    color: #adb5bd;
}

.join-button,
.auth-button {
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 500;
    color: white;
    background-color: var(--primary-color);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.join-button:hover,
.auth-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.join-button:active,
.auth-button:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
    .welcome-section,
    .auth-section {
        padding: 24px;
        margin: 16px;
    }

    h1 {
        font-size: 24px;
    }

    p {
        font-size: 14px;
    }

    .join-button,
    .auth-button {
        padding: 10px 20px;
        font-size: 15px;
    }
}
</style>
