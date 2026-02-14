import type { HttpContext } from "#vendor/types/types.js";
import { getTypedPayload } from "#vendor/utils/validation/get-typed-payload.js";
import calendarModel from "#app/models/Calendar.js";
import type {
  GetEventsResponse,
  CreateEventResponse,
  GetEventResponse,
  UpdateEventResponse,
  DeleteEventResponse,
  GetEventsByDateResponse,
  GetEventsByRangeResponse,
} from "../types/CalendarController.js";
import type {
  CreateEventInput,
  GetEventsByRangeInput,
  UpdateEventInput,
} from "shared/schemas";

export default {
  async getEvents(context: HttpContext): Promise<GetEventsResponse> {
    const { auth, logger } = context;
    logger.info("getEvents handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    try {
      const events = await calendarModel.findByUserId(BigInt(userId));
      return { status: "success", data: events };
    } catch (error) {
      logger.error({ err: error }, "Error getting events:");
      return { status: "error", message: "Failed to get events" };
    }
  },

  async createEvent(
    context: HttpContext<CreateEventInput>,
  ): Promise<CreateEventResponse> {
    const { auth, logger } = context;
    logger.info("createEvent handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    // const { title, description, startTime, endTime } = getTypedPayload(context);
    const payload = getTypedPayload(context);

    const { title, description, startTime, endTime } = payload;

    try {
      const createdEvent = await calendarModel.create({
        title,
        description,
        startTime,
        endTime,
        userId: BigInt(userId),
      });

      return { status: "success", data: createdEvent };
    } catch (error) {
      logger.error({ err: error }, "Error creating event:");
      return { status: "error", message: "Failed to create event" };
    }
  },

  async getEvent(context: HttpContext): Promise<GetEventResponse> {
    const { httpData, auth, logger } = context;
    logger.info("getEvent handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { eventId } = httpData.params as { eventId: string };

    try {
      const event = await calendarModel.findById(BigInt(eventId), BigInt(userId));
      return { status: "success", data: event };
    } catch (error) {
      logger.error({ err: error }, "Error getting event:");
      return { status: "error", message: "Failed to get event" };
    }
  },

  async updateEvent(
    context: HttpContext<UpdateEventInput>,
  ): Promise<UpdateEventResponse> {
    const { httpData, auth, logger } = context;
    logger.info("updateEvent handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { eventId } = httpData.params as { eventId: string };
    const { title, description, startTime, endTime } = getTypedPayload(context);

    try {
      const updatedEvent = await calendarModel.update(
        BigInt(eventId),
        BigInt(userId),
        {
          title,
          description,
          startTime,
          endTime,
        },
      );

      return { status: "success", data: updatedEvent };
    } catch (error) {
      logger.error({ err: error }, "Error updating event:");
      return { status: "error", message: "Failed to update event" };
    }
  },

  async deleteEvent(context: HttpContext): Promise<DeleteEventResponse> {
    const { httpData, auth, logger } = context;
    logger.info("deleteEvent handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { eventId } = httpData.params as { eventId: string };

    try {
      await calendarModel.delete(BigInt(eventId), BigInt(userId));
      return { status: "success", message: "Event deleted successfully" };
    } catch (error) {
      logger.error({ err: error }, "Error deleting event:");
      return { status: "error", message: "Failed to delete event" };
    }
  },

  async getEventsByDate(
    context: HttpContext,
  ): Promise<GetEventsByDateResponse> {
    const { httpData, auth, logger } = context;
    logger.info("getEventsByDate handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { date } = httpData.params as { date: string };

    try {
      const events = await calendarModel.findByDate(
        BigInt(userId),
        new Date(date),
      );
      return { status: "success", data: events };
    } catch (error) {
      logger.error({ err: error }, "Error getting events by date:");
      return { status: "error", message: "Failed to get events by date" };
    }
  },

  async getEventsByRange(
    context: HttpContext<GetEventsByRangeInput>,
  ): Promise<GetEventsByRangeResponse> {
    const { auth, logger } = context;
    logger.info("getEventsByRange handler");

    if (!auth.check()) {
      return { status: "error", message: "Unauthorized" };
    }

    const userId = auth.getUserId();
    if (userId === null) {
      return { status: "error", message: "Unauthorized" };
    }

    const { startDate, endDate } = getTypedPayload(context);

    try {
      const events = await calendarModel.findByRange(
        BigInt(userId),
        new Date(startDate),
        new Date(endDate),
      );
      return { status: "success", data: events };
    } catch (error) {
      logger.error({ err: error }, "Error getting events by range:");
      return {
        status: "error",
        message: "Failed to get events by range",
      };
    }
  },
};
