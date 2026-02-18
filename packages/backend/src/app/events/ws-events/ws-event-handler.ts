import logger from '#logger';
import { wsPresenceService } from '#app/services/ws-presence-service.js';
import type {
    WebSocketConnectionEvent,
    WebSocketDisconnectionEvent,
} from '#vendor/types/types.js';

export default {
    onUserConnected(event: WebSocketConnectionEvent) {
        logger.info(`ws event: User ${event.userId} connected`);
        wsPresenceService.onUserConnected(event);
    },

    onUserDisconnected(event: WebSocketDisconnectionEvent) {
        logger.info(`ws event: User ${event.userId} disconnected`);
        wsPresenceService.onUserDisconnected(event);
    },
};
