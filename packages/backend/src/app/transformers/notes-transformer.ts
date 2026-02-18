import { DateTime } from 'luxon';
import type { NotePhotoRow, NoteWithPhotos } from '#app/repositories/notes-repository.js';

export type SerializedNotePhoto = Omit<NotePhotoRow, 'createdAt' | 'updatedAt'> & {
    created_at: string | null;
    updated_at: string | null;
};

export type SerializedNote = Omit<NoteWithPhotos, 'createdAt' | 'updatedAt' | 'photos'> & {
    created_at: string | null;
    updated_at: string | null;
    photos: SerializedNotePhoto[];
};

function serializePhoto(photo: NotePhotoRow): SerializedNotePhoto {
    const { createdAt, updatedAt, ...rest } = photo;
    return {
        ...rest,
        created_at: DateTime.fromJSDate(createdAt).toISO(),
        updated_at: DateTime.fromJSDate(updatedAt).toISO(),
    };
}

export const notesTransformer = {
    serialize(note: NoteWithPhotos): SerializedNote {
        const { createdAt, updatedAt, photos, ...rest } = note;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            photos: photos.map(serializePhoto),
        };
    },

    serializeArray(notesList: NoteWithPhotos[]): SerializedNote[] {
        return notesList.map((n) => notesTransformer.serialize(n));
    },
};
