import { DateTime } from 'luxon';
import type { ProjectWithTasks } from '#app/repositories/project-repository.js';

export type SerializedProject = Omit<
    ProjectWithTasks,
    'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'dueDate'
> & {
    created_at: string | null;
    updated_at: string | null;
    startDate: string | null;
    endDate: string | null;
    dueDate: string | null;
};

export const projectTransformer = {
    serialize(project: ProjectWithTasks): SerializedProject {
        const { createdAt, updatedAt, startDate, endDate, dueDate, ...rest } = project;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            startDate: startDate !== null ? DateTime.fromJSDate(startDate).toISO() : null,
            endDate: endDate !== null ? DateTime.fromJSDate(endDate).toISO() : null,
            dueDate: dueDate !== null ? DateTime.fromJSDate(new Date(dueDate)).toISO() : null,
        };
    },

    serializeArray(projectsList: ProjectWithTasks[]): SerializedProject[] {
        return projectsList.map((p) => projectTransformer.serialize(p));
    },
};
