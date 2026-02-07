<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import VoiceInput from './VoiceInput.vue'

defineOptions({
    name: 'CalendarComponent',
})

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(new Date())
const dayTimelineRef = ref<HTMLElement | null>(null)
const hourRefs = ref<HTMLElement[]>([])
const dateEvents = ref<
    {
        date: Date
        title: string
        description: string
        startTime?: string
        endTime?: string
    }[]
>([])
const newEvent = ref({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
})
const showAddEventModal = ref(false)

const emit = defineEmits(['toggle-contacts', 'back-to-chat'])

// Months and weekdays
const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Computed properties for current month and year
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

// Current month name and year
const currentMonthName = computed(() => {
    return `${months[currentMonth.value]} ${currentYear.value}`
})

// Generate days for calendar
const calendarDays = computed(() => {
    const firstDay = new Date(currentYear.value, currentMonth.value, 1)
    const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)

    // Get day of week for first day of month (0 - Sunday, 1 - Monday, etc.)
    let firstDayOfWeek = firstDay.getDay()
    // Convert to our format (0 - Monday, 6 - Sunday)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const days = []

    // Add days from previous month
    const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push({
            date: new Date(currentYear.value, currentMonth.value - 1, prevMonthLastDay - i),
            isCurrentMonth: false,
            hasEvent: hasEventOnDate(
                new Date(currentYear.value, currentMonth.value - 1, prevMonthLastDay - i),
            ),
        })
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(currentYear.value, currentMonth.value, i)
        days.push({
            date,
            isCurrentMonth: true,
            isToday: isToday(date),
            hasEvent: hasEventOnDate(date),
        })
    }

    // Add days from next month
    const remainingDays = 7 - (days.length % 7 || 7)
    if (remainingDays < 7) {
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(currentYear.value, currentMonth.value + 1, i),
                isCurrentMonth: false,
                hasEvent: hasEventOnDate(new Date(currentYear.value, currentMonth.value + 1, i)),
            })
        }
    }

    return days
})

// Check if date is today
function isToday(date: Date): boolean {
    const today = new Date()
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    )
}

// Check if there's an event on selected date
function hasEventOnDate(date: Date): boolean {
    return dateEvents.value.some(
        (event) =>
            event.date.getDate() === date.getDate() &&
            event.date.getMonth() === date.getMonth() &&
            event.date.getFullYear() === date.getFullYear(),
    )
}

// Get events for selected date
const eventsForSelectedDate = computed(() => {
    if (!selectedDate.value) return []

    return dateEvents.value.filter(
        (event) =>
            event.date.getDate() === selectedDate.value!.getDate() &&
            event.date.getMonth() === selectedDate.value!.getMonth() &&
            event.date.getFullYear() === selectedDate.value!.getFullYear(),
    )
})

