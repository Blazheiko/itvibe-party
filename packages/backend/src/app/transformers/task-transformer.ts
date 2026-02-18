import { DateTime } from 'luxon';
import type { ProjectRow, TaskRow, TaskWithRelations } from '#app/repositories/task-repository.js';

export type SerializedProject = Omit<ProjectRow, 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'dueDate'> & {
    created_at: string | null;
    updated_at: string | null;
    startDate: string | null;
    endDate: string | null;
    dueDate: string | null;
};

export type SerializedTask = Omit<
    TaskWithRelations,
    'createdAt' | 'updatedAt' | 'startDate' | 'dueDate' | 'project' | 'subTasks'
> & {
    created_at: string | null;
    updated_at: string | null;
    startDate: string | null;
    dueDate: string | null;
    project: SerializedProject | null;
    subTasks: SerializedSubTask[];
};

export type SerializedSubTask = Omit<TaskRow, 'createdAt' | 'updatedAt' | 'startDate' | 'dueDate'> & {
    created_at: string | null;
    updated_at: string | null;
    startDate: string | null;
    dueDate: string | null;
};

function serializeProject(project: ProjectRow): SerializedProject {
    const { createdAt, updatedAt, startDate, endDate, dueDate, ...rest } = project;
    return {
        ...rest,
        created_at: DateTime.fromJSDate(createdAt).toISO(),
        updated_at: DateTime.fromJSDate(updatedAt).toISO(),
        startDate: startDate !== null ? DateTime.fromJSDate(startDate).toISO() : null,
        endDate: endDate !== null ? DateTime.fromJSDate(endDate).toISO() : null,
        dueDate: dueDate !== null ? DateTime.fromJSDate(new Date(dueDate)).toISO() : null,
    };
}

function serializeSubTask(task: TaskRow): SerializedSubTask {
    const { createdAt, updatedAt, startDate, dueDate, ...rest } = task;
    return {
        ...rest,
        created_at: DateTime.fromJSDate(createdAt).toISO(),
        updated_at: DateTime.fromJSDate(updatedAt).toISO(),
        startDate: startDate !== null ? DateTime.fromJSDate(startDate).toISO() : null,
        dueDate: dueDate !== null ? DateTime.fromJSDate(dueDate).toISO() : null,
    };
}

export const taskTransformer = {
    serialize(task: TaskWithRelations): SerializedTask {
        const { createdAt, updatedAt, startDate, dueDate, project, subTasks, ...rest } = task;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            startDate: startDate !== null ? DateTime.fromJSDate(startDate).toISO() : null,
            dueDate: dueDate !== null ? DateTime.fromJSDate(dueDate).toISO() : null,
            project: project !== null ? serializeProject(project) : null,
            subTasks: subTasks.map(serializeSubTask),
        };
    },

    serializeArray(tasksList: TaskWithRelations[]): SerializedTask[] {
        return tasksList.map((t) => taskTransformer.serialize(t));
    },

    serializeSubTask,
};
