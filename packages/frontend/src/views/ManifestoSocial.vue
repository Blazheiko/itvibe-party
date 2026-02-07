<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Отслеживание ширины окна
const windowWidth = ref(window.innerWidth)

const handleResize = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('click', handleClickOutside)
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

// Вернуться к списку новостей
const backHome = () => {
    router.back()
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
</script>
<template>
    <div class="news-detail-page">
        <!-- Глобальный хедер выводится в App.vue -->

        <div class="content-wrapper">
            <div class="content-container">
                <div class="news-item">
                    <div class="news-item-content">
                        <h1 class="manifesto-title">LIGHTWEIGHT TASK MANAGER MANIFESTO</h1>

                        <div class="manifesto-point">
                            <div class="point-number">1</div>
                            <div class="point-content">
                                <h3>Simplicity and Intuitiveness</h3>
                                <p>
                                    An effective task manager should be as simple as possible to
                                    use. Any team member can start working within minutes without
                                    lengthy training. The interface should be intuitive and not
                                    distract from the main tasks.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">2</div>
                            <div class="point-content">
                                <h3>Transparency and Visibility</h3>
                                <p>
                                    Every team member should see the overall project picture. Task
                                    statuses, priorities, and assignees should be visible to all
                                    participants. Work transparency promotes better coordination and
                                    trust within the team.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">3</div>
                            <div class="point-content">
                                <h3>Flexibility and Adaptability</h3>
                                <p>
                                    The system should adapt to various work methodologies - from
                                    simple task lists to Kanban and Scrum. Teams should be able to
                                    customize workflows to their needs.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">4</div>
                            <div class="point-content">
                                <h3>Effective Communication</h3>
                                <p>
                                    Built-in tools for task discussions, comments, and feedback. All
                                    communication should be tied to task context to avoid losing
                                    important information.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">5</div>
                            <div class="point-content">
                                <h3>Security and Privacy</h3>
                                <p>
                                    Project data should be protected by modern encryption methods.
                                    Information access should be clearly role-based. Regular backups
                                    ensure data preservation.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">6</div>
                            <div class="point-content">
                                <h3>High Performance</h3>
                                <p>
                                    The system should work fast and stable even with large numbers
                                    of tasks and users. Interface response time should be minimal,
                                    and data synchronization should be instant.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">7</div>
                            <div class="point-content">
                                <h3>Integration and Compatibility</h3>
                                <p>
                                    Easy integration with popular development tools, calendars,
                                    version control systems, and other services. API should allow
                                    creating custom integrations.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">8</div>
                            <div class="point-content">
                                <h3>Smart Notifications</h3>
                                <p>
                                    The notification system should be customizable and not distract
                                    from work. Only important updates and critical changes should
                                    require immediate attention. Ability to configure notification
                                    frequency and channels.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">9</div>
                            <div class="point-content">
                                <h3>Analytics and Reporting</h3>
                                <p>
                                    Built-in tools for analyzing team productivity, task completion
                                    times, and process bottlenecks. Data should help improve
                                    workflows and planning.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">10</div>
                            <div class="point-content">
                                <h3>Scalability</h3>
                                <p>
                                    The system should work equally well for small teams of 3-5
                                    people and large organizations with hundreds of users.
                                    Architecture should allow horizontal scaling.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">11</div>
                            <div class="point-content">
                                <h3>Openness and Development Transparency</h3>
                                <p>
                                    Product development roadmap should be open. Users should be able
                                    to influence development priorities through voting and feature
                                    suggestions.
                                </p>
                            </div>
                        </div>

                        <div class="manifesto-point">
                            <div class="point-number">12</div>
                            <div class="point-content">
                                <h3>Support and Community</h3>
                                <p>
                                    Quality technical support and active user community.
                                    Comprehensive documentation, educational materials, and quick
                                    help when questions or problems arise.
                                </p>
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
    background-color: var(--background-color);
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
    background-color: #121212;
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
    box-sizing: border-box;
    display: flex;
    justify-content: center;
}

.dark-theme .news-header {
    background-color: #0d47a1;
}

