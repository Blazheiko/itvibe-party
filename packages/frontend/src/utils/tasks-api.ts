import baseApi from './base-api'
import type { Project } from './projects-api'

export interface Task {
    id: string
    title: string
    description: string | null
    userId: string
    projectId: string | null
    status: 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    progress: number
    isCompleted: boolean
    tags: string | null
    dueDate: Date | null
    startDate: Date | null
    estimatedHours: number | null
    actualHours: number | null
    parentTaskId: string | null
    createdAt: Date
    updatedAt: Date
}

export interface CreateTaskRequest {
    title: string
    description?: string
    userId: string
    projectId?: string | null
    status: Task['status']
    priority: Task['priority']
    progress: number
    isCompleted: boolean
    tags?: string | null
    dueDate?: string | null
    startDate?: string | null
    estimatedHours?: number | null
    actualHours?: number | null
    parentTaskId?: string | null
    [key: string]: unknown
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
    id?: never
}

export interface TasksResponse {
    tasks: Task[]
}

// Transform task data from server, converting date strings to Date objects
const transformTaskDates = (task: Record<string, unknown>): Task => {
    const transformedTask = { ...task } as Record<string, unknown>

    // Convert date fields
    const dateFields = ['dueDate', 'startDate', 'createdAt', 'updatedAt']
    dateFields.forEach((field) => {
        if (transformedTask[field] && typeof transformedTask[field] === 'string') {
            transformedTask[field] = new Date(transformedTask[field] as string)
        }
    })

    // Ensure proper field naming/types
    if (transformedTask.user_id) {
        transformedTask.userId = String(transformedTask.user_id)
        delete transformedTask.user_id
    }
    if (transformedTask.project_id !== undefined) {
        transformedTask.projectId = transformedTask.project_id
            ? String(transformedTask.project_id)
            : null
        delete transformedTask.project_id
    }
    if (transformedTask.is_completed !== undefined) {
        transformedTask.isCompleted = Boolean(transformedTask.is_completed)
        delete transformedTask.is_completed
    }
    if (transformedTask.due_date !== undefined) {
        transformedTask.dueDate = transformedTask.due_date
            ? new Date(transformedTask.due_date as string)
            : null
        delete transformedTask.due_date
    }
    if (transformedTask.start_date !== undefined) {
        transformedTask.startDate = transformedTask.start_date
            ? new Date(transformedTask.start_date as string)
            : null
        delete transformedTask.start_date
    }
    if (transformedTask.estimated_hours !== undefined) {
        transformedTask.estimatedHours = transformedTask.estimated_hours
            ? Number(transformedTask.estimated_hours)
            : null
        delete transformedTask.estimated_hours
    }
    if (transformedTask.actual_hours !== undefined) {
        transformedTask.actualHours = transformedTask.actual_hours
            ? Number(transformedTask.actual_hours)
            : null
        delete transformedTask.actual_hours
    }
    if (transformedTask.parent_task_id !== undefined) {
        transformedTask.parentTaskId = transformedTask.parent_task_id
            ? String(transformedTask.parent_task_id)
            : null
        delete transformedTask.parent_task_id
    }
    if (transformedTask.created_at) {
        transformedTask.createdAt = new Date(transformedTask.created_at as string)
        delete transformedTask.created_at
    }
    if (transformedTask.updated_at) {
        transformedTask.updatedAt = new Date(transformedTask.updated_at as string)
        delete transformedTask.updated_at
    }

    // Ensure id is string
    if (transformedTask.id) {
        transformedTask.id = String(transformedTask.id)
    }

    return transformedTask as unknown as Task
}

