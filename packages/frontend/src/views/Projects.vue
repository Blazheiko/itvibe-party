<script setup lang="ts">
defineOptions({ name: 'ProjectsView' })
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { projectsApi, type Project, type CreateProjectRequest } from '@/utils/projects-api'
import VoiceInput from '@/components/VoiceInput.vue'

// Define emits
const emit = defineEmits<{
    'toggle-contacts': []
}>()

const projects = ref<Project[]>([])
const showCreateForm = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const editingProjectId = ref<string | null>(null)
const editingProjectElement = ref<HTMLElement | null>(null)

const STATUSES: Project['status'][] = [
    'planning',
    'in_progress',
    'on_hold',
    'completed',
    'archived',
]
const PRIORITIES: Project['priority'][] = ['low', 'medium', 'high']

const PROJECT_COLORS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Gray', value: '#6B7280' },
]

const newProject = reactive({
    title: '' as string,
    description: '' as string,
    userId: '1' as string,
    status: 'planning' as Project['status'],
    priority: 'medium' as Project['priority'],
    progress: 0 as number,
    dueDateInput: '' as string,
    tags: '' as string,
    color: '' as string,
    endDateInput: '' as string,
    isActive: true as boolean,
    startDateInput: '' as string,
})

const circumference = 2 * Math.PI * 45

const loadProjects = async () => {
    isLoading.value = true
    error.value = null
    try {
        projects.value = await projectsApi.getProjects()
        console.log('Loaded projects:', projects.value)
    } catch (e) {
        error.value = 'Failed to load projects'
        console.error('Failed to load projects', e)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    loadProjects()
})

const submitButtonText = computed(() => {
    return editingProjectId.value ? 'Update' : 'Create'
})

const cancelForm = () => {
    showCreateForm.value = false
    resetForm()

    // Clear saved project element reference when canceling
    editingProjectElement.value = null
}

const canCreate = computed(() => newProject.title.trim().length > 0)

const resetForm = () => {
    newProject.title = ''
    newProject.description = ''
    newProject.userId = '1'
    newProject.status = 'planning'
    newProject.priority = 'medium'
    newProject.progress = 0
    newProject.dueDateInput = ''
    newProject.tags = ''
    newProject.color = ''
    newProject.endDateInput = ''
    newProject.isActive = true
    newProject.startDateInput = ''
    editingProjectId.value = null
}

// const formatDateTime = (date: Date | string | null): string => {
//     if (!date) return '-'
//     try {
//         const dateObj = typeof date === 'string' ? new Date(date) : date
//         if (!dateObj || isNaN(dateObj.getTime())) return '-'
//         return dateObj.toLocaleString('en-US', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//         })
//     } catch (e) {
//         console.error('Error formatting date:', e, date)
//         return '-'
//     }
// }

const formatDate = (date: Date | string | null): string => {
    if (!date) return '-'
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        if (!dateObj || isNaN(dateObj.getTime())) return '-'

        const day = dateObj.getDate().toString().padStart(2, '0')
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
        const year = dateObj.getFullYear()

        return `${day}-${month}-${year}`
    } catch (e) {
        console.error('Error formatting date:', e, date)
        return '-'
    }
}

// Voice input handlers
const handleTitleVoiceInput = (text: string) => {
    newProject.title = newProject.title ? newProject.title + ' ' + text : text
}

const handleDescriptionVoiceInput = (text: string) => {
    newProject.description = newProject.description ? newProject.description + ' ' + text : text
}

