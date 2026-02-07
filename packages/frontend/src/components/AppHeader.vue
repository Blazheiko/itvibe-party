<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import MenuButton from '@/components/MenuButton.vue'
import { computed, ref, onMounted } from 'vue'
import { useEventBus } from '@/utils/event-bus'
import { useWebSocketConnection } from '@/composables/useWebSocketConnection'

// Props
const props = defineProps({
    title: {
        type: String,
        default: '',
    },
    backPath: {
        type: String,
        default: '',
    },
    backLabel: {
        type: String,
        default: 'Back',
    },
})

const router = useRouter()
const route = useRoute()
const activeTab = computed(() => (route.meta.tab as string) || 'chat')
const eventBus = useEventBus()

// WebSocket connection status
const { statusWebSocket } = useWebSocketConnection()

// Computed properties for WebSocket status
const websocketStatusText = computed(() => {
    switch (statusWebSocket.value) {
        case 'OPEN':
            return 'Connected'
        case 'CONNECTING':
            return 'Connecting...'
        case 'CLOSED':
            return 'Disconnected'
        default:
            return 'Unknown'
    }
})

const websocketStatusClass = computed(() => {
    switch (statusWebSocket.value) {
        case 'OPEN':
            return 'status-connected'
        case 'CONNECTING':
            return 'status-connecting'
        case 'CLOSED':
            return 'status-disconnected'
        default:
            return 'status-unknown'
    }
})

// Состояние звуковых уведомлений (глобальная кнопка в шапке)
const notificationsEnabled = ref(true)
onMounted(() => {
    notificationsEnabled.value = localStorage.getItem('notifications_enabled') !== 'false'
})

const toggleNotifications = () => {
    notificationsEnabled.value = !notificationsEnabled.value
    localStorage.setItem('notifications_enabled', String(notificationsEnabled.value))
    eventBus.emit('toggle_notifications', { enabled: notificationsEnabled.value })
}

// Вернуться назад
const goBack = () => {
    if (props.backPath) {
        router.push(props.backPath)
    } else {
        router.back()
    }
}
</script>

<template>
    <header class="app-header">
        <div class="header-content">
            <div class="left-side">
                <button v-if="backPath" class="back-button" @click="goBack">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                    >
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                    <span>{{ backLabel }}</span>
                </button>
            </div>

            <div class="right-side">
                <nav class="tabs">
                    <button
                        class="tab"
                        :class="{ active: activeTab === 'chat' }"
                        @click="router.push('/chat')"
                        title="Chat"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path d="M4 4h16v12H5.17L4 17.17V4z" fill="currentColor" />
                        </svg>
                        <span>Chat</span>
                    </button>
                    <button
                        class="tab"
                        :class="{ active: activeTab === 'calendar' }"
                        @click="router.push('/calendar')"
                        title="Calendar"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                                d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z"
                                fill="currentColor"
                            />
                        </svg>
                        <span>Calendar</span>
                    </button>
                    <button
                        class="tab"
                        :class="{ active: activeTab === 'tasks' }"
                        @click="router.push('/tasks')"
                        title="Tasks"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                                d="M9 11H4v2h5v-2zm0-4H4v2h5V7zm11 8H11v2h9v-2zm0-4H11v2h9v-2zm0-4H11v2h9V7z"
                                fill="currentColor"
                            />
                        </svg>
                        <span>Tasks</span>
                    </button>
                    <button
                        class="tab"
                        :class="{ active: activeTab === 'notes' }"
                        @click="router.push('/notes')"
                        title="Notes"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                                d="M3 5v14a2 2 0 0 0 2 2h10l6-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zm12 14V9h6"
                                fill="currentColor"
                            />
                        </svg>
                        <span>Notes</span>
                    </button>
                    <button
                        class="tab"
                        :class="{ active: activeTab === 'projects' }"
                        @click="router.push('/projects')"
                        title="Projects"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path d="M4 6h16v12H4zM2 4h20v2H2z" fill="currentColor" />
                        </svg>
                        <span>Projects</span>
                    </button>
                </nav>
                <button
                    class="notification-button"
                    @click="toggleNotifications"
                    title="Toggle notification sound"
                >
                    <svg
                        v-if="notificationsEnabled"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                    >
                        <path
                            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
                            fill="currentColor"
                        />
                    </svg>
                    <svg
                        v-else
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                    >
                        <path
                            d="M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.11 0 2-.89 2-2h-4c0 1.11.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.42.12-.1.03-.2.07-.3.11h-.01c-.01 0-.01 0-.02.01-.23.09-.46.2-.68.31 0 0-.01 0-.01.01l2.97 2.97V5.36c0-.22.02-.42.05-.62.07.41.23.78.46 1.06.43.52 1.1.84 1.83.84.33 0 .65-.06.93-.18.5.52.86 1.15 1.09 1.86.11.34.17.69.2 1.06v5.59l3.24 3.24-.07-.03c.45-.4.87-.92 1.22-1.5.19-.32.34-.67.45-1.05z"
                            fill="currentColor"
                        />
                    </svg>
                </button>

                <!-- WebSocket Status Indicator -->
                <div
                    class="websocket-status"
                    :class="websocketStatusClass"
                    :title="`WebSocket Status: ${websocketStatusText}`"
                >
                    <div class="status-dot"></div>
                    <span class="status-text">{{ websocketStatusText }}</span>
                </div>

                <MenuButton />
            </div>
        </div>
    </header>