export const tasksApi = {
    // Get all tasks
    async getTasks(): Promise<{tasks: Task[], projects: Project[]}> {
        try {
            const response = await baseApi.http<TasksResponse>('GET', '/api/tasks')
            console.log('Tasks API response:', response)

            if (response.error || !response.data) {
                console.error('Error loading tasks:', response.error)
                return {tasks: [], projects: []}
            }

            return response.data as {tasks: Task[], projects: Project[]}

            // if (response.data?.tasks) {
            //     console.log('Raw tasks from server:', response.data.tasks)
            //     return response.data.tasks.map((t: unknown) =>
            //         transformTaskDates(t as Record<string, unknown>),
            //     )
            // }

            // Check if response data is directly an array of tasks
            // if (Array.isArray(response.data)) {
            //     console.log('Direct array of tasks from server:', response.data)
            //     return response.data.map((t: unknown) =>
            //         transformTaskDates(t as Record<string, unknown>),
            //     )
            // }

            // console.log('No tasks found in response:', response.data)
            // return []
        } catch (error) {
            console.error('Failed to load tasks:', error)
            return {tasks: [], projects: []}
        }
    },

    // Get specific task
    async getTask(taskId: number): Promise<Task | null> {
        try {
            const response = await baseApi.http<Record<string, unknown>>('GET', `/api/tasks/${taskId}`)

            if (response.error || !response.data) {
                console.error('Error loading task:', response.error)
                return null
            }

            const responseData = response.data as Record<string, unknown>
            const receivedTask = responseData?.task || responseData
            return receivedTask ? transformTaskDates(receivedTask as Record<string, unknown>) : null
        } catch (error) {
            console.error('Failed to load task:', error)
            return null
        }
    },

    // Create new task
    async createTask(taskData: CreateTaskRequest): Promise<Task | null> {
        try {
            const response = await baseApi.http<Record<string, unknown>>('POST', '/api/tasks', taskData)

            if (response.error) {
                console.error('Error creating task:', response.error)
                throw new Error(response.error.message)
            }

            console.log('Raw task data from server:', response.data)

            // Check if response is wrapped in a task object or is direct task data
            const responseData = response.data as Record<string, unknown>
            const receivedTask = responseData?.task || responseData
            return receivedTask ? transformTaskDates(receivedTask as Record<string, unknown>) : null
        } catch (error) {
            console.error('Failed to create task:', error)
            throw error
        }
    },

    // Update task
    async updateTask(taskId: number, taskData: UpdateTaskRequest): Promise<Task | null> {
        try {
            const response = await baseApi.http<Record<string, unknown>>(
                'PUT',
                `/api/tasks/${taskId}`,
                taskData,
            )

            if (response.error) {
                console.error('Error updating task:', response.error)
                throw new Error(response.error.message)
            }

            const responseData = response.data as Record<string, unknown>
            const receivedTask = responseData?.task || responseData
            return receivedTask ? transformTaskDates(receivedTask as Record<string, unknown>) : null
        } catch (error) {
            console.error('Failed to update task:', error)
            throw error
        }
    },

    // Delete task
    async deleteTask(taskId: number): Promise<boolean> {
        try {
            const response = await baseApi.http<Record<string, unknown>>(
                'DELETE',
                `/api/tasks/${taskId}`,
            )

            if (response.error) {
                console.error('Error deleting task:', response.error)
                throw new Error(response.error.message)
            }

            return true
        } catch (error) {
            console.error('Failed to delete task:', error)
            throw error
        }
    },

    // Update task status
    async updateTaskStatus(taskId: number, status: Task['status']): Promise<Task | null> {
        try {
            const response = await baseApi.http<Record<string, unknown>>(
                'PUT',
                `/api/tasks/${taskId}/status`,
                { status },
            )

            if (response.error) {
                console.error('Error updating task status:', response.error)
                throw new Error(response.error.message)
            }

            const responseData = response.data as Record<string, unknown>
            const receivedTask = responseData?.task || responseData
            return receivedTask ? transformTaskDates(receivedTask as Record<string, unknown>) : null
        } catch (error) {
            console.error('Failed to update task status:', error)
            throw error
        }
    },

    // Update task progress
    async updateTaskProgress(taskId: number, progress: number): Promise<Task | null> {
        try {
            const response = await baseApi.http<Record<string, unknown>>(
                'PUT',
                `/api/tasks/${taskId}/progress`,
                { progress },
            )

            if (response.error) {
                console.error('Error updating task progress:', response.error)
                throw new Error(response.error.message)
            }

            const responseData = response.data as Record<string, unknown>
            const receivedTask = responseData?.task || responseData
            return receivedTask ? transformTaskDates(receivedTask as Record<string, unknown>) : null
        } catch (error) {
            console.error('Failed to update task progress:', error)
            throw error
        }
    },

    // Get tasks by project
    async getTasksByProject(projectId: number): Promise<Task[]> {
        try {
            const response = await baseApi.http<TasksResponse>('GET', `/api/tasks/project/${projectId}`)

            if (response.error || !response.data) {
                console.error('Error loading tasks by project:', response.error)
                return []
            }

            if (response.data?.tasks) {
                return response.data.tasks.map((t: unknown) =>
                    transformTaskDates(t as Record<string, unknown>),
                )
            }

            if (Array.isArray(response.data)) {
                return response.data.map((t: unknown) =>
                    transformTaskDates(t as Record<string, unknown>),
                )
            }

            return []
        } catch (error) {
            console.error('Failed to load tasks by project:', error)
            return []
        }
    },

    // Get subtasks
    async getSubTasks(parentTaskId: number): Promise<Task[]> {
        try {
            const response = await baseApi.http<TasksResponse>(
                'GET',
                `/api/tasks/${parentTaskId}/subtasks`,
            )

            if (response.error || !response.data) {
                console.error('Error loading subtasks:', response.error)
                return []
            }

            if (response.data?.tasks) {
                return response.data.tasks.map((t: unknown) =>
                    transformTaskDates(t as Record<string, unknown>),
                )
            }

            if (Array.isArray(response.data)) {
                return response.data.map((t: unknown) =>
                    transformTaskDates(t as Record<string, unknown>),
                )
            }

            return []
        } catch (error) {
            console.error('Failed to load subtasks:', error)
            return []
        }
    },
}
