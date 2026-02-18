import { broadcastService } from '#app/services/broadcast-service.js';
import type {
    WebSocketConnectionEvent,
    WebSocketDisconnectionEvent,
} from '#vendor/types/types.js';

export const wsPresenceService = {
    onUserConnected(event: WebSocketConnectionEvent) {
        if (event.ws) {
            event.ws.subscribe('change_online');
        }

        if (event.userId) {
            broadcastService.broadcastOnline(event.userId, 'online');
        }
    },

    onUserDisconnected(event: WebSocketDisconnectionEvent) {
        if (event.userId) {
            broadcastService.broadcastOnline(event.userId, 'offline');
        }
    },
};