.header-content {
    width: 100%;
    max-width: 1400px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
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
    padding: 20px;
    margin: 0 auto;
    color: var(--text-color);
}

.dark-theme .content-wrapper {
    color: #e0e0e0;
}

.content-container {
    width: 100%;
    max-width: 1400px;
    padding: 24px;
    box-sizing: border-box;
    margin: 0 auto;
}

.back-button {
    padding: 8px 15px;
    background-color: rgba(255, 255, 255, 0.1);
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
    background-color: rgba(255, 255, 255, 0.2);
    border-color: white;
    transform: translateY(-1px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.back-button:active {
    transform: translateY(0);
    opacity: 0.9;
}

.menu-container {
    position: relative;
}

.menu-button {
    background-color: rgba(255, 255, 255, 0.1);
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
    background-color: rgba(255, 255, 255, 0.2);
    border-color: white;
    transform: translateY(-1px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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
    border: 1px solid #444;
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
}

.menu-item:active {
    transform: translateY(0);
}

.content-wrapper::-webkit-scrollbar {
    width: 6px;
}

.content-wrapper::-webkit-scrollbar-track {
    background: transparent;
    margin: 10px 0;
}

.content-wrapper::-webkit-scrollbar-thumb {
    background-color: rgba(26, 115, 232, 0.4);
    border-radius: 6px;
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
    background-color: rgba(26, 115, 232, 0.7);
}

.news-item {
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    margin-bottom: 24px;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.dark-theme .news-item {
    background-color: #1e1e1e;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.news-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.news-item-content {
    padding: 30px;
}

.manifesto-title {
    font-size: 32px;
    font-weight: 800;
    margin: 0 0 40px;
    text-align: center;
    color: var(--text-color);
    letter-spacing: 1px;
    position: relative;
    padding-bottom: 15px;
    text-transform: uppercase;
}

.dark-theme .manifesto-title {
    color: #e0e0e0;
}

.manifesto-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 4px;
    background: linear-gradient(90deg, #1a73e8, #4285f4);
    border-radius: 2px;
}

.manifesto-point {
    display: flex;
    margin-bottom: 30px;
    padding-bottom: 25px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    background-color: white;
    border-radius: var(--border-radius);
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: var(--box-shadow);
}

.dark-theme .manifesto-point {
    background-color: #1e1e1e;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.manifesto-point:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.point-number {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    background-color: var(--primary-color);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 20px;
    margin-right: 20px;
    flex-shrink: 0;
    margin-bottom: 16px;
}

.dark-theme .point-number {
    background-color: #0d47a1;
}

.point-content {
    flex: 1;
}

.point-content h3 {
    color: var(--text-color);
    margin: 0 0 12px;
    font-size: 20px;
}

.dark-theme .point-content h3 {
    color: #e0e0e0;
}

.point-content p {
    margin: 0;
    line-height: 1.6;
    color: var(--text-color);
    font-size: 18px;
}

.dark-theme .point-content p {
    color: #adb5bd;
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

    .content-container {
        padding: 15px 10px;
    }

    .content-wrapper::-webkit-scrollbar {
        width: 0;
        display: none;
    }

    .news-item {
        margin: 0 0 8px 0;
        border-radius: 12px;
    }

    .news-item:hover {
        transform: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .news-item-content {
        padding: 20px 15px;
    }

    .manifesto-title {
        font-size: 28px;
        margin-bottom: 30px;
    }

    .manifesto-point {
        margin-bottom: 25px;
        padding-bottom: 20px;
    }

    .point-number {
        width: 36px;
        height: 36px;
        font-size: 18px;
        margin-right: 15px;
    }

    .point-content h3 {
        font-size: 20px;
        margin-bottom: 10px;
    }

    .point-content p {
        font-size: 16px;
        line-height: 1.7;
    }
}

@media (min-width: 768px) and (max-width: 1200px) {
    .header-content,
    .content-container {
        max-width: 1000px;
    }

    .manifesto-title {
        font-size: 32px;
    }

    .point-content h3 {
        font-size: 22px;
    }

    .point-content p {
        font-size: 17px;
    }
}
</style>
