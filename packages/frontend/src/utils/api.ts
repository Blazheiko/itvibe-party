import baseApi from './base-api'

interface ApiResponse<T> {
  data: T | null
  error: { message: string; code: number } | null
}

// ============================================================================
// Task & Project interfaces and helpers
// ============================================================================

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

export interface Project {
  id: string
  title: string
  description: string | null
  userId: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high'
  progress: number
  dueDate: Date | null
  tags: string[] | null
  createdAt: Date
  updatedAt: Date
  color: string | null
  endDate: Date | null
  isActive: boolean
  startDate: Date | null
  tasks?: unknown[]
}

export interface CreateProjectRequest {
  title: string
  description?: string
  userId: string
  status: Project['status']
  priority: Project['priority']
  progress: number
  dueDate?: string | null
  tags?: string[] | null
  color?: string | null
  endDate?: string | null
  isActive: boolean
  startDate?: string | null
  [key: string]: unknown
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id?: never
}

export interface ProjectsResponse {
  projects: Project[]
}

const transformTaskDates = (task: Record<string, unknown>): Task => {
  const transformedTask = { ...task } as Record<string, unknown>

  const dateFields = ['dueDate', 'startDate', 'createdAt', 'updatedAt']
  dateFields.forEach((field) => {
    if (transformedTask[field] && typeof transformedTask[field] === 'string') {
      transformedTask[field] = new Date(transformedTask[field] as string)
    }
  })

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

  if (transformedTask.id) {
    transformedTask.id = String(transformedTask.id)
  }

  return transformedTask as unknown as Task
}

const transformProjectDates = (project: Record<string, unknown>): Project => {
  return {
    id: String(project.id || ''),
    title: String(project.title || ''),
    description: project.description ? String(project.description) : null,
    userId: String(project.userId || project.user_id || ''),
    status: (project.status as Project['status']) || 'planning',
    priority: (project.priority as Project['priority']) || 'medium',
    progress: Number(project.progress || 0),
    createdAt: project.createdAt ? new Date(String(project.createdAt)) : new Date(),
    updatedAt: project.updatedAt ? new Date(String(project.updatedAt)) : new Date(),
    dueDate: project.dueDate ? new Date(String(project.dueDate)) : null,
    endDate: project.endDate ? new Date(String(project.endDate)) : null,
    startDate: project.startDate ? new Date(String(project.startDate)) : null,
    tags: Array.isArray(project.tags) ? project.tags.map(String) : null,
    color: project.color ? String(project.color) : null,
    isActive: project.isActive !== undefined ? Boolean(project.isActive) : true,
    tasks: Array.isArray(project.tasks) ? project.tasks : [],
  }
}

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  login: async (body: {
    email: string
    password: string
    token?: string
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/auth/login', body)
  },

  register: async (body: {
    name: string
    email: string
    password: string
    token?: string
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/auth/register', body)
  },

  logout: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/auth/logout')
  },

  logoutAll: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/auth/logout-all')
  },
}

// ============================================================================
// Main API
// ============================================================================

export const mainApi = {
  init: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('GET', '/api/main/init')
  },

  updateWsToken: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('GET', '/api/main/update-ws-token')
  },

  saveUser: async (
    body: Record<string, unknown>,
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/main/save-user', body)
  },

  useInvitation: async (body: {
    token: string
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/main/invitations/use', body)
  },
}

// ============================================================================
// Chat API
// ============================================================================

export const chatApi = {
  getContactList: async (body: {
    userId: string | number | undefined
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/chat/get-contact-list', {
      userId: Number(body.userId),
    })
  },

  createChat: async (
    body: Record<string, unknown>,
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/chat/chats', body)
  },

  deleteChat: async (chatId: number): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('DELETE', `/api/chat/chats/${chatId}`)
  },

  createInvitation: async (body: {
    name: string
    userId: string | number | undefined
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/chat/invitations', {
      name: body.name,
      userId: Number(body.userId),
    })
  },

  getUserInvitations: async (
    userId: number,
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('GET', `/api/chat/invitations/user/${userId}`)
  },
}

// ============================================================================
// Messages API
// ============================================================================

interface UpdateMessageResponse {
  status: string
  message?: {
    id: number
    sender_id: number
    receiver_id: number
    type: string
    content: string
    src: string
    is_read: boolean
    created_at: string
    updated_at: string
  }
}