// Function to go to previous month
function prevMonth() {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

// Function to go to next month
function nextMonth() {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

// Select date
function selectDate(date: Date) {
    selectedDate.value = new Date(date)
}

// Reset timeline scroll when a new date is selected
watch(selectedDate, async () => {
    await nextTick()
    const container = dayTimelineRef.value
    if (container) {
        container.scrollTo({ top: 0, behavior: 'auto' })
    }
})

// Auto-scroll to earliest event in the selected day
watch(
    eventsForSelectedDate,
    async (events) => {
        if (!events || events.length === 0) return

        // Determine earliest event hour
        let earliestHour: number | null = null
        let earliestMinutes: number | null = null
        for (const event of events) {
            if (!event.startTime) continue
            const [hStr, mStr] = event.startTime.split(':')
            const h = parseInt(hStr)
            const m = parseInt(mStr || '0')
            if (earliestHour === null) {
                earliestHour = h
                earliestMinutes = m
            } else if (h < earliestHour || (h === earliestHour && m < (earliestMinutes || 0))) {
                earliestHour = h
                earliestMinutes = m
            }
        }

        if (earliestHour === null) return

        await nextTick()
        const container = dayTimelineRef.value
        const block = hourRefs.value[earliestHour]
        if (container && block) {
            container.scrollTo({ top: block.offsetTop, behavior: 'smooth' })
        }
    },
    { immediate: true },
)

//

// Voice input handlers
const handleTitleVoiceInput = (text: string) => {
    newEvent.value.title = newEvent.value.title ? newEvent.value.title + ' ' + text : text
}

const handleDescriptionVoiceInput = (text: string) => {
    newEvent.value.description = newEvent.value.description
        ? newEvent.value.description + ' ' + text
        : text
}

// Open add event modal
function openAddEventModal() {
    showAddEventModal.value = true
    newEvent.value = { title: '', description: '', startTime: '09:00', endTime: '10:00' }
}

// Add new event
function addEvent() {
    if (selectedDate.value && newEvent.value.title.trim()) {
        dateEvents.value.push({
            date: new Date(selectedDate.value),
            title: newEvent.value.title,
            description: newEvent.value.description,
            startTime: newEvent.value.startTime,
            endTime: newEvent.value.endTime,
        })

        // Save events to localStorage
        saveEvents()

        // Close modal
        showAddEventModal.value = false
        newEvent.value = { title: '', description: '', startTime: '09:00', endTime: '10:00' }
    }
}

// Delete event
function deleteEvent(index: number) {
    dateEvents.value.splice(index, 1)
    saveEvents()
}

// Save events to localStorage
function saveEvents() {
    const eventsToSave = dateEvents.value.map((event) => ({
        date: event.date.toISOString(),
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
    }))

    localStorage.setItem('calendar_events', JSON.stringify(eventsToSave))
}

// Load events from localStorage
function loadEvents() {
    const savedEvents = localStorage.getItem('calendar_events')
    if (savedEvents) {
        try {
            const parsedEvents = JSON.parse(savedEvents)
            dateEvents.value = parsedEvents.map(
                (event: {
                    date: string
                    title: string
                    description: string
                    startTime?: string
                    endTime?: string
                }) => ({
                    date: new Date(event.date),
                    title: event.title,
                    description: event.description,
                    startTime: event.startTime || '09:00',
                    endTime: event.endTime || '10:00',
                }),
            )
        } catch (e) {
            console.error('Error loading calendar events:', e)
        }
    }
}

// Load events when component is mounted
onMounted(() => {
    loadEvents()

    // If no events exist, add demo events
    if (dateEvents.value.length === 0) {
        const today = new Date()
        const tomorrow = new Date()
        tomorrow.setDate(today.getDate() + 1)

        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)

        // Add demo events
        dateEvents.value = [
            {
                date: today,
                title: 'Team Meeting',
                description: 'Discussing new app features and sprint planning',
                startTime: '10:00',
                endTime: '11:30',
            },
            {
                date: today,
                title: 'Lunch',
                description: 'Business lunch with partners',
                startTime: '13:00',
                endTime: '14:00',
            },
            {
                date: tomorrow,
                title: 'Client Call',
                description: 'Prototype presentation and requirements discussion',
                startTime: '15:00',
                endTime: '16:00',
            },
            {
                date: nextWeek,
                title: 'Project Deadline',
                description: 'Final version of the application must be delivered',
                startTime: '18:00',
                endTime: '19:00',
            },
        ]

        // Save events
        saveEvents()
    }
})

// Date formatting
function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

// Array of hours for day view
const hoursOfDay = computed(() => {
    const hours = []
    for (let i = 0; i < 24; i++) {
        hours.push(`${i.toString().padStart(2, '0')}:00`)
    }
    return hours
})

// Add function to get events for specific hour
function getEventsForHour(hour: string) {
    if (!selectedDate.value) return []

    return eventsForSelectedDate.value.filter((event) => {
        if (!event.startTime) return false

        const eventStartHour = parseInt(event.startTime.split(':')[0])
        const currentHour = parseInt(hour.split(':')[0])

        return eventStartHour === currentHour
    })
}

// Function to format time in 12-hour format (for display)
function formatTime(time?: string): string {
    if (!time) return ''

    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)

    if (hour === 0) return `12:${minutes} AM`
    if (hour < 12) return `${hour}:${minutes} AM`
    if (hour === 12) return `12:${minutes} PM`

    return `${hour - 12}:${minutes} PM`
}