</template>

<style scoped>
.app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--primary-color);
    color: white;
    box-shadow: var(--box-shadow);
    width: 100%;
    padding: 4px 0;
}

.dark-theme .app-header {
    background-color: #0d47a1;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.header-content {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.left-side,
.right-side {
    flex: 1;
    display: flex;
    align-items: center;
}

.left-side {
    justify-content: flex-start;
}

.right-side {
    justify-content: flex-end;
}

.tabs {
    display: flex;
    gap: 2px;
    margin-right: 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 2px;
}

.tab {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    padding: 3px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.2;
    height: 18px;
    min-width: 50px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.2s ease;
    position: relative;
}

.tab:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: white;
}

.tab.active {
    background: white;
    color: var(--primary-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark-theme .tab.active {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.app-header h1 {
    margin: 0;
    font-weight: 600;
    font-size: 24px;
}

.title-slot {
    flex: 1;
    text-align: center;
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

.notification-button {
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
    margin-right: 8px;
}

.notification-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

/* WebSocket Status Indicator */
.websocket-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    margin-right: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.status-text {
    color: white;
    font-size: 10px;
    line-height: 1;
}

/* Status Colors */
.status-connected .status-dot {
    background-color: #4ade80; /* green-400 */
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
}

.status-connecting .status-dot {
    background-color: #fbbf24; /* amber-400 */
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
    animation: pulse 2s infinite;
}

.status-disconnected .status-dot {
    background-color: #f87171; /* red-400 */
    box-shadow: 0 0 6px rgba(248, 113, 113, 0.6);
}

.status-unknown .status-dot {
    background-color: #9ca3af; /* gray-400 */
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

@media (max-width: 768px) {
    .app-header {
        padding: 4px 0;
    }

    .header-content {
        padding: 0 16px;
    }

    .right-side {
        gap: 8px;
        padding-right: 4px;
    }

    /* На мобильных вкладки в шапке не показываем */
    .tabs {
        display: none;
    }

    .notification-button {
        width: 32px;
        height: 32px;
        padding: 6px;
        margin-right: 12px;
    }

    /* WebSocket status на мобильных - показываем только точку */
    .websocket-status {
        padding: 4px;
        margin-right: 8px;
    }

    .websocket-status .status-text {
        display: none;
    }

    .websocket-status .status-dot {
        width: 10px;
        height: 10px;
    }

    .app-header h1 {
        font-size: 18px;
    }

    .back-button {
        padding: 6px 12px;
        font-size: 13px;
    }

    .back-button span {
        display: none;
    }
}
</style>
