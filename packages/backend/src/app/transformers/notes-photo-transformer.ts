import { DateTime } from 'luxon';
import type { NotePhotoRow } from '#app/repositories/notes-photo-repository.js';

export type SerializedNotePhoto = Omit<NotePhotoRow, 'createdAt' | 'updatedAt'> & {
    created_at: string | null;
    updated_at: string | null;
};

export const notesPhotoTransformer = {
    serialize(photo: NotePhotoRow): SerializedNotePhoto {
        const { createdAt, updatedAt, ...rest } = photo;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
        };
    },

    serializeArray(photos: NotePhotoRow[]): SerializedNotePhoto[] {
        return photos.map((p) => notesPhotoTransformer.serialize(p));
    },
};