// Function to determine event duration in hours
function getEventDurationInHours(event: { startTime?: string; endTime?: string }): number {
    if (!event.startTime || !event.endTime) return 1

    const [startHours, startMinutes] = event.startTime.split(':').map(Number)
    const [endHours, endMinutes] = event.endTime.split(':').map(Number)

    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes

    // Return duration in hours rounded up
    return Math.ceil((endTotalMinutes - startTotalMinutes) / 60)
}

// Function to select event color based on its index
function getEventColor(index: number): string {
    const colors = [
        '#4285F4', // Google Blue
        '#EA4335', // Google Red
        '#FBBC05', // Google Yellow
        '#34A853', // Google Green
        '#FF6D01', // Orange
        '#46BDC6', // Teal
        '#7C4DFF', // Purple
        '#795548', // Brown
    ]

    return colors[index % colors.length]
}
</script>

<template>
    <div class="calendar-container">
        <!-- Хедер календаря -->
        <div class="calendar-header">
            <!-- <button class="back-button" @click="emit('back-to-chat')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                        fill="currentColor"
                    />
                </svg>
                <span>Назад к чату</span>
            </button> -->
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
            <h2>Calendar</h2>
            <div class="header-buttons"></div>
        </div>

        <div class="calendar-view">
            <!-- Навигация по месяцам -->
            <div class="month-navigation">
                <button @click="prevMonth" class="nav-button">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
                <h3>{{ currentMonthName }}</h3>
                <button @click="nextMonth" class="nav-button">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>

            <!-- Дни недели -->
            <div class="weekdays">
                <div class="weekday" v-for="day in weekDays" :key="day">{{ day }}</div>
            </div>

            <!-- Календарная сетка -->
            <div class="calendar-grid">
                <div
                    v-for="(day, index) in calendarDays"
                    :key="index"
                    class="day"
                    :class="{
                        'other-month': !day.isCurrentMonth,
                        today: day.isToday,
                        'has-event': day.hasEvent,
                    }"
                    @click="selectDate(day.date)"
                >
                    {{ day.date.getDate() }}
                    <div v-if="day.hasEvent" class="event-indicator"></div>
                </div>
            </div>
        </div>

        <!-- Детальный просмотр выбранной даты -->
        <div class="date-details">
            <div class="date-details-header">
                <h3>
                    {{ selectedDate ? formatDate(selectedDate) : '' }}
                    <span v-if="eventsForSelectedDate.length > 0" class="events-count">
                        Events: {{ eventsForSelectedDate.length }}
                    </span>
                    <span v-else class="events-count"> No events for selected date </span>
                </h3>
                <button @click="openAddEventModal" class="add-event-button">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
                    </svg>
                    <span>Add</span>
                </button>
            </div>

            <!-- <div class="events-list" v-if="eventsForSelectedDate.length === 0">
                <div class="no-events">No events for selected date</div>
            </div> -->

            <div class="day-timeline" ref="dayTimelineRef">
                <div
                    v-for="(hour, idx) in hoursOfDay"
                    :key="hour"
                    class="hour-block"
                    :ref="(el) => (hourRefs[idx] = el as HTMLElement)"
                >
                    <div class="hour-label">{{ hour }}</div>
                    <div class="hour-content">
                        <div
                            v-for="(event, idx) in getEventsForHour(hour)"
                            :key="idx"
                            class="timeline-event"
                            :style="{
                                height: `${getEventDurationInHours(event) * 60}px`,
                                backgroundColor: getEventColor(idx),
                            }"
                        >
                            <div class="event-time">
                                {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
                            </div>
                            <div class="event-title">{{ event.title }}</div>
                            <div class="event-description">{{ event.description }}</div>
                            <button
                                @click="deleteEvent(dateEvents.indexOf(event))"
                                class="delete-timeline-event"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Модальное окно добавления события -->
        <div v-if="showAddEventModal" class="modal-overlay" @click="showAddEventModal = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Add Event</h3>
                    <button class="close-modal" @click="showAddEventModal = false">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="event-title">Title</label>
                        <div class="input-with-voice">
                            <input
                                id="event-title"
                                v-model="newEvent.title"
                                type="text"
                                placeholder="Enter event title"
                            />
                            <VoiceInput @text-recognized="handleTitleVoiceInput" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="event-description">Description</label>
                        <div class="input-with-voice">
                            <textarea
                                id="event-description"
                                v-model="newEvent.description"
                                placeholder="Enter event description"
                            ></textarea>
                            <VoiceInput @text-recognized="handleDescriptionVoiceInput" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="event-start-time">Start Time</label>
                            <input id="event-start-time" v-model="newEvent.startTime" type="time" />
                        </div>
                        <div class="form-group half">
                            <label for="event-end-time">End Time</label>
                            <input id="event-end-time" v-model="newEvent.endTime" type="time" />
                        </div>
                    </div>
                    <div class="form-actions">
                        <button @click="showAddEventModal = false" class="cancel-button">
                            Cancel
                        </button>
                        <button @click="addEvent" class="save-button">Save</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.calendar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--background-color, white);
    overflow: hidden;
}

