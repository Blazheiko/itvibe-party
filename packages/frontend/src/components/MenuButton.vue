<script setup lang="ts">
import '@khmyznikov/pwa-install'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/utils/api'
import { useEventBus } from '@/utils/event-bus'
import { useStateStore } from '@/stores/state'

const router = useRouter()
const eventBus = useEventBus()
const stateStore = useStateStore()

// Состояние меню
const isMenuOpen = ref(false)

// Loading state for logout
const isLoggingOut = ref(false)

// PWA установка
type PwaInstallElement = HTMLElement & { isInstallAvailable: boolean; showDialog(): void }
const pwaInstall = ref<PwaInstallElement | null>(null)
const isInstallAvailable = ref(false)

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

// Обработчик доступности установки PWA
const handleInstallAvailable = () => {
    isInstallAvailable.value = true
}

// Функция установки PWA
const installApp = () => {
    pwaInstall.value?.showDialog()
    closeMenu()
}

// Добавляем обработчики событий
onMounted(async () => {
    window.addEventListener('click', handleClickOutside)

    // Ждём рендер элемента <pwa-install>, затем слушаем событие на нём
    await nextTick()
    if (pwaInstall.value) {
        pwaInstall.value.addEventListener('pwa-install-available-event', handleInstallAvailable)
        // На iOS isInstallAvailable может быть уже true к этому моменту
        if (pwaInstall.value.isInstallAvailable) {
            isInstallAvailable.value = true
        }
    }
})

onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
    pwaInstall.value?.removeEventListener('pwa-install-available-event', handleInstallAvailable)
})

// Переход в аккаунт
const goToAccount = () => {
    closeMenu()
    router.push('/account')
}

// Переход к проектам
const goToProjects = () => {
    closeMenu()
    router.push('/projects')
}

// Переключение темы
const toggleTheme = () => {
    stateStore.setDarkMode(!stateStore.darkMode)
    closeMenu()
}

// Выход из аккаунта
const logout = async () => {
    isLoggingOut.value = true

    try {
        const { error, data } = await authApi.logout()
        if (error) {
            console.error(error)
        } else {
            console.log(data)
            eventBus.emit('unauthorized')
            router.push('/')
        }
    } catch (error) {
        console.error('Logout error:', error)
    } finally {
        isLoggingOut.value = false
        closeMenu()
    }
}
</script>

<template>
    <div class="menu-container">
        <pwa-install ref="pwaInstall"></pwa-install>

        <button class="menu-button" @click.stop="toggleMenu">
            <svg
                class="menu-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="white"
            >
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
        </button>

        <div class="dropdown-menu" :class="{ show: isMenuOpen }">
            <button v-if="isInstallAvailable" class="menu-item install-app" @click="installApp">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                >
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                Install App
            </button>
            <button class="menu-item" @click="goToAccount">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                >
                    <path
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    />
                </svg>
                My Account
            </button>
            <button class="menu-item" @click="goToProjects">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                >
                    <path
                        d="M20 6h-2l-2-2H8L6 6H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM6 12h4v4H6v-4z"
                    />
                </svg>
                My Projects
            </button>
            <button class="menu-item" @click="toggleTheme">
                <svg
                    v-if="stateStore.darkMode"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                >
                    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                </svg>
                <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                >
                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
                </svg>
                {{ stateStore.darkMode ? 'Light Theme' : 'Dark Theme' }}
            </button>
            <button class="menu-item" @click="logout" :disabled="isLoggingOut">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                >
                    <path
                        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                    />
                </svg>
                <span v-if="isLoggingOut">Logging out...</span>
                <span v-else>Logout</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.menu-container {
    position: relative;
}

.menu-button {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 3px 6px;
    height: 22px;
    width: 22px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 500;
}

.menu-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.menu-button:active {
    background-color: rgba(255, 255, 255, 0.25);
    transform: translateY(0);
}

/* Стили для выпадающего меню */
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
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
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
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    color: #212529;
    border-radius: 8px;
    margin: 4px 8px;
    width: calc(100% - 16px);
    font-weight: 500;
    font-size: 14px;
    position: relative;
    overflow: hidden;
    transform: translateY(0) scale(1);
}

.dark-theme .menu-item {
    color: #e0e0e0;
}

.menu-item.install-app {
    color: #007bff;
    font-weight: 600;
}

.dark-theme .menu-item.install-app {
    color: #4dabf7;
}

.menu-item:last-child {
    color: #dc3545;
}

.dark-theme .menu-item:last-child {
    color: #ff6b6b;
}

.menu-item:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .menu-item:hover {
    background-color: #333;
}

.menu-item:active {
    transform: translateY(1px) scale(0.98);
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.menu-item::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
}

.dark-theme .menu-item::before {
    background: rgba(255, 255, 255, 0.1);
}

.menu-item:active::before {
    width: 200px;
    height: 200px;
}

.menu-item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.menu-item:disabled:hover {
    background-color: transparent;
    transform: none;
}

.dark-theme .menu-item:disabled:hover {
    background-color: transparent;
}

.menu-item:disabled::before {
    display: none;
}

@media (max-width: 768px) {
    .menu-container {
        margin-left: 4px;
    }

    .menu-button {
        padding: 6px;
        width: 32px;
        height: 32px;
        border-radius: 6px;
    }

    .menu-icon {
        width: 18px;
        height: 18px;
    }
}
</style>
