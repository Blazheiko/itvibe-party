import type { CreateProjectInput, UpdateProjectInput } from 'shared/schemas';
import { projectRepository } from '#app/repositories/index.js';
import { projectTransformer, taskTransformer } from '#app/transformers/index.js';
import { failure, success, type ServiceResult } from '#app/services/shared/service-result.js';

interface CreateProjectPayload extends CreateProjectInput {
    userId: bigint;
}

interface UpdateProjectPayload extends UpdateProjectInput {
    userId: bigint;
    projectId: bigint;
}

interface ProjectStatistics {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    onHoldTasks: number;
    cancelledTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageProgress: number;
    totalEstimatedHours: number;
    totalActualHours: number;
    timeVariance: number;
}

function calculateProjectStatistics(
    tasks: { isCompleted: boolean; status: string; dueDate: Date | null; progress: number; estimatedHours: unknown; actualHours: unknown }[],
): ProjectStatistics {
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.isCompleted).length;
    const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter((task) => task.status === 'TODO').length;
    const onHoldTasks = tasks.filter((task) => task.status === 'ON_HOLD').length;
    const cancelledTasks = tasks.filter((task) => task.status === 'CANCELLED').length;

    const totalEstimatedHours = tasks.reduce(
        (sum, task) => sum + (typeof task.estimatedHours === 'number' ? task.estimatedHours : 0),
        0,
    );
    const totalActualHours = tasks.reduce(
        (sum, task) => sum + (typeof task.actualHours === 'number' ? task.actualHours : 0),
        0,
    );

    const averageProgress =
        totalTasks > 0
            ? tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks
            : 0;

    const overdueTasks = tasks.filter(
        (task) => task.dueDate !== null && task.dueDate < now && !task.isCompleted,
    ).length;

    return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        onHoldTasks,
        cancelledTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        averageProgress: Math.round(averageProgress),
        totalEstimatedHours,
        totalActualHours,
        timeVariance:
            totalEstimatedHours > 0
                ? ((totalActualHours - totalEstimatedHours) / totalEstimatedHours) * 100
                : 0,
    };
}

export const projectService = {
    async getProjects(
        userId: bigint,
    ): Promise<ServiceResult<{ projects: ReturnType<typeof projectTransformer.serializeArray> }>> {
        const projects = await projectRepository.findByUserId(userId);
        return success({ projects: projectTransformer.serializeArray(projects) });
    },

    async createProject(
        payload: CreateProjectPayload,
    ): Promise<ServiceResult<{ project: ReturnType<typeof projectTransformer.serialize> }>> {
        const createdProject = await projectRepository.create({
            title: payload.title,
            description: payload.description ?? null,
            color: payload.color ?? null,
            userId: payload.userId,
            startDate: payload.startDate !== undefined ? new Date(payload.startDate) : null,
            endDate: payload.endDate !== undefined ? new Date(payload.endDate) : null,
            dueDate: payload.dueDate !== undefined ? new Date(payload.dueDate) : null,
        });

        const withTasks = await projectRepository.findByIdAndUserId(createdProject.id, payload.userId);
        if (withTasks === undefined) {
            return failure('INTERNAL', 'Failed to create project');
        }

        return success({ project: projectTransformer.serialize(withTasks) });
    },

    async getProject(
        projectId: bigint,
        userId: bigint,
    ): Promise<ServiceResult<{ project: ReturnType<typeof projectTransformer.serialize> }>> {
        const project = await projectRepository.findByIdAndUserId(projectId, userId);
        if (project === undefined) {
            return failure('NOT_FOUND', 'Project not found');
        }

        return success({ project: projectTransformer.serialize(project) });
    },

    async updateProject(
        payload: UpdateProjectPayload,
    ): Promise<ServiceResult<{ project: ReturnType<typeof projectTransformer.serialize> }>> {
        const updateData = {
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.description !== undefined
                ? { description: payload.description }
                : {}),
            ...(payload.color !== undefined ? { color: payload.color } : {}),
            ...(payload.startDate !== undefined
                ? { startDate: new Date(payload.startDate) }
                : {}),
            ...(payload.endDate !== undefined ? { endDate: new Date(payload.endDate) } : {}),
            ...(payload.dueDate !== undefined ? { dueDate: new Date(payload.dueDate) } : {}),
            ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
            ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
        };

        const project = await projectRepository.update(
            payload.projectId,
            payload.userId,
            updateData,
        );

        if (project === undefined) {
            return failure('NOT_FOUND', 'Project not found');
        }

        return success({ project: projectTransformer.serialize(project) });
    },

    async deleteProject(
        projectId: bigint,
        userId: bigint,
    ): Promise<ServiceResult<{ message: string }>> {
        const deleted = await projectRepository.delete(projectId, userId);
        if (!deleted) {
            return failure('NOT_FOUND', 'Project not found');
        }

        return success({ message: 'Project deleted successfully' });
    },

    async getProjectTasks(
        projectId: bigint,
        userId: bigint,
    ): Promise<ServiceResult<{ tasks: ReturnType<typeof taskTransformer.serializeSubTask>[] }>> {
        const tasks = await projectRepository.getProjectTasks(projectId, userId);
        if (tasks === undefined) {
            return failure('NOT_FOUND', 'Project not found');
        }

        return success({ tasks: tasks.map(taskTransformer.serializeSubTask) });
    },

    async getProjectStatistics(
        projectId: bigint,
        userId: bigint,
    ): Promise<
        ServiceResult<{
            project: ReturnType<typeof projectTransformer.serialize>;
            statistics: ProjectStatistics;
        }>
    > {
        const project = await projectRepository.findByIdAndUserId(projectId, userId);
        if (project === undefined) {
            return failure('NOT_FOUND', 'Project not found');
        }

        const tasks = await projectRepository.getProjectTasks(projectId, userId);
        if (tasks === undefined) {
            return failure('NOT_FOUND', 'Project not found');
        }

        return success({
            project: projectTransformer.serialize(project),
            statistics: calculateProjectStatistics(tasks),
        });
    },

    async archiveProject(
        projectId: bigint,
        userId: bigint,
    ): Promise<ServiceResult<{ project: ReturnType<typeof projectTransformer.serialize> }>> {
        await projectRepository.archive(projectId, userId);

        const archived = await projectRepository.findByIdAndUserId(projectId, userId);
        if (archived === undefined) {
            return failure('NOT_FOUND', 'Project not found');
        }

        return success({ project: projectTransformer.serialize(archived) });
    },
};