const createProject = async () => {
    if (!canCreate.value) return

    isLoading.value = true
    error.value = null

    try {
        const projectData: CreateProjectRequest = {
            title: newProject.title.trim(),
            description: newProject.description.trim() || '',
            userId: newProject.userId,
            status: newProject.status,
            priority: newProject.priority,
            progress: Number(newProject.progress) || 0,
            dueDate: newProject.dueDateInput || null,
            tags: newProject.tags
                ? newProject.tags
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                : null,
            color: newProject.color || null,
            endDate: newProject.endDateInput || null,
            isActive: Boolean(newProject.isActive),
            startDate: newProject.startDateInput || null,
        }

        if (editingProjectId.value) {
            // Update existing project
            const updatedProject = await projectsApi.updateProject(
                Number(editingProjectId.value),
                projectData,
            )
            if (updatedProject) {
                const index = projects.value.findIndex(
                    (p) => p.id === String(editingProjectId.value),
                )
                if (index !== -1) {
                    projects.value[index] = updatedProject
                }
            }
        } else {
            // Create new project
            const newProjectData = await projectsApi.createProject(projectData)
            console.log('New project created:', newProjectData)
            if (newProjectData) {
                projects.value.unshift(newProjectData)
                console.log('Updated projects array:', projects.value)
            }
        }

        showCreateForm.value = false
        resetForm()

        // Restore scroll position after editing if it was an edit operation
        if (editingProjectId.value && editingProjectElement.value) {
            nextTick(() => {
                if (editingProjectElement.value) {
                    editingProjectElement.value.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    })
                    editingProjectElement.value = null
                }
            })
        }
    } catch (e) {
        error.value = editingProjectId.value
            ? 'Failed to update project'
            : 'Failed to create project'
        console.error('Failed to save project', e)
    } finally {
        isLoading.value = false
    }
}

const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    isLoading.value = true
    error.value = null

    try {
        await projectsApi.deleteProject(Number(id))
        projects.value = projects.value.filter((p) => p.id !== id)
    } catch (e) {
        error.value = 'Failed to delete project'
        console.error('Failed to delete project', e)
    } finally {
        isLoading.value = false
    }
}

const updateProgress = async (id: string, progress: number) => {
    const project = projects.value.find((p) => p.id === id)
    if (!project) return

    const originalProgress = project.progress
    const originalStatus = project.status

    // Optimistically update UI
    project.progress = progress
    if (progress === 100) {
        project.status = 'completed'
    } else {
        if (project.status === 'completed') project.status = 'in_progress'
        if (progress === 0 && project.status !== 'archived') project.status = 'planning'
        if (progress > 0 && project.status === 'planning') project.status = 'in_progress'
    }

    try {
        await projectsApi.updateProject(Number(id), {
            progress,
            status: project.status,
        })
    } catch (e) {
        // Rollback changes on error
        project.progress = originalProgress
        project.status = originalStatus
        error.value = 'Failed to update progress'
        console.error('Failed to update progress', e)
    }
}

const editProject = (projectId: string): void => {
    const project = projects.value.find((p) => p.id === projectId)
    if (!project) return

    // Save reference to the project element that was clicked
    const projectElement = document.querySelector(`[data-project-id="${projectId}"]`) as HTMLElement
    editingProjectElement.value = projectElement

    // Fill form with project data
    newProject.title = project.title
    newProject.description = project.description || ''
    newProject.userId = project.userId
    newProject.status = project.status
    newProject.priority = project.priority
    newProject.progress = project.progress
    newProject.dueDateInput = project.dueDate ? project.dueDate.toISOString().slice(0, 16) : ''
    newProject.tags = project.tags ? project.tags.join(', ') : ''
    newProject.color = project.color || ''
    newProject.endDateInput = project.endDate ? project.endDate.toISOString().slice(0, 16) : ''
    newProject.isActive = project.isActive
    newProject.startDateInput = project.startDate
        ? project.startDate.toISOString().slice(0, 16)
        : ''

    // Set editing mode
    editingProjectId.value = projectId
    showCreateForm.value = true

    // Scroll to top where the form is located
    const projectsContent = document.querySelector('.projects-content')
    if (projectsContent) {
        projectsContent.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }
}

const projectStatuses = {
    planning: '#8b9dc3',
    in_progress: '#6b7db8',
    on_hold: '#a8a8c7',
    completed: '#7c8db8',
    archived: '#9ca3af',
}

const getStatusColor = (status: Project['status']): string =>
    projectStatuses[status] ? projectStatuses[status] : '#8b9dc3'

const projectPriorities = {
    low: '#a8b2d1',
    medium: '#8896c2',
    high: '#6b7db8',
}

const getPriorityColor = (priority: Project['priority']): string =>
    projectPriorities[priority] ? projectPriorities[priority] : '#a8b2d1'

const tagsToArray = (tags: string[] | null): string[] => {
    if (!tags) return []
    return Array.isArray(tags) ? tags : []
}
</script>

