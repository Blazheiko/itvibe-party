import { broadcastService } from '#app/services/broadcast-service.js';
import type {
    WebSocketConnectionEvent,
    WebSocketDisconnectionEvent,
} from '#vendor/types/types.js';

export const wsPresenceService = {
    onUserConnected(event: WebSocketConnectionEvent): void {
        event.ws.subscribe('change_online');
        broadcastService.broadcastOnline(event.userId, 'online');
    },

    onUserDisconnected(event: WebSocketDisconnectionEvent): void {
        broadcastService.broadcastOnline(event.userId, 'offline');
    },
};
