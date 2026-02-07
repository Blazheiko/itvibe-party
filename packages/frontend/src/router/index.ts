import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Login from '@/views/Login.vue'
import Chat from '@/views/Chat.vue'
import UserAccount from '@/views/UserAccount.vue'
import News from '@/views/News.vue'
import NewsDetail from '@/views/NewsDetail.vue'
import CreateNews from '@/views/CreateNews.vue'
import ManifestoSocial from '@/views/ManifestoSocial.vue'
// Projects будет отображаться внутри Chat как вкладка
import JoinChat from '@/views/JoinChat.vue'
import { useUserStore } from '@/stores/user'

// Не вызывайте store вне функции навигационной защиты
// const userStore = useUserStore()
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Login',
        component: Login,
    },
    {
        path: '/chat',
        name: 'Chat',
        component: Chat,
        meta: { requiresAuth: true },
    },
    // Верхнеуровневые маршруты, которые рендерят правую панель внутри Chat
    {
        path: '/projects',
        name: 'Projects',
        component: Chat,
        meta: { requiresAuth: true, tab: 'projects' },
    },
    {
        path: '/tasks',
        name: 'Tasks',
        component: Chat,
        meta: { requiresAuth: true, tab: 'tasks' },
    },
    {
        path: '/calendar',
        name: 'Calendar',
        component: Chat,
        meta: { requiresAuth: true, tab: 'calendar' },
    },
    {
        path: '/notes',
        name: 'Notes',
        component: Chat,
        meta: { requiresAuth: true, tab: 'notes' },
    },
    {
        path: '/join-chat/:token',
        name: 'JoinChat',
        component: JoinChat,
    },
    {
        path: '/account',
        name: 'UserAccount',
        component: UserAccount,
        meta: {
            requiresAuth: true,
            title: 'Account Settings',
            backPath: '/chat',
            backLabel: 'Back to Chat',
        },
    },
    {
        path: '/news',
        name: 'News',
        component: News,
        meta: { requiresAuth: true, title: 'Notes', backPath: '/chat', backLabel: 'Back to Chat' },
    },
    {
        path: '/news/create',
        name: 'CreateNews',
        component: CreateNews,
        meta: {
            requiresAuth: true,
            title: 'Create News Post',
            backPath: '/news',
            backLabel: 'Back to News',
        },
    },
    {
        path: '/news/:id',
        name: 'NewsDetail',
        component: NewsDetail,
        meta: { requiresAuth: true, title: 'News', backPath: '/news', backLabel: 'Back to News' },
    },
    {
        path: '/manifesto',
        name: 'Manifesto',
        component: ManifestoSocial,
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

// Простая навигационная защита
router.beforeEach((to, from, next) => {
    // Проверяем, требует ли маршрут авторизации
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    // Используем useUserStore внутри навигационной защиты
    const userStore = useUserStore()
    // Здесь будет проверка авторизации пользователя
    const isAuthenticated = userStore.hasUser()

    if (requiresAuth && !isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