<template>
    <div class="projects-manager">
        <div class="projects-header">
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
            <h2>Projects</h2>
            <button @click="showCreateForm = !showCreateForm" class="create-project-button">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        </div>

        <div class="projects-content">
            <!-- Error message -->
            <div v-if="error" class="error-message">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                <span>{{ error }}</span>
                <button @click="error = null" class="close-error">×</button>
            </div>

            <!-- Loading overlay -->
            <div v-if="isLoading" class="loading-overlay">
                <div class="loading-spinner"></div>
                <p>Loading...</p>
            </div>

            <!-- Project creation form -->
            <div v-if="showCreateForm" class="create-project-form">
                <div class="form-grid">
                    <div class="form-col">
                        <label class="form-label">Title</label>
                        <div class="input-with-voice">
                            <input
                                v-model="newProject.title"
                                type="text"
                                placeholder="Enter project title..."
                                class="project-input"
                                @keyup.enter="createProject"
                                @keyup.esc="showCreateForm = false"
                            />
                            <VoiceInput @text-recognized="handleTitleVoiceInput" />
                        </div>
                    </div>
                    <div class="form-col">
                        <label class="form-label">Description</label>
                        <div class="input-with-voice">
                            <textarea
                                v-model="newProject.description"
                                rows="3"
                                placeholder="Enter description..."
                                class="project-textarea"
                            />
                            <VoiceInput @text-recognized="handleDescriptionVoiceInput" />
                        </div>
                    </div>

                    <div class="form-row">
                        <!-- <div class="form-col">
                            <label class="form-label">User ID</label>
                            <input v-model="newProject.userId" type="text" class="project-input" />
                        </div> -->
                        <div class="form-col">
                            <label class="form-label">Color</label>
                            <div
                                class="color-selector"
                                :style="{ backgroundColor: newProject.color }"
                            >
                                <select
                                    v-model="newProject.color"
                                    class="color-select"
                                    :style="{ backgroundColor: newProject.color }"
                                >
                                    <option value="">Select color</option>
                                    <option
                                        v-for="color in PROJECT_COLORS"
                                        :key="color.value"
                                        :value="color.value"
                                        :style="{ backgroundColor: color.value }"
                                    >
                                        {{ color.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-col form-col-checkbox">
                            <label class="form-label">Active</label>
                            <input v-model="newProject.isActive" type="checkbox" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-col">
                            <label class="form-label">Status</label>
                            <select v-model="newProject.status" class="project-select">
                                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
                            </select>
                        </div>
                        <div class="form-col">
                            <label class="form-label">Priority</label>
                            <select v-model="newProject.priority" class="project-select">
                                <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-col">
                            <label class="form-label">Progress: {{ newProject.progress }}%</label>
                            <input
                                v-model.number="newProject.progress"
                                type="range"
                                min="0"
                                max="100"
                                class="progress-slider"
                            />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-col">
                            <label class="form-label">Start Date</label>
                            <input
                                v-model="newProject.startDateInput"
                                type="datetime-local"
                                class="project-input"
                            />
                        </div>
                        <div class="form-col">
                            <label class="form-label">Due Date</label>
                            <input
                                v-model="newProject.dueDateInput"
                                type="datetime-local"
                                class="project-input"
                            />
                        </div>
                        <div class="form-col">
                            <label class="form-label">End Date</label>
                            <input
                                v-model="newProject.endDateInput"
                                type="datetime-local"
                                class="project-input"
                            />
                        </div>
                    </div>

                    <div class="form-col">
                        <label class="form-label">Tags (comma separated)</label>
                        <input
                            v-model="newProject.tags"
                            type="text"
                            placeholder="frontend, api, design"
                            class="project-input"
                        />
                    </div>
                </div>

                <div class="form-actions">
                    <button
                        @click="createProject"
                        :disabled="!canCreate || isLoading"
                        class="btn-primary"
                    >
                        {{ submitButtonText }}
                    </button>
                    <button @click="cancelForm" class="btn-secondary">Cancel</button>
                </div>
            </div>

            <!-- Projects list -->
            <div class="projects-list">
                <div v-if="projects.length === 0 && !isLoading" class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    <p>No projects</p>
                    <small>Create your first project by clicking the "+" button</small>
                </div>

                <div
                    v-for="project in projects"
                    :key="project.id"
                    :data-project-id="project.id"
                    class="project-item"
                    :style="{ '--project-color': project.color || 'transparent' }"
                >
                    <div class="project-main">
                        <div class="project-info">
                            <h4 class="project-title">{{ project.title }}</h4>
                            <p class="project-date">Created: {{ formatDate(project.createdAt) }}</p>
                            <p class="project-date">Updated: {{ formatDate(project.updatedAt) }}</p>
                        </div>

                        <div class="project-meta">
                            <span
                                class="status-badge"
                                :style="{ backgroundColor: getStatusColor(project.status) }"
                            >
                                {{ project.status }}
                            </span>
                            <span
                                class="priority-badge"
                                :style="{ backgroundColor: getPriorityColor(project.priority) }"
                            >
                                {{ project.priority }}
                            </span>
                            <span v-if="!project.isActive" class="inactive-badge">Inactive</span>
                        </div>
                    </div>

                    <div class="project-description" v-if="project.description">
                        {{ project.description }}
                    </div>

                    <div class="project-tags" v-if="tagsToArray(project.tags).length">
                        <span class="tag" v-for="tag in tagsToArray(project.tags)" :key="tag">{{
                            tag
                        }}</span>
                    </div>

                    <div class="dates-row">
                        <div class="date-chip">Start: {{ formatDate(project.startDate) }}</div>
                        <div class="date-chip">Due: {{ formatDate(project.dueDate) }}</div>
                        <div class="date-chip">End: {{ formatDate(project.endDate) }}</div>
                        <!-- <div
                            class="date-chip"
                            v-if="project.userId && project.userId !== 'undefined'"
                        >
                            User ID: {{ project.userId }}
                        </div> -->
                        <div
                            class="date-chip"
                            v-if="project.color"
                            :style="{ backgroundColor: project.color, color: 'white' }"
                        >
                            Color
                        </div>
                    </div>

                    <div class="project-progress">
                        <div class="progress-circle-container">
                            <div class="progress-circle-wrapper">
                                <svg class="progress-circle" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="#e9ecef"
                                        stroke-width="8"
                                        class="progress-bg"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        :stroke="getStatusColor(project.status)"
                                        stroke-width="8"
                                        stroke-linecap="round"
                                        :stroke-dasharray="circumference"
                                        :stroke-dashoffset="
                                            circumference - (project.progress / 100) * circumference
                                        "
                                        class="progress-fill-circle"
                                    />
                                </svg>
                                <div class="progress-text">{{ project.progress }}%</div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                disabled
                                :value="project.progress"
                                @input="
                                    updateProgress(
                                        project.id,
                                        parseInt(($event.target as HTMLInputElement).value),
                                    )
                                "
                                class="progress-slider"
                            />
                        </div>
                    </div>

                    <div class="project-actions">
                        <button
                            @click="editProject(project.id)"
                            :disabled="isLoading"
                            class="edit-button"
                            title="Edit project"
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                        <button
                            @click="deleteProject(project.id)"
                            :disabled="isLoading"
                            class="delete-button"
                            title="Delete project"
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
</template>

<style scoped>
.projects-manager {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    width: 100%;
    overflow: hidden;
}

.dark-theme .projects-manager {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
}

.projects-header {
    background-color: rgba(107, 125, 184, 0.7);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--box-shadow);
}

.back-button {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    transition: all 0.2s;
    display: none; /* Скрыта по умолчанию на десктопе */
    align-items: center;
    justify-content: center;
    margin-right: 12px;
}

.back-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-2px);
}

