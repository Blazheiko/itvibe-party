<script setup lang="ts">
import { ref, onMounted, defineComponent, watch } from 'vue'
import AuthModals from '../components/AuthModals.vue'
import { useStateStore } from '@/stores/state'

defineComponent({
    name: 'LoginView',
})

const stateStore = useStateStore()

const isLoginModalVisible = ref(false)
const isRegisterModalVisible = ref(false)
const logoText = ref('Easy Task Manager')
const typingComplete = ref(false)
// const showAuthModals = ref(false)
const showLoginModal = () => {
    isLoginModalVisible.value = true
    isRegisterModalVisible.value = false
}

const showRegisterModal = () => {
    isLoginModalVisible.value = false
    isRegisterModalVisible.value = true
}

const closeAuthModals = () => {
    // В реальном приложении здесь была бы логика входа пользователя
    // Пока просто перенаправляем на страницу чата после успешной авторизации
    // и добавляем фиктивные данные пользователя в localStorage
    isLoginModalVisible.value = false
    isRegisterModalVisible.value = false
    // localStorage.setItem('user', JSON.stringify({ id: 1, name: 'John Smith' }))
    // router.push('/chat')
}

// Автоматический показ модального окна в PWA режиме
const checkPWAAndShowModal = () => {
    if (stateStore.isPWAMode) {
        isLoginModalVisible.value = true
    }
}

// Отслеживаем изменения PWA режима
watch(
    () => stateStore.isPWAMode,
    () => {
        checkPWAAndShowModal()
    },
    { immediate: true },
)

// Эффект печатающего текста для лого
onMounted(() => {
    const text = 'Easy Task Manager'
    let i = 0
    logoText.value = ' '

    const typeWriter = () => {
        if (i < text.length) {
            logoText.value += text.charAt(i)
            i++
            setTimeout(typeWriter, 150)
        } else {
            typingComplete.value = true
            // Проверяем PWA режим после завершения анимации
            checkPWAAndShowModal()
        }
    }

    // Запускаем анимацию печати с небольшой задержкой
    setTimeout(typeWriter, 1000)
})
</script>

<template>
    <div class="login-page">
        <!-- Desktop version -->
        <div v-if="!stateStore.isMobile" class="auth-container auth-container-desktop">
            <div class="logo" :class="{ 'typing-complete': typingComplete }">
                {{ logoText }}<span class="cursor"></span>
            </div>

            <div class="welcome-message">
                <h1>Welcome to Chat</h1>
                <p>Collaborate on tasks and projects with your team</p>
            </div>

            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                        >
                            <path
                                d="M20,2H4A2,2,0,0,0,2,4V22l4-4H20a2,2,0,0,0,2-2V4A2,2,0,0,0,20,2Z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h3>Real-time Messaging</h3>
                        <p>Chat with your contacts instantly with fast message delivery</p>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                        >
                            <path d="M21,7,12,2,3,7V17L12,22l9-5Z" fill="currentColor" />
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h3>Modern Design</h3>
                        <p>Enjoy a clean and intuitive interface designed for comfort</p>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                        >
                            <path
                                d="M18,8A6,6,0,0,0,6,8c0,7-3,9-3,9H21S18,15,18,8Z"
                                fill="currentColor"
                            />
                            <path d="M13.73,21a2,2,0,0,1-3.46,0" fill="currentColor" />
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h3>Notifications</h3>
                        <p>Never miss a message with our notification system</p>
                    </div>
                </div>
            </div>

            <div class="auth-buttons">
                <button class="auth-button" @click="showLoginModal">Sign In</button>
                <button class="auth-button register" @click="showRegisterModal">
                    Create Account
                </button>
            </div>

            <div class="manifesto-link-container">
                <router-link to="/manifesto" class="manifesto-link">Read our Manifesto</router-link>
            </div>
        </div>

        <!-- Mobile version - minimalistic -->
        <div v-else class="auth-container auth-container-mobile">
              <div class="welcome-message">
                <h1>Welcome to Easy Task Manager</h1>
                <p>Manage your tasks and projects with ease</p>
            </div>
            <div class="auth-buttons">
                <button class="auth-button" @click="showLoginModal">Sign In</button>
                <button class="auth-button register" @click="showRegisterModal">
                    Create Account
                </button>
            </div>

            <div class="manifesto-link-container">
                <router-link to="/manifesto" class="manifesto-link">Read our Manifesto</router-link>
            </div>
        </div>

        <AuthModals
            :show-login="isLoginModalVisible"
            :show-register="isRegisterModalVisible"
            @close="closeAuthModals"
            @show-login="showLoginModal"
            @show-register="showRegisterModal"
            v-if="isLoginModalVisible || isRegisterModalVisible"
        />
    </div>
