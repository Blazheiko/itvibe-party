import baseApi from './base-api'

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
    id?: never // ID should not be in update request
}

export interface ProjectsResponse {
    projects: Project[]
}

// Transform dates from ISO strings to Date objects
const transformProjectDates = (project: Record<string, unknown>): Project => {
    console.log('Transforming project:', project)

    const transformedProject = {
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

    console.log('Transformed project:', transformedProject)
    return transformedProject
}

export const projectsApi = {
    // Get all projects
    async getProjects(): Promise<Project[]> {
        try {
            const response = await baseApi.http<ProjectsResponse>('GET', '/api/projects')
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

            // Check if response data is directly an array of projects
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

    // Get specific project
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

            // Check if response is wrapped in a projects object or is direct project data
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

    // Create new project
    async createProject(projectData: CreateProjectRequest): Promise<Project | null> {
        try {
            const response = await baseApi.http<Record<string, unknown>>(
                'POST',
                '/api/projects/create',
                projectData,
            )

            if (response.error) {
                console.error('Error creating project:', response.error)
                throw new Error(response.error.message)
            }

            console.log('Raw project data from server:', response.data)

            // Check if response is wrapped in a projects object or is direct project data
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

    // Update project
    async updateProject(
        projectId: number,
        projectData: UpdateProjectRequest,
    ): Promise<Project | null> {
        try {
            const response = await baseApi.http<Record<string, unknown>>(
                'PUT',
                `/api/projects/${projectId}`,
                projectData,
            )

            if (response.error) {
                console.error('Error updating project:', response.error)
                throw new Error(response.error.message)
            }

            // Check if response is wrapped in a projects object or is direct project data
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

    // Delete project
    async deleteProject(projectId: number): Promise<boolean> {
        try {
            const response = await baseApi.http('DELETE', `/api/projects/${projectId}`)

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