.dark-theme .calendar-container {
    background-color: #1e1e1e;
}

.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background-color: rgba(255, 59, 48, 0.7);
    color: white;
    box-shadow: var(--box-shadow);
}

.calendar-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.header-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

.back-button,
.menu-button {
    background: transparent;
    border: none;
    /* Важно: убираем вертикальные паддинги, чтобы высота шапки совпадала с ChatArea */
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

.calendar-view {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.month-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.month-navigation h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-color, #333);
}

.dark-theme .month-navigation h3 {
    color: #e0e0e0;
}

.nav-button {
    background: transparent;
    border: none;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    color: var(--text-color, #333);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.dark-theme .nav-button {
    color: #e0e0e0;
}

.nav-button svg {
    width: 24px;
    height: 24px;
}

.nav-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .nav-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 10px;
}

.weekday {
    text-align: center;
    font-weight: 500;
    font-size: 14px;
    color: #6c757d;
    padding: 8px 0;
}

.dark-theme .weekday {
    color: #adb5bd;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
}

.day {
    position: relative;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-color, #333);
    transition: all 0.2s ease;
}

.dark-theme .day {
    color: #e0e0e0;
}

.day:hover {
    background-color: rgba(26, 115, 232, 0.1);
}

.day.other-month {
    color: #adb5bd;
}

.dark-theme .day.other-month {
    color: #6c757d;
}

.day.today {
    background-color: rgba(255, 59, 48, 0.9);
    color: white;
    font-weight: 500;
}

.day.has-event {
    font-weight: 500;
}

.event-indicator {
    position: absolute;
    bottom: 4px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: rgba(255, 59, 48, 0.9);
}

.day.today .event-indicator {
    background-color: white;
}

/* Стили для детального просмотра даты */
.date-details {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.date-details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.date-details-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-color, #333);
}

.events-count {
    display: inline-block;
    margin-left: 10px;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(26, 115, 232, 0.1);
    color: #1a73e8;
    font-size: 12px;
    font-weight: 600;
    vertical-align: middle;
}

.dark-theme .date-details-header h3 {
    color: #e0e0e0;
}

.add-event-button {
    background-color: rgba(255, 59, 48, 0.9);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.add-event-button svg {
    width: 18px;
    height: 18px;
}

.add-event-button:hover {
    background-color: rgba(255, 59, 48, 1);
}

.events-list {
    flex: 0 0 auto;
}

.no-events {
    text-align: center;
    padding: 6px 0;
    color: #6c757d;
    font-size: 16px;
}

.dark-theme .no-events {
    color: #adb5bd;
}

.event-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 16px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dark-theme .event-item {
    background-color: #2a2a2a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.event-content {
    flex: 1;
    overflow: hidden;
}

.event-content h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color, #333);
}

.dark-theme .event-content h4 {
    color: #e0e0e0;
}

.event-content p {
    margin: 0;
    font-size: 14px;
    color: #6c757d;
    line-height: 1.5;
}

.dark-theme .event-content p {
    color: #adb5bd;
}

.delete-event {
    background: none;
    border: none;
    padding: 8px;
    color: #dc3545;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.delete-event svg {
    width: 18px;
    height: 18px;
}

.delete-event:hover {
    background-color: rgba(220, 53, 69, 0.1);
}

/* Модальное окно */
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

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color, #333);
}

