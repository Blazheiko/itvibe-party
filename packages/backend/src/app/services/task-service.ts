import type {
    CreateTaskInput,
    UpdateTaskInput,
    UpdateTaskProgressInput,
    UpdateTaskStatusInput,
} from 'shared/schemas';
import { projectRepository, taskRepository } from '#app/repositories/index.js';
import { taskTransformer } from '#app/transformers/index.js';
import { failure, success, type ServiceResult } from '#app/services/shared/service-result.js';
import type {
    TaskInsert,
    TaskStatus,
    TaskUpdate,
} from '#app/repositories/task-repository.js';

type TaskStatusPayload = UpdateTaskStatusInput['status'];

interface CreateTaskPayload extends CreateTaskInput {
    userId: bigint;
}

interface UpdateTaskPayload extends UpdateTaskInput {
    userId: bigint;
    taskId: bigint;
}

interface UpdateTaskStatusPayload {
    userId: bigint;
    taskId: bigint;
    status: TaskStatusPayload;
}

interface UpdateTaskProgressPayload extends UpdateTaskProgressInput {
    userId: bigint;
    taskId: bigint;
}

const allowedStatuses: TaskStatus[] = [
    'TODO',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
];

type TaskPriority = TaskInsert['priority'];

function isTaskStatus(value: string): value is TaskStatus {
    return allowedStatuses.includes(value as TaskStatus);
}

function parseTaskPriority(value: string | undefined): TaskPriority | undefined {
    if (
        value === 'LOW' ||
        value === 'MEDIUM' ||
        value === 'HIGH' ||
        value === 'URGENT'
    ) {
        return value;
    }
    return undefined;
}

export const taskService = {
    async testTasks(): Promise<
        ServiceResult<{ tasks: ReturnType<typeof taskTransformer.serializeArray> }>
    > {
        const tasks = await taskRepository.findAll();
        return success({ tasks: taskTransformer.serializeArray(tasks) });
    },

    async getTasks(
        userId: bigint,
    ): Promise<
        ServiceResult<{
            tasks: ReturnType<typeof taskTransformer.serializeArray>;
            projects: Awaited<ReturnType<typeof projectRepository.findShortByUserId>>;
        }>
    > {
        const [tasks, projects] = await Promise.all([
            taskRepository.findByUserId(userId),
            projectRepository.findShortByUserId(userId),
        ]);

        return success({
            tasks: taskTransformer.serializeArray(tasks),
            projects,
        });
    },

    async createTask(payload: CreateTaskPayload): Promise<ServiceResult<{ task: ReturnType<typeof taskTransformer.serialize> }>> {
        const createData: TaskInsert = {
            title: payload.title,
            description: payload.description ?? null,
            userId: payload.userId,
            projectId: payload.projectId !== undefined ? BigInt(payload.projectId) : null,
            status: isTaskStatus(payload.status ?? '')
                ? (payload.status as TaskStatus)
                : undefined,
            priority: parseTaskPriority(payload.priority),
            tags: payload.tags !== undefined ? JSON.stringify(payload.tags) : null,
            dueDate: payload.dueDate !== undefined ? new Date(payload.dueDate) : null,
            startDate: payload.startDate !== undefined ? new Date(payload.startDate) : null,
            estimatedHours: payload.estimatedHours,
            parentTaskId:
                payload.parentTaskId !== undefined ? BigInt(payload.parentTaskId) : null,
        };

        const created = await taskRepository.create(createData);

        const withRelations = await taskRepository.findByIdAndUserId(created.id, payload.userId);
        if (withRelations === undefined) {
            return failure('INTERNAL', 'Failed to create task');
        }

        return success({ task: taskTransformer.serialize(withRelations) });
    },

    async getTask(taskId: bigint, userId: bigint) {
        const task = await taskRepository.findByIdAndUserId(taskId, userId);
        if (task === undefined) {
            return failure('NOT_FOUND', 'Task not found');
        }

        return success({ task: taskTransformer.serialize(task) });
    },

    async updateTask(payload: UpdateTaskPayload): Promise<ServiceResult<{ task: ReturnType<typeof taskTransformer.serialize> }>> {
        const updateData: TaskUpdate = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.projectId !== undefined) updateData.projectId = BigInt(payload.projectId);
        if (payload.status !== undefined && isTaskStatus(payload.status)) {
            updateData.status = payload.status;
        }
        const priority = parseTaskPriority(payload.priority);
        if (priority !== undefined) updateData.priority = priority;
        if (payload.progress !== undefined) updateData.progress = payload.progress;
        if (payload.tags !== undefined) updateData.tags = JSON.stringify(payload.tags);
        if (payload.dueDate !== undefined) updateData.dueDate = new Date(payload.dueDate);
        if (payload.startDate !== undefined) updateData.startDate = new Date(payload.startDate);
        if (payload.estimatedHours !== undefined) {
            updateData.estimatedHours = payload.estimatedHours;
        }
        if (payload.actualHours !== undefined) updateData.actualHours = payload.actualHours;

        await taskRepository.update(payload.taskId, payload.userId, updateData);

        const task = await taskRepository.findByIdAndUserId(payload.taskId, payload.userId);
        if (task === undefined) {
            return failure('NOT_FOUND', 'Task not found');
        }

        return success({ task: taskTransformer.serialize(task) });
    },

    async deleteTask(taskId: bigint, userId: bigint) {
        const deleted = await taskRepository.delete(taskId, userId);
        if (!deleted) {
            return failure('NOT_FOUND', 'Task not found');
        }

        return success({ message: 'Task deleted successfully' });
    },

    async updateTaskStatus(payload: UpdateTaskStatusPayload): Promise<ServiceResult<{ task: ReturnType<typeof taskTransformer.serialize> }>> {
        if (!isTaskStatus(payload.status)) {
            return failure('BAD_REQUEST', 'Invalid task status');
        }

        await taskRepository.updateStatus(payload.taskId, payload.userId, payload.status);

        const task = await taskRepository.findByIdAndUserId(payload.taskId, payload.userId);
        if (task === undefined) {
            return failure('NOT_FOUND', 'Task not found');
        }

        return success({ task: taskTransformer.serialize(task) });
    },

    async updateTaskProgress(payload: UpdateTaskProgressPayload): Promise<ServiceResult<{ task: ReturnType<typeof taskTransformer.serialize> }>> {
        const progress = Number.parseInt(payload.progress, 10);
        if (Number.isNaN(progress) || progress < 0 || progress > 100) {
            return failure('BAD_REQUEST', 'Progress must be a number between 0 and 100');
        }

        await taskRepository.updateProgress(payload.taskId, payload.userId, progress);

        const task = await taskRepository.findByIdAndUserId(payload.taskId, payload.userId);
        if (task === undefined) {
            return failure('NOT_FOUND', 'Task not found');
        }

        return success({ task: taskTransformer.serialize(task) });
    },

    async getTasksByProject(
        projectId: bigint,
        userId: bigint,
    ): Promise<ServiceResult<{ tasks: ReturnType<typeof taskTransformer.serializeArray> }>> {
        const tasks = await taskRepository.findByProjectId(projectId, userId);
        return success({ tasks: taskTransformer.serializeArray(tasks) });
    },

    async getSubTasks(
        parentTaskId: bigint,
        userId: bigint,
    ): Promise<ServiceResult<{ tasks: ReturnType<typeof taskTransformer.serializeSubTask>[] }>> {
        const subTasks = await taskRepository.findSubTasks(parentTaskId, userId);
        return success({ tasks: subTasks.map(taskTransformer.serializeSubTask) });
    },
};