.back-button svg {
    width: 20px;
    height: 20px;
}

.projects-header h2 {
    flex: 1;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.create-project-button {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.create-project-button:hover {
    background: rgba(255, 255, 255, 0.2);
}

.create-project-button svg {
    width: 20px;
    height: 20px;
}

.projects-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    scroll-behavior: smooth;
    position: relative;
}

.projects-content::-webkit-scrollbar {
    width: 6px;
}

.projects-content::-webkit-scrollbar-track {
    background: transparent;
}

.projects-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

.dark-theme .projects-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
}

.error-message {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #dc2626;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.1);
}

.error-message svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.error-message span {
    flex: 1;
    font-weight: 500;
}

.close-error {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.close-error:hover {
    background: rgba(239, 68, 68, 0.1);
}

.dark-theme .error-message {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fca5a5;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 20px;
}

.dark-theme .loading-overlay {
    background: rgba(42, 42, 42, 0.9);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(107, 125, 184, 0.3);
    border-top: 4px solid #6b7db8;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.loading-overlay p {
    color: #6b7db8;
    font-weight: 500;
    margin: 0;
}

.dark-theme .loading-overlay p {
    color: #8896c2;
}

.create-project-form {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    transform: translateY(0);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.create-project-form::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #6b7db8 0%, #8896c2 50%, #a8b2d1 100%);
}

.create-project-form:hover {
    transform: translateY(-4px);
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
}

.dark-theme .create-project-form {
    background: rgba(42, 42, 42, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.form-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-col-checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
}

.form-label {
    font-size: 14px;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 4px;
}

.dark-theme .form-label {
    color: #e2e8f0;
}

.project-input {
    width: 100%;
    padding: 14px 18px;
    border: 2px solid transparent;
    border-radius: 12px;
    font-size: 15px;
    background: rgba(255, 255, 255, 0.8);
    color: #2d3748;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.project-input:focus {
    outline: none;
    border-color: rgba(107, 125, 184, 0.9);
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 8px 25px rgba(107, 125, 184, 0.15);
    transform: translateY(-1px);
}

.dark-theme .project-input {
    background: rgba(45, 55, 72, 0.8);
    color: #e2e8f0;
}

.dark-theme .project-input:focus {
    background: rgba(45, 55, 72, 1);
    border-color: rgba(107, 125, 184, 0.9);
}

.project-select {
    width: 100%;
    padding: 14px 18px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    color: #2d3748;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    cursor: pointer;
}

.project-select:focus {
    outline: none;
    border-color: rgba(107, 125, 184, 0.9);
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 8px 25px rgba(107, 125, 184, 0.15);
}

.dark-theme .project-select {
    background: rgba(45, 55, 72, 0.8);
    color: #e2e8f0;
}

.dark-theme .project-select:focus {
    background: rgba(45, 55, 72, 1);
    border-color: rgba(107, 125, 184, 0.9);
}

.project-textarea {
    width: 100%;
    padding: 14px 18px;
    border: 2px solid transparent;
    border-radius: 12px;
    font-size: 15px;
    background: rgba(255, 255, 255, 0.8);
    color: #2d3748;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    resize: vertical;
    min-height: 80px;
}

.project-textarea:focus {
    outline: none;
    border-color: rgba(107, 125, 184, 0.9);
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 8px 25px rgba(107, 125, 184, 0.15);
    transform: translateY(-1px);
}

.dark-theme .project-textarea {
    background: rgba(45, 55, 72, 0.8);
    color: #e2e8f0;
}

.dark-theme .project-textarea:focus {
    background: rgba(45, 55, 72, 1);
    border-color: rgba(107, 125, 184, 0.9);
}

.color-selector {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.color-select {
    width: 100%;
    padding: 14px 18px;
    border: 2px solid transparent;
    border-radius: 12px;
    font-size: 15px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
}

.color-select:focus {
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
}

.color-select option {
    padding: 10px;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.color-select option[value=''] {
    background-color: #6b7280 !important;
    color: white;
}

.dark-theme .color-select {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.dark-theme .color-select:focus {
    border-color: rgba(255, 255, 255, 0.3);
}

.form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
}

.btn-primary {
    background: linear-gradient(135deg, #6b7db8 0%, #8896c2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(107, 125, 184, 0.3);
    position: relative;
    overflow: hidden;
}

.btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(107, 125, 184, 0.4);
}

.btn-primary:hover::before {
    left: 100%;
}

.btn-primary:active {
    transform: translateY(-1px);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 12px rgba(107, 125, 184, 0.2);
}

.btn-primary:disabled::before {
    display: none;
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.8);
    color: #4a5568;
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 1);
    border-color: rgba(107, 125, 184, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.dark-theme .btn-secondary {
    background: rgba(45, 55, 72, 0.8);
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .btn-secondary:hover {
    background: rgba(45, 55, 72, 1);
    border-color: rgba(107, 125, 184, 0.9);
}

.projects-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #6c757d;
}

.empty-state svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    color: #adb5bd;
}

.empty-state p {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
}

.empty-state small {
    font-size: 14px;
    opacity: 0.7;
}

.project-item {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.project-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        var(--project-color, #a0aec0) 50%,
        transparent 100%
    );
    opacity: 0.7;
}

.project-item:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    border-color: rgba(107, 125, 184, 0.3);
}

.project-item:hover::before {
    opacity: 1;
    height: 6px;
}

.dark-theme .project-item {
    background: rgba(42, 42, 42, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .project-item:hover {
    border-color: rgba(107, 125, 184, 0.5);
}

.project-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.project-info {
    flex: 1;
}

.project-title {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 700;
    color: #2d3748;
    line-height: 1.3;
}

.dark-theme .project-title {
    color: #e2e8f0;
}

.project-date {
    margin: 0 0 4px 0;
    font-size: 12px;
    color: #718096;
    font-weight: 500;
}

.dark-theme .project-date {
    color: #a0aec0;
}

.project-meta {
    display: flex;
    gap: 8px;
    align-items: center;
}

.status-badge {
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
}

.status-badge::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s;
}

.status-badge:hover::before {
    left: 100%;
}

.priority-badge {
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
}

.priority-badge::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s;
}

.priority-badge:hover::before {
    left: 100%;
}

.inactive-badge {
    color: #fff;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.project-description {
    font-size: 15px;
    color: #4a5568;
    margin-bottom: 16px;
    line-height: 1.6;
    font-weight: 400;
}

.dark-theme .project-description {
    color: #cbd5e0;
}

.project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
}

.tag {
    background: linear-gradient(135deg, rgba(107, 125, 184, 0.1) 0%, rgba(136, 150, 194, 0.1) 100%);
    color: #6b7db8;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid rgba(107, 125, 184, 0.2);
    transition: all 0.2s;
}

.tag:hover {
    background: linear-gradient(135deg, rgba(107, 125, 184, 0.2) 0%, rgba(136, 150, 194, 0.2) 100%);
    transform: translateY(-1px);
}

.dates-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.date-chip {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-color);
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
}