export const messagesApi = {
  getMessages: async <T = Record<string, unknown>>(body: {
    contactId: string | number
    userId: string | number | undefined
  }): Promise<ApiResponse<T>> => {
    return baseApi.http<T>('POST', '/api/chat/get-messages', {
      userId: Number(body.userId),
      contactId: Number(body.contactId),
    })
  },

  sendMessage: async (body: {
    contactId: string | number
    content: string
    userId: string | number | undefined
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/chat/send-chat-messages', {
      userId: Number(body.userId),
      contactId: Number(body.contactId),
      content: body.content,
    })
  },

  deleteMessage: async (
    messageId: number,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return baseApi.http<{ success: boolean }>(
      'DELETE',
      `/api/chat/messages/${messageId}`,
    )
  },

  updateMessage: async (
    messageId: number,
    content: string,
    userId: number,
  ): Promise<ApiResponse<UpdateMessageResponse>> => {
    return baseApi.http<UpdateMessageResponse>(
      'PUT',
      `/api/chat/messages/${messageId}`,
      {
        userId,
        messageId,
        content,
      },
    )
  },

  markAsRead: async (
    messageId: number,
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('PUT', `/api/chat/messages/${messageId}/read`, {
      messageId,
    })
  },
}

// ============================================================================
// Tasks API
// ============================================================================