</template>

<style scoped>
.login-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 20px;
}

.dark-theme .login-page {
    background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
}

.auth-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    background-color: white;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.auth-container-desktop {
    max-width: 600px;
    padding: 40px;
}

.auth-container-mobile {
    max-width: 100%;
    padding: 24px 20px;
    border-radius: 16px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.dark-theme .auth-container {
    background-color: #1e1e1e;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.dark-theme .auth-container-mobile {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.logo {
    font-size: 42px;
    font-weight: 800;
    color: var(--primary-color);
    margin-bottom: 30px;
    letter-spacing: -1px;
    position: relative;
    display: inline-block;
}

.cursor {
    position: absolute;
    right: -12px;
    top: 5%;
    height: 90%;
    width: 3px;
    background-color: var(--primary-color);
    animation: blink 1s infinite;
}

.typing-complete .cursor {
    animation: fadeOut 0.5s forwards;
}

@keyframes blink {
    0%,
    100% {
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
        visibility: hidden;
    }
}

.welcome-message {
    text-align: center;
    margin-bottom: 30px;
    width: 100%;
}

.welcome-message h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 10px;
    color: var(--text-color);
}

.dark-theme .welcome-message h1 {
    color: #e0e0e0;
}

.welcome-message p {
    font-size: 16px;
    color: #6c757d;
    margin: 0;
}

.dark-theme .welcome-message p {
    color: #adb5bd;
}

.features {
    width: 100%;
    margin-bottom: 30px;
}

.feature-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.dark-theme .feature-item {
    background-color: #2a2a2a;
}

.feature-icon {
    width: 40px;
    height: 40px;
    background-color: var(--primary-color);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.dark-theme .feature-icon {
    background-color: #0d47a1;
}

.feature-text h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px;
    color: var(--text-color);
}

.dark-theme .feature-text h3 {
    color: #e0e0e0;
}

.feature-text p {
    font-size: 14px;
    color: #6c757d;
    margin: 0;
    line-height: 1.5;
}

.dark-theme .feature-text p {
    color: #adb5bd;
}

.auth-buttons {
    display: flex;
    gap: 16px;
    width: 100%;
    max-width: 400px;
}

.auth-container-desktop .auth-buttons {
    margin-top: 32px;
}

.auth-container-mobile .auth-buttons {
    margin-top: 0;
    flex-direction: column;
}

.auth-button {
    flex: 1;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: var(--primary-color);
    color: white;
}

.dark-theme .auth-button {
    background-color: #0d47a1;
}

.auth-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

.dark-theme .auth-button:hover {
    box-shadow: 0 4px 12px rgba(13, 71, 161, 0.3);
}

.auth-button.register {
    background-color: white;
    color: var(--primary-color);
    border: 2px solid var(--primary-color);
}

.dark-theme .auth-button.register {
    background-color: #2a2a2a;
    color: #e0e0e0;
    border-color: #0d47a1;
}

.auth-button.register:active {
    background-color: rgba(26, 115, 232, 0.1);
}

.manifesto-link-container {
    text-align: center;
}

.auth-container-desktop .manifesto-link-container {
    margin-top: 24px;
}

.auth-container-mobile .manifesto-link-container {
    margin-top: 20px;
}

.manifesto-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    margin-top: 24px;
    transition: all 0.2s ease;
}

.dark-theme .manifesto-link {
    color: #64b5f6;
}

.manifesto-link:hover {
    text-decoration: underline;
    opacity: 0.9;
}

.pwa-login-hint {
    text-align: center;
    margin: 32px 0;
    padding: 20px;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    border-radius: 12px;
    color: white;
    animation: pulse 2s infinite;
}

.dark-theme .pwa-login-hint {
    background: linear-gradient(135deg, #0d47a1, #1565c0);
}

.pwa-login-hint p {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.pwa-login-hint .hint-text {
    font-size: 14px;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 8px;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.02);
    }
}

@media (max-width: 768px) {
    .auth-container-mobile .auth-button {
        width: 100%;
        padding: 14px 0;
        font-size: 16px;
    }
}
</style>