.dark-theme .modal-header h3 {
    color: #e0e0e0;
}

.close-modal {
    background: transparent;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--text-color, #333);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.dark-theme .close-modal {
    color: #e0e0e0;
}

.close-modal svg {
    width: 20px;
    height: 20px;
}

.close-modal:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .close-modal:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color, #333);
}

.dark-theme .form-group label {
    color: #e0e0e0;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
    color: var(--text-color, #333);
    outline: none;
}

.dark-theme .form-group input,
.dark-theme .form-group textarea {
    background-color: #333;
    border-color: #444;
    color: #e0e0e0;
}

.form-group textarea {
    height: 100px;
    resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
    border-color: rgba(255, 59, 48, 0.9);
    box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.1);
}

.dark-theme .form-group input:focus,
.dark-theme .form-group textarea:focus {
    box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.2);
}

.form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.cancel-button,
.save-button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
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
    background-color: rgba(255, 59, 48, 0.9);
    color: white;
}

.cancel-button:hover {
    background-color: #dee2e6;
}

.dark-theme .cancel-button:hover {
    background-color: #555;
}

.save-button:hover {
    background-color: rgba(255, 59, 48, 1);
}

@media (max-width: 768px) {
    .calendar-header {
        padding: 14px 16px;
    }

    .calendar-header h2 {
        font-size: 16px;
    }

    /* Кнопка назад в верхней шапке остаётся компактной и не увеличивает высоту */
    .calendar-header .back-button {
        padding: 0;
        width: 24px;
        height: 24px;
    }

    .calendar-view {
        padding: 16px;
    }

    .date-details {
        padding: 16px;
    }

    .day {
        height: 36px;
        font-size: 13px;
    }

    /* Внутри детального экрана оставляем более крупную кнопку */
    .date-details .back-button,
    .add-event-button {
        padding: 6px 12px;
        font-size: 13px;
    }

    .back-button svg {
        width: 20px;
        height: 20px;
    }

    .add-event-button svg {
        width: 16px;
        height: 16px;
    }

    .event-item {
        padding: 12px;
    }

    .month-navigation h3,
    .date-details-header h3 {
        font-size: 16px;
    }

    .modal-content {
        padding: 16px;
    }
}

/* Стили для временной шкалы дня */
.day-timeline {
    flex: 1;
    overflow-y: auto;
    position: relative;
    padding: 0 20px;
}

.hour-block {
    display: flex;
    min-height: 60px;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
}

.dark-theme .hour-block {
    border-bottom: 1px solid #333;
}

.hour-block:last-child {
    border-bottom: none;
}

.hour-label {
    width: 60px;
    padding: 10px 10px 10px 0;
    font-size: 12px;
    color: #6c757d;
    text-align: right;
    flex-shrink: 0;
}

.dark-theme .hour-label {
    color: #adb5bd;
}

.hour-content {
    flex: 1;
    position: relative;
    padding: 5px 0;
    min-height: 60px;
}

.timeline-event {
    position: relative;
    padding: 10px;
    border-radius: 5px;
    color: white;
    margin-bottom: 5px;
    overflow: hidden;
    cursor: pointer;
    z-index: 1;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.timeline-event:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.event-time {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 5px;
    opacity: 0.9;
}

.event-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
}

.event-description {
    font-size: 12px;
    opacity: 0.85;
    word-break: break-word;
}

.delete-timeline-event {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.timeline-event:hover .delete-timeline-event {
    opacity: 1;
}

.delete-timeline-event svg {
    width: 16px;
    height: 16px;
    color: white;
}

.form-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}

.form-group.half {
    flex: 1;
    margin-bottom: 0;
}

/* Voice input wrapper */
.input-with-voice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
}

.input-with-voice input,
.input-with-voice textarea {
    flex: 1;
}
</style>
