import type { HttpContext } from "#vendor/types/types.js";
import { getTypedPayload } from "#vendor/utils/validation/get-typed-payload.js";
import Notes from "#app/models/Notes.js";
import NotesPhoto from "#app/models/notes-photo.js";
import type {
  GetNotesResponse,
  CreateNoteResponse,
  GetNoteResponse,
  UpdateNoteResponse,
  DeleteNoteResponse,
  AddPhotoResponse,
  DeletePhotoResponse,
} from "../types/NotesController.js";
import type {
  CreateNoteInput,
  UpdateNoteInput,
} from "shared/schemas";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { uploadToS3 } from "#vendor/utils/storage/s3.js";
import diskConfig from "#config/disk.js";
import * as console from "node:console";

export default {
  async getNotes(context: HttpContext): Promise<GetNotesResponse> {
    const { auth, logger } = context;
    logger.info("getNotes handler");

    if (!auth?.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    try {
      const notes = await Notes.findByUserId(BigInt(userId));
      return { status: "ok", data: notes };
    } catch (error) {
      logger.error({ err: error }, "Error getting notes:");
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to get notes",
      };
    }
  },

  async createNote(
    context: HttpContext<CreateNoteInput>,
  ): Promise<CreateNoteResponse> {
    const { auth, logger } = context;
    logger.info("createNote handler");

    if (!auth?.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { title, description } = getTypedPayload(context);

    try {
      const note = await Notes.create({
        title,
        description,
        userId: BigInt(userId),
      });
      return { status: "ok", data: note };
    } catch (error) {
      logger.error({ err: error }, "Error creating note:");
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to create note",
      };
    }
  },

  async getNote(context: HttpContext): Promise<GetNoteResponse> {
    const { httpData, auth, logger } = context;
    logger.info("getNote handler");

    if (!auth?.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { noteId } = httpData.params as { noteId: string };

    try {
      const note = await Notes.findById(BigInt(noteId), BigInt(userId));
      return { status: "ok", data: note };
    } catch (error) {
      logger.error({ err: error }, "Error getting note:");
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to get note",
      };
    }
  },

  async updateNote(
    context: HttpContext<UpdateNoteInput>,
  ): Promise<UpdateNoteResponse> {
    const { httpData, auth, logger } = context;
    logger.info("updateNote handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { noteId } = httpData.params as { noteId: string };
    const { title, description } = getTypedPayload(context);

    try {
      const note = await Notes.update(BigInt(noteId), BigInt(userId), {
        title,
        description,
      });
      return { status: "ok", data: note };
    } catch (error) {
      logger.error({ err: error }, "Error updating note:");
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to update note",
      };
    }
  },

  async deleteNote(context: HttpContext): Promise<DeleteNoteResponse> {
    const { httpData, auth, logger } = context;
    logger.info("deleteNote handler");

    if (!auth?.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { noteId } = httpData.params as { noteId: string };

    try {
      await Notes.delete(BigInt(noteId), BigInt(userId));
      return { status: "ok", message: "Note deleted successfully" };
    } catch (error) {
      logger.error({ err: error }, "Error deleting note:");
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete note",
      };
    }
  },

  async addPhoto(
    context: HttpContext,
  ): Promise<AddPhotoResponse> {
    const { httpData, auth, logger } = context;
    logger.info("addPhoto handler");

    if (!auth?.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { noteId } = httpData.params as { noteId: string };

    const file = httpData.files?.get("photo");
    if (file === undefined) {
      return { status: "error", message: "No file uploaded" };
    }

    try {
      // Verify note belongs to user
      const hasAccess = await Notes.verifyOwnership(BigInt(noteId), BigInt(userId));
      if (!hasAccess) {
        return {
          status: "error",
          message: "Note not found or access denied",
        };
      }

      // Generate unique S3 key
      const ext = path.extname(file.filename) || ".bin";
      const uniqueName = `${randomUUID()}${ext}`;
      const prefix = (diskConfig.s3DynamicDataPrefix ?? "uploads").replace(/^\/+/, "");
      const s3Key = `${prefix}/${uniqueName}`;

      // Upload to S3
      const data = await uploadToS3(s3Key, Buffer.from(file.data), file.type);
      console.log(data)

      const photo = await NotesPhoto.create({
        noteId: parseInt(noteId),
        src: s3Key,
        filename: file.filename,
        size: file.data.byteLength,
      });
      return { status: "ok", photo };
    } catch (error) {
      logger.error({ err: error }, "Error adding photo:");
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to add photo",
      };
    }
  },

  async deletePhoto(context: HttpContext): Promise<DeletePhotoResponse> {
    const { httpData, auth, logger } = context;
    logger.info("deletePhoto handler");

    if (!auth?.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { noteId, photoId } = httpData.params as {
      noteId: string;
      photoId: string;
    };

    try {
      // Verify note belongs to user
      const hasAccess = await Notes.verifyOwnership(BigInt(noteId), BigInt(userId));
      if (!hasAccess) {
        return {
          status: "error",
          message: "Note not found or access denied",
        };
      }

      await NotesPhoto.delete(BigInt(photoId), BigInt(noteId));
      return { status: "ok", message: "Photo deleted successfully" };
    } catch (error) {
      logger.error({ err: error }, "Error deleting photo:");
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete photo",
      };
    }
  },
};
