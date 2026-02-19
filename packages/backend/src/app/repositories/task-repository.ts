import { db } from '#database/db.js';
import { projects, tasks } from '#database/schema.js';
import { and, desc, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type TaskRow = InferSelectModel<typeof tasks>;
export type TaskInsert = InferInsertModel<typeof tasks>;
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectRow = InferSelectModel<typeof projects>;

export type TaskUpdate = Partial<
    Pick<
        TaskInsert,
        | 'title'
        | 'description'
        | 'projectId'
        | 'status'
        | 'priority'
        | 'progress'
        | 'isCompleted'
        | 'tags'
        | 'dueDate'
        | 'startDate'
        | 'estimatedHours'
        | 'actualHours'
    >
>;

export type TaskWithRelations = TaskRow & {
    project: ProjectRow | null;
    subTasks: TaskRow[];
};

export interface ITaskRepository {
    findAll(): Promise<TaskWithRelations[]>;
    create(data: TaskInsert): Promise<TaskRow>;
    findById(id: bigint): Promise<TaskRow | undefined>;
    findByIdAndUserId(id: bigint, userId: bigint): Promise<TaskWithRelations | undefined>;
    findByUserId(userId: bigint): Promise<TaskWithRelations[]>;
    findByProjectId(projectId: bigint, userId: bigint): Promise<TaskWithRelations[]>;
    findSubTasks(parentTaskId: bigint, userId: bigint): Promise<TaskRow[]>;
    update(id: bigint, userId: bigint, data: TaskUpdate): Promise<TaskRow | undefined>;
    updateStatus(id: bigint, userId: bigint, status: TaskStatus): Promise<TaskRow | undefined>;
    updateProgress(id: bigint, userId: bigint, progress: number): Promise<TaskRow | undefined>;
    delete(id: bigint, userId: bigint): Promise<boolean>;
    orphanSubtasks(parentTaskId: bigint, userId: bigint): Promise<void>;
}

async function attachRelations(task: TaskRow): Promise<TaskWithRelations> {
    const [project, subTasks] = await Promise.all([
        task.projectId !== null
            ? db
                  .select()
                  .from(projects)
                  .where(eq(projects.id, task.projectId))
                  .limit(1)
                  .then((rows) => rows.at(0) ?? null)
            : Promise.resolve(null),
        db.select().from(tasks).where(eq(tasks.parentTaskId, task.id)),
    ]);
    return { ...task, project, subTasks };
}

export const taskRepository: ITaskRepository = {
    async findAll() {
        const tasksData = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
        return Promise.all(tasksData.map(attachRelations));
    },

    async create(data) {
        const now = new Date();
        const [result] = await db.insert(tasks).values({
            ...data,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
        });
        const created = await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, BigInt(result.insertId)))
            .limit(1)
            .then((rows) => rows.at(0));
        if (created === undefined) {
            throw new Error('Failed to create task');
        }
        return created;
    },

    async findById(id) {
        return await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, id))
            .limit(1)
            .then((rows) => rows.at(0));
    },

    async findByIdAndUserId(id, userId) {
        const task = await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
            .limit(1)
            .then((rows) => rows.at(0));
        if (task === undefined) {
            return undefined;
        }
        return attachRelations(task);
    },

    async findByUserId(userId) {
        const tasksData = await db
            .select()
            .from(tasks)
            .where(eq(tasks.userId, userId))
            .orderBy(desc(tasks.createdAt));
        return Promise.all(tasksData.map(attachRelations));
    },

    async findByProjectId(projectId, userId) {
        const tasksData = await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, userId)))
            .orderBy(desc(tasks.createdAt));
        return Promise.all(tasksData.map(attachRelations));
    },

    async findSubTasks(parentTaskId, userId) {
        return await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.parentTaskId, parentTaskId), eq(tasks.userId, userId)))
            .orderBy(desc(tasks.createdAt));
    },

    async update(id, userId, data) {
        await db
            .update(tasks)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        return taskRepository.findById(id);
    },

    async updateStatus(id, userId, status) {
        const isCompleted = status === 'COMPLETED';
        await db
            .update(tasks)
            .set({
                status,
                isCompleted,
                updatedAt: new Date(),
                ...(isCompleted ? { progress: 100 } : {}),
            })
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        return taskRepository.findById(id);
    },

    async updateProgress(id, userId, progress) {
        const progressValue = Math.floor(progress);
        const status: TaskStatus =
            progressValue === 100
                ? 'COMPLETED'
                : progressValue > 0
                  ? 'IN_PROGRESS'
                  : 'TODO';
        await db
            .update(tasks)
            .set({
                progress: progressValue,
                isCompleted: progressValue === 100,
                status,
                updatedAt: new Date(),
            })
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        return taskRepository.findById(id);
    },

    async delete(id, userId) {
        await taskRepository.orphanSubtasks(id, userId);
        const result = await db
            .delete(tasks)
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        return result[0].affectedRows > 0;
    },

    async orphanSubtasks(parentTaskId, userId) {
        await db
            .update(tasks)
            .set({ parentTaskId: null })
            .where(and(eq(tasks.parentTaskId, parentTaskId), eq(tasks.userId, userId)));
    },
};
