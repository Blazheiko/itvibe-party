import { db } from '#database/db.js';
import { projects, tasks } from '#database/schema.js';
import { and, desc, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type ProjectRow = InferSelectModel<typeof projects>;
export type ProjectInsert = InferInsertModel<typeof projects>;
export type TaskRow = InferSelectModel<typeof tasks>;

export type ProjectUpdate = Partial<
    Pick<
        ProjectInsert,
        | 'title'
        | 'description'
        | 'color'
        | 'progress'
        | 'isActive'
        | 'status'
        | 'startDate'
        | 'endDate'
        | 'dueDate'
        | 'priority'
    >
>;

export type ProjectTaskSummary = Pick<
    TaskRow,
    'id' | 'title' | 'status' | 'progress' | 'isCompleted'
>;

export type ProjectWithTasks = ProjectRow & { tasks: ProjectTaskSummary[] };

export type ShortProject = Pick<ProjectRow, 'id' | 'title' | 'isActive'>;

export interface IProjectRepository {
    create(data: ProjectInsert): Promise<ProjectRow>;
    findById(id: bigint): Promise<ProjectRow | undefined>;
    findByIdAndUserId(id: bigint, userId: bigint): Promise<ProjectWithTasks | undefined>;
    findByUserId(userId: bigint): Promise<ProjectWithTasks[]>;
    findShortByUserId(userId: bigint): Promise<ShortProject[]>;
    update(id: bigint, userId: bigint, data: ProjectUpdate): Promise<ProjectWithTasks | undefined>;
    archive(id: bigint, userId: bigint): Promise<ProjectRow | undefined>;
    delete(id: bigint, userId: bigint): Promise<boolean>;
    getProjectTasks(id: bigint, userId: bigint): Promise<TaskRow[] | undefined>;
    orphanTasks(projectId: bigint, userId: bigint): Promise<void>;
}

async function getTaskSummaries(projectId: bigint): Promise<ProjectTaskSummary[]> {
    return await db
        .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            progress: tasks.progress,
            isCompleted: tasks.isCompleted,
        })
        .from(tasks)
        .where(eq(tasks.projectId, projectId));
}

export const projectRepository: IProjectRepository = {
    async create(data) {
        const [result] = await db.insert(projects).values(data);
        const created = await db
            .select()
            .from(projects)
            .where(eq(projects.id, BigInt(result.insertId)))
            .limit(1)
            .then((rows) => rows.at(0));
        if (created === undefined) {
            throw new Error('Failed to create project');
        }
        return created;
    },

    async findById(id) {
        return await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1)
            .then((rows) => rows.at(0));
    },

    async findByIdAndUserId(id, userId) {
        const project = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)))
            .limit(1)
            .then((rows) => rows.at(0));
        if (project === undefined) {
            return undefined;
        }
        const projectTasks = await getTaskSummaries(project.id);
        return { ...project, tasks: projectTasks };
    },

    async findByUserId(userId) {
        const projectsData = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, userId))
            .orderBy(desc(projects.createdAt));
        return Promise.all(
            projectsData.map(async (project) => {
                const projectTasks = await getTaskSummaries(project.id);
                return { ...project, tasks: projectTasks };
            }),
        );
    },

    async findShortByUserId(userId) {
        return await db
            .select({ id: projects.id, title: projects.title, isActive: projects.isActive })
            .from(projects)
            .where(and(eq(projects.userId, userId), eq(projects.isActive, true)));
    },

    async update(id, userId, data) {
        await db
            .update(projects)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(projects.id, id), eq(projects.userId, userId)));
        return projectRepository.findByIdAndUserId(id, userId);
    },

    async archive(id, userId) {
        await db
            .update(projects)
            .set({ status: 'archived', isActive: false, endDate: new Date(), updatedAt: new Date() })
            .where(and(eq(projects.id, id), eq(projects.userId, userId)));
        return projectRepository.findById(id);
    },

    async delete(id, userId) {
        await projectRepository.orphanTasks(id, userId);
        const result = await db
            .delete(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)));
        return result[0].affectedRows > 0;
    },

    async getProjectTasks(id, userId) {
        const project = await db
            .select({ id: projects.id })
            .from(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)))
            .limit(1)
            .then((rows) => rows.at(0));
        if (project === undefined) {
            return undefined;
        }
        return await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.projectId, id), eq(tasks.userId, userId)))
            .orderBy(desc(tasks.createdAt));
    },

    async orphanTasks(projectId, userId) {
        await db
            .update(tasks)
            .set({ projectId: null })
            .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, userId)));
    },
};
