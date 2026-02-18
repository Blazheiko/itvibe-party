import type { HttpContext } from '#vendor/types/types.js';
import { getTypedPayload } from '#vendor/utils/validation/get-typed-payload.js';
import { projectService } from '#app/services/project-service.js';
import type {
    GetProjectsResponse,
    CreateProjectResponse,
    GetProjectResponse,
    UpdateProjectResponse,
    DeleteProjectResponse,
    GetProjectTasksResponse,
    GetProjectStatisticsResponse,
    ArchiveProjectResponse,
} from '../types/ProjectController.js';
import type { CreateProjectInput, UpdateProjectInput } from 'shared/schemas';

function setServiceErrorStatus(
    context: HttpContext,
    code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL',
): void {
    if (code === 'BAD_REQUEST') {
        context.responseData.status = 400;
        return;
    }
    if (code === 'UNAUTHORIZED') {
        context.responseData.status = 401;
        return;
    }
    if (code === 'NOT_FOUND') {
        context.responseData.status = 404;
        return;
    }
    if (code === 'CONFLICT') {
        context.responseData.status = 409;
        return;
    }
    context.responseData.status = 500;
}

function resolveUserId(context: HttpContext): bigint | null {
    if (!context.auth.check()) {
        context.responseData.status = 401;
        return null;
    }

    const userId = context.auth.getUserId();
    if (userId === null) {
        context.responseData.status = 401;
        return null;
    }

    return BigInt(userId);
}

export default {
    async getProjects(context: HttpContext): Promise<GetProjectsResponse> {
        context.logger.info('getProjects handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const result = await projectService.getProjects(userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', projects: result.data.projects as any };
    },

    async createProject(
        context: HttpContext<CreateProjectInput>,
    ): Promise<CreateProjectResponse> {
        context.logger.info('createProject handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const payload = getTypedPayload(context);
        const result = await projectService.createProject({ ...payload, userId });

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', project: result.data.project as any };
    },

    async getProject(context: HttpContext): Promise<GetProjectResponse> {
        context.logger.info('getProject handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { projectId } = context.httpData.params as { projectId: string };
        const result = await projectService.getProject(BigInt(projectId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', data: result.data.project as any };
    },

    async updateProject(
        context: HttpContext<UpdateProjectInput>,
    ): Promise<UpdateProjectResponse> {
        context.logger.info('updateProject handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { projectId } = context.httpData.params as { projectId: string };
        const payload = getTypedPayload(context);
        const result = await projectService.updateProject({
            ...payload,
            userId,
            projectId: BigInt(projectId),
        });

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', project: result.data.project as any };
    },

    async deleteProject(context: HttpContext): Promise<DeleteProjectResponse> {
        context.logger.info('deleteProject handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { projectId } = context.httpData.params as { projectId: string };
        const result = await projectService.deleteProject(BigInt(projectId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', message: result.data.message };
    },

    async getProjectTasks(
        context: HttpContext,
    ): Promise<GetProjectTasksResponse> {
        context.logger.info('getProjectTasks handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { projectId } = context.httpData.params as { projectId: string };
        const result = await projectService.getProjectTasks(BigInt(projectId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', data: result.data.tasks as any };
    },

    async getProjectStatistics(
        context: HttpContext,
    ): Promise<GetProjectStatisticsResponse> {
        context.logger.info('getProjectStatistics handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { projectId } = context.httpData.params as { projectId: string };
        const result = await projectService.getProjectStatistics(BigInt(projectId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return {
            status: 'success',
            data: {
                project: result.data.project,
                statistics: result.data.statistics,
            },
        };
    },

    async archiveProject(context: HttpContext): Promise<ArchiveProjectResponse> {
        context.logger.info('archiveProject handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { projectId } = context.httpData.params as { projectId: string };
        const result = await projectService.archiveProject(BigInt(projectId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', data: result.data.project as any };
    },
};