export const tasksApi = {
  async getTasks(): Promise<{ tasks: Task[]; projects: Project[] }> {
    try {
      const response = await baseApi.http<TasksResponse>('GET', '/api/tasks')
      console.log('Tasks API response:', response)

      if (response.error || !response.data) {
        console.error('Error loading tasks:', response.error)
        return { tasks: [], projects: [] }
      }

      return response.data as { tasks: Task[]; projects: Project[] }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      return { tasks: [], projects: [] }
    }
  },

  async getTask(taskId: number): Promise<Task | null> {
    try {
      const response = await baseApi.http<Record<string, unknown>>(
        'GET',
        `/api/tasks/${taskId}`,
      )

      if (response.error || !response.data) {
        console.error('Error loading task:', response.error)
        return null
      }

      const responseData = response.data as Record<string, unknown>
      const receivedTask = responseData?.task || responseData
      return receivedTask
        ? transformTaskDates(receivedTask as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to load task:', error)
      return null
    }
  },

  async createTask(taskData: CreateTaskRequest): Promise<Task | null> {
    try {
      // Only send fields accepted by CreateTaskInputSchema ("+": "reject")
      const payload: Record<string, unknown> = {
        title: taskData.title,
      }
      if (taskData.description !== undefined) payload.description = taskData.description
      if (taskData.projectId != null) payload.projectId = Number(taskData.projectId)
      if (taskData.status !== undefined) payload.status = taskData.status
      if (taskData.priority !== undefined) payload.priority = taskData.priority
      if (taskData.tags != null) {
        payload.tags = Array.isArray(taskData.tags) ? taskData.tags : [taskData.tags]
      }
      if (taskData.dueDate != null) payload.dueDate = taskData.dueDate
      if (taskData.startDate != null) payload.startDate = taskData.startDate
      if (taskData.estimatedHours != null) payload.estimatedHours = Number(taskData.estimatedHours)
      if (taskData.parentTaskId != null) payload.parentTaskId = Number(taskData.parentTaskId)

      const response = await baseApi.http<Record<string, unknown>>(
        'POST',
        '/api/tasks',
        payload,
      )

      if (response.error) {
        console.error('Error creating task:', response.error)
        throw new Error(response.error.message)
      }

      console.log('Raw task data from server:', response.data)

      const responseData = response.data as Record<string, unknown>
      const receivedTask = responseData?.task || responseData
      return receivedTask
        ? transformTaskDates(receivedTask as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    }
  },

  async updateTask(
    taskId: number,
    taskData: UpdateTaskRequest,
  ): Promise<Task | null> {
    try {
      // Only send fields accepted by UpdateTaskInputSchema ("+": "reject")
      const payload: Record<string, unknown> = {}
      if (taskData.title !== undefined) payload.title = taskData.title
      if (taskData.description !== undefined) payload.description = taskData.description
      if (taskData.projectId !== undefined) {
        payload.projectId = taskData.projectId != null ? Number(taskData.projectId) : undefined
      }
      if (taskData.status !== undefined) payload.status = taskData.status
      if (taskData.priority !== undefined) payload.priority = taskData.priority
      if (taskData.progress !== undefined) payload.progress = Number(taskData.progress)
      if (taskData.tags !== undefined) {
        payload.tags = taskData.tags != null
          ? (Array.isArray(taskData.tags) ? taskData.tags : [taskData.tags])
          : undefined
      }
      if (taskData.dueDate !== undefined) payload.dueDate = taskData.dueDate
      if (taskData.startDate !== undefined) payload.startDate = taskData.startDate
      if (taskData.estimatedHours !== undefined) {
        payload.estimatedHours = taskData.estimatedHours != null ? Number(taskData.estimatedHours) : undefined
      }
      if (taskData.actualHours !== undefined) {
        payload.actualHours = taskData.actualHours != null ? Number(taskData.actualHours) : undefined
      }

      const response = await baseApi.http<Record<string, unknown>>(
        'PUT',
        `/api/tasks/${taskId}`,
        payload,
      )

      if (response.error) {
        console.error('Error updating task:', response.error)
        throw new Error(response.error.message)
      }

      const responseData = response.data as Record<string, unknown>
      const receivedTask = responseData?.task || responseData
      return receivedTask
        ? transformTaskDates(receivedTask as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  },

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

  async updateTaskStatus(
    taskId: number,
    status: Task['status'],
  ): Promise<Task | null> {
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
      return receivedTask
        ? transformTaskDates(receivedTask as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to update task status:', error)
      throw error
    }
  },

  async updateTaskProgress(
    taskId: number,
    progress: number,
  ): Promise<Task | null> {
    try {
      const response = await baseApi.http<Record<string, unknown>>(
        'PUT',
        `/api/tasks/${taskId}/progress`,
        { progress: String(progress) },
      )

      if (response.error) {
        console.error('Error updating task progress:', response.error)
        throw new Error(response.error.message)
      }

      const responseData = response.data as Record<string, unknown>
      const receivedTask = responseData?.task || responseData
      return receivedTask
        ? transformTaskDates(receivedTask as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to update task progress:', error)
      throw error
    }
  },

  async getTasksByProject(projectId: number): Promise<Task[]> {
    try {
      const response = await baseApi.http<TasksResponse>(
        'GET',
        `/api/tasks/project/${projectId}`,
      )

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

// ============================================================================
// Projects API
// ============================================================================

export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    try {
      const response = await baseApi.http<ProjectsResponse>(
        'GET',
        '/api/projects',
      )
      console.log(response)

      if (response.error || !response.data) {
        console.error('Error loading projects:', response.error)
        return []
      }

      if (response.data?.projects) {
        console.log('Raw projects from server:', response.data.projects)
        return response.data.projects.map((p: unknown) =>
          transformProjectDates(p as Record<string, unknown>),
        )
      }

      if (Array.isArray(response.data)) {
        console.log('Direct array of projects from server:', response.data)
        return response.data.map((p: unknown) =>
          transformProjectDates(p as Record<string, unknown>),
        )
      }

      console.log('No projects found in response:', response.data)
      return []
    } catch (error) {
      console.error('Failed to load projects:', error)
      return []
    }
  },

  async getProject(projectId: number): Promise<Project | null> {
    try {
      const response = await baseApi.http<Record<string, unknown>>(
        'GET',
        `/api/projects/${projectId}`,
      )

      if (response.error) {
        console.error('Error loading project:', response.error)
        return null
      }

      const responseData = response.data as Record<string, unknown>
      const foundProject = responseData?.project || responseData
      return foundProject
        ? transformProjectDates(foundProject as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to load project:', error)
      return null
    }
  },

  async createProject(
    projectData: CreateProjectRequest,
  ): Promise<Project | null> {
    try {
      // Only send fields accepted by CreateProjectInputSchema ("+": "reject")
      const payload: Record<string, unknown> = {
        title: projectData.title,
      }
      if (projectData.description !== undefined) payload.description = projectData.description
      if (projectData.color != null) payload.color = projectData.color
      if (projectData.startDate != null) payload.startDate = projectData.startDate
      if (projectData.endDate != null) payload.endDate = projectData.endDate
      if (projectData.dueDate != null) payload.dueDate = projectData.dueDate

      const response = await baseApi.http<Record<string, unknown>>(
        'POST',
        '/api/projects/create',
        payload,
      )

      if (response.error) {
        console.error('Error creating project:', response.error)
        throw new Error(response.error.message)
      }

      console.log('Raw project data from server:', response.data)

      const responseData = response.data as Record<string, unknown>
      const receivedProject = responseData?.project || responseData
      return receivedProject
        ? transformProjectDates(receivedProject as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  },

  async updateProject(
    projectId: number,
    projectData: UpdateProjectRequest,
  ): Promise<Project | null> {
    try {
      // Only send fields accepted by UpdateProjectInputSchema ("+": "reject")
      const payload: Record<string, unknown> = {}
      if (projectData.title !== undefined) payload.title = projectData.title
      if (projectData.description !== undefined) payload.description = projectData.description
      if (projectData.color !== undefined) payload.color = projectData.color
      if (projectData.startDate !== undefined) payload.startDate = projectData.startDate
      if (projectData.endDate !== undefined) payload.endDate = projectData.endDate
      if (projectData.dueDate !== undefined) payload.dueDate = projectData.dueDate
      if (projectData.isActive !== undefined) payload.isActive = projectData.isActive
      if (projectData.progress !== undefined) payload.progress = Number(projectData.progress)

      const response = await baseApi.http<Record<string, unknown>>(
        'PUT',
        `/api/projects/${projectId}`,
        payload,
      )

      if (response.error) {
        console.error('Error updating project:', response.error)
        throw new Error(response.error.message)
      }

      const responseData = response.data as Record<string, unknown>
      const updatedProject = responseData?.project || responseData
      return updatedProject
        ? transformProjectDates(updatedProject as Record<string, unknown>)
        : null
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  },

  async deleteProject(projectId: number): Promise<boolean> {
    try {
      const response = await baseApi.http(
        'DELETE',
        `/api/projects/${projectId}`,
      )

      if (response.error) {
        console.error('Error deleting project:', response.error)
        throw new Error(response.error.message)
      }

      return true
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  },
}

// ============================================================================
// Push Subscription API
// ============================================================================

interface PushSubscriptionData extends Record<string, unknown> {
  endpoint: string
  p256dhKey: string
  authKey: string
  userAgent?: string
  ipAddress?: string
  deviceType?: string
  browserName?: string
  browserVersion?: string
  osName?: string
  osVersion?: string
  notificationTypes?: string[]
  timezone?: string
}

interface PushSubscriptionResponse {
  id: number
  user_id: number
  endpoint: string
  p256dh_key: string
  auth_key: string
  user_agent?: string
  device_type?: string
  browser_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PushSubscriptionStatistics {
  total_sent: number
  total_delivered: number
  last_sent_at?: string
  subscription_duration: number
}

export const pushSubscriptionApi = {
  getSubscriptions: async (): Promise<
    ApiResponse<PushSubscriptionResponse[]>
  > => {
    return baseApi.http<PushSubscriptionResponse[]>(
      'GET',
      '/api/push-subscriptions',
    )
  },

  createSubscription: async (
    subscriptionData: PushSubscriptionData,
  ): Promise<ApiResponse<PushSubscriptionResponse>> => {
    return baseApi.http<PushSubscriptionResponse>(
      'POST',
      '/api/push-subscriptions',
      subscriptionData,
    )
  },

  getSubscription: async (
    subscriptionId: number,
  ): Promise<ApiResponse<PushSubscriptionResponse>> => {
    return baseApi.http<PushSubscriptionResponse>(
      'GET',
      `/api/push-subscriptions/${subscriptionId}`,
    )
  },

  deleteSubscription: async (
    subscriptionId: number,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return baseApi.http<{ success: boolean }>(
      'DELETE',
      `/api/push-subscriptions/${subscriptionId}`,
    )
  },

  deleteSubscriptionByEndpoint: async (
    endpoint: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return baseApi.http<{ success: boolean }>(
      'DELETE',
      '/api/push-subscriptions',
      { endpoint },
    )
  },

  getSubscriptionStatistics: async (
    subscriptionId: number,
  ): Promise<ApiResponse<PushSubscriptionStatistics>> => {
    return baseApi.http<PushSubscriptionStatistics>(
      'GET',
      `/api/push-subscriptions/${subscriptionId}/statistics`,
    )
  },

  deactivateSubscription: async (
    subscriptionId: number,
  ): Promise<ApiResponse<PushSubscriptionResponse>> => {
    return baseApi.http<PushSubscriptionResponse>(
      'PUT',
      `/api/push-subscriptions/${subscriptionId}/deactivate`,
      {},
    )
  },

  sendSubscriptionNotification: async (
    notificationData: Record<string, unknown>,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return baseApi.http<{ success: boolean; message: string }>(
      'POST',
      '/api/notifications/subscription-status',
      notificationData,
    )
  },

  sendSystemNotification: async (
    message: string,
    type: string = 'info',
    metadata?: Record<string, unknown>,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return baseApi.http<{ success: boolean }>(
      'POST',
      '/api/notifications/system',
      {
        message,
        type,
        metadata,
      },
    )
  },

  getVapidPublicKey: async (): Promise<
    ApiResponse<{ vapidPublicKey: string }>
  > => {
    return baseApi.http<{ vapidPublicKey: string }>(
      'GET',
      '/api/push-subscriptions/vapid-public-key',
    )
  },
}

// ============================================================================
// Notes API
// ============================================================================

export const notesApi = {
  getNotes: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('GET', '/api/notes')
  },

  createNote: async (body: {
    title: string
    description: string
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    return baseApi.http('POST', '/api/notes', body)
  },

  addPhoto: async (
    noteId: string | number,
    file: File,
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const formData = new FormData()
    formData.append('photo', file)
    return baseApi.upload('POST', `/api/notes/${noteId}/photos`, formData)
  },
}
