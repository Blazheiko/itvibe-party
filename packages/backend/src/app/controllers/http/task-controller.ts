import type { HttpContext } from '#vendor/types/types.js';
import { getTypedPayload } from '#vendor/utils/validation/get-typed-payload.js';
import { taskService } from '#app/services/task-service.js';
import type {
    GetTasksResponse,
    CreateTaskResponse,
    GetTaskResponse,
    UpdateTaskResponse,
    DeleteTaskResponse,
    UpdateTaskStatusResponse,
    UpdateTaskProgressResponse,
    GetTasksByProjectResponse,
    GetSubTasksResponse,
    TestTasksResponse,
} from 'shared';
import type {
    CreateTaskInput,
    UpdateTaskInput,
    UpdateTaskProgressInput,
    UpdateTaskStatusInput,
} from 'shared/schemas';

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
    async testTasks(_context: HttpContext): Promise<TestTasksResponse> {
        const result = await taskService.testTasks();
        if (!result.ok) {
            return { status: 'error' };
        }
        return { status: 'ok', tasks: result.data.tasks };
    },

    async getTasks(context: HttpContext): Promise<GetTasksResponse> {
        context.logger.info('getTasks handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const result = await taskService.getTasks(userId);
        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return {
            status: 'success',
            tasks: result.data.tasks as any,
            projects: result.data.projects as any,
        };
    },

    async createTask(
        context: HttpContext<CreateTaskInput>,
    ): Promise<CreateTaskResponse> {
        context.logger.info('createTask handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const payload = getTypedPayload(context);
        const result = await taskService.createTask({ ...payload, userId });

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', task: result.data.task as any };
    },

    async getTask(context: HttpContext): Promise<GetTaskResponse> {
        context.logger.info('getTask handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { taskId } = context.httpData.params as { taskId: string };
        const result = await taskService.getTask(BigInt(taskId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', task: result.data.task as any };
    },

    async updateTask(
        context: HttpContext<UpdateTaskInput>,
    ): Promise<UpdateTaskResponse> {
        context.logger.info('updateTask handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { taskId } = context.httpData.params as { taskId: string };
        const payload = getTypedPayload(context);
        const result = await taskService.updateTask({
            ...payload,
            userId,
            taskId: BigInt(taskId),
        });

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', task: result.data.task as any };
    },

    async deleteTask(context: HttpContext): Promise<DeleteTaskResponse> {
        context.logger.info('deleteTask handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { taskId } = context.httpData.params as { taskId: string };
        const result = await taskService.deleteTask(BigInt(taskId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', message: result.data.message };
    },

    async updateTaskStatus(
        context: HttpContext<UpdateTaskStatusInput>,
    ): Promise<UpdateTaskStatusResponse> {
        context.logger.info('updateTaskStatus handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { taskId } = context.httpData.params as { taskId: string };
        const { status } = getTypedPayload(context);
        const result = await taskService.updateTaskStatus({
            userId,
            taskId: BigInt(taskId),
            status,
        });

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', task: result.data.task as any };
    },

    async updateTaskProgress(
        context: HttpContext<UpdateTaskProgressInput>,
    ): Promise<UpdateTaskProgressResponse> {
        context.logger.info('updateTaskProgress handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { taskId } = context.httpData.params as { taskId: string };
        const payload = getTypedPayload(context);
        const result = await taskService.updateTaskProgress({
            ...payload,
            userId,
            taskId: BigInt(taskId),
        });

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', task: result.data.task as any };
    },

    async getTasksByProject(
        context: HttpContext,
    ): Promise<GetTasksByProjectResponse> {
        context.logger.info('getTasksByProject handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { projectId } = context.httpData.params as { projectId: string };
        const result = await taskService.getTasksByProject(BigInt(projectId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', tasks: result.data.tasks as any };
    },

    async getSubTasks(context: HttpContext): Promise<GetSubTasksResponse> {
        context.logger.info('getSubTasks handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { parentTaskId } = context.httpData.params as { parentTaskId: string };
        const result = await taskService.getSubTasks(BigInt(parentTaskId), userId);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', tasks: result.data.tasks as any };
    },
};