.dark-theme .date-chip {
    background: rgba(255, 255, 255, 0.08);
}

.project-progress {
    margin-bottom: 16px;
}

.progress-circle-container {
    display: flex;
    align-items: center;
    gap: 16px;
}

.progress-circle-wrapper {
    position: relative;
    width: 100px;
    height: 100px;
    flex-shrink: 0;
}

.progress-circle {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.progress-bg {
    stroke: #f1f5f9;
    stroke-width: 6;
}

.dark-theme .progress-bg {
    stroke: #374151;
}

.progress-fill-circle {
    transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
    stroke-width: 6;
    stroke-linecap: round;
}

.progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 16px;
    font-weight: 700;
    color: #2d3748;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark-theme .progress-text {
    color: #e2e8f0;
}

.progress-slider {
    flex: 1;
    height: 8px;
    background: linear-gradient(to right, #f1f5f9 0%, #f1f5f9 100%);
    outline: none;
    border-radius: 20px;
    cursor: pointer;
    margin: 0;
    transition: all 0.2s;
}

.progress-slider:hover {
    transform: scaleY(1.2);
}

.progress-slider::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6b7db8 0%, #8896c2 100%);
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(107, 125, 184, 0.4);
    transition: all 0.2s;
}

.progress-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 6px 20px rgba(107, 125, 184, 0.6);
}

.progress-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6b7db8 0%, #8896c2 100%);
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(107, 125, 184, 0.4);
    transition: all 0.2s;
}

.dark-theme .progress-slider {
    background: linear-gradient(to right, #374151 0%, #374151 100%);
}

.dark-theme .progress-slider::-webkit-slider-thumb {
    background: linear-gradient(135deg, #6b7db8 0%, #8896c2 100%);
}

.dark-theme .progress-slider::-moz-range-thumb {
    background: linear-gradient(135deg, #6b7db8 0%, #8896c2 100%);
}

.project-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.delete-button {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
    border: 2px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    cursor: pointer;
    padding: 12px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
}

.delete-button:hover {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
    border-color: rgba(239, 68, 68, 0.4);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

.delete-button:active {
    transform: translateY(0) scale(1);
}

.delete-button svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s;
}

.delete-button:hover svg {
    transform: scale(1.1);
}

.edit-button {
    background: linear-gradient(135deg, rgba(107, 125, 184, 0.1) 0%, rgba(136, 150, 194, 0.1) 100%);
    border: 2px solid rgba(107, 125, 184, 0.2);
    color: #6b7db8;
    cursor: pointer;
    padding: 12px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
}

.edit-button:hover {
    background: linear-gradient(135deg, rgba(107, 125, 184, 0.2) 0%, rgba(136, 150, 194, 0.2) 100%);
    border-color: rgba(107, 125, 184, 0.4);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(107, 125, 184, 0.3);
}

.edit-button:active {
    transform: translateY(0) scale(1);
}

.edit-button svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s;
}

.edit-button:hover svg {
    transform: scale(1.1);
}

.edit-button:disabled,
.delete-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.edit-button:disabled:hover,
.delete-button:disabled:hover {
    transform: none;
    box-shadow: none;
}

.edit-button:disabled svg,
.delete-button:disabled svg {
    transform: none;
}

@media (max-width: 768px) {
    .projects-manager {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .dark-theme .projects-manager {
        background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    }

    .back-button {
        display: flex; /* Показать кнопку на мобильных устройствах */
    }

    .projects-header {
        padding: 18px 20px;
    }

    .projects-header h2 {
        font-size: 18px;
        margin: 0 16px;
    }

    .create-project-button {
        width: 36px;
        height: 36px;
    }

    .projects-content {
        padding: 20px;
    }

    .create-project-form {
        padding: 24px;
        margin-bottom: 24px;
    }

    .form-row {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .project-item {
        padding: 20px;
        border-radius: 16px;
    }

    .project-main {
        flex-direction: column;
        gap: 16px;
        margin-bottom: 20px;
    }

    .project-meta {
        flex-wrap: wrap;
        gap: 6px;
    }

    .status-badge,
    .priority-badge,
    .inactive-badge {
        padding: 6px 12px;
        font-size: 10px;
    }

    .project-title {
        font-size: 16px;
        margin-bottom: 8px;
    }

    .project-description {
        font-size: 14px;
        margin-bottom: 12px;
    }

    .progress-circle-container {
        flex-direction: column;
        gap: 16px;
        align-items: center;
    }

    .progress-circle-wrapper {
        width: 80px;
        height: 80px;
    }

    .progress-text {
        font-size: 14px;
    }

    .progress-slider {
        width: 100%;
        height: 6px;
    }

    .form-actions {
        flex-direction: column;
        gap: 12px;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
        padding: 16px 24px;
        font-size: 16px;
    }

    .dates-row {
        flex-direction: column;
        gap: 6px;
    }

    .date-chip {
        font-size: 11px;
        padding: 6px 10px;
    }

    .tag {
        padding: 4px 8px;
        font-size: 10px;
    }

    .edit-button,
    .delete-button {
        padding: 10px;
    }

    .edit-button svg,
    .delete-button svg {
        width: 18px;
        height: 18px;
    }

    .project-input,
    .project-select,
    .project-textarea,
    .color-select {
        padding: 12px 16px;
        font-size: 16px; /* Prevents zoom on iOS */
    }

    .color-select {
        padding-right: 2.5rem;
    }
}

@media (max-width: 480px) {
    .back-button {
        width: 28px;
        height: 28px;
        margin-right: 8px;
    }

    .back-button svg {
        width: 18px;
        height: 18px;
    }

    .projects-header {
        padding: 16px 16px;
    }

    .projects-header h2 {
        font-size: 16px;
        margin: 0 12px;
    }

    .create-project-button {
        width: 32px;
        height: 32px;
    }

    .projects-content {
        padding: 16px;
    }

    .create-project-form {
        padding: 20px;
        border-radius: 16px;
    }

    .project-item {
        padding: 16px;
        border-radius: 12px;
    }

    .progress-circle-wrapper {
        width: 70px;
        height: 70px;
    }

    .progress-text {
        font-size: 12px;
    }
}

/* Voice input wrapper */
.input-with-voice {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.input-with-voice .project-input,
.input-with-voice .project-textarea {
    flex: 1;
}
</style>
