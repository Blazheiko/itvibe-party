import configApp from '#config/app.js';

export function getWsUrl(token: string): string {
    const protocol =
        configApp.env === 'production' || configApp.env === 'prod' ? 'wss' : 'ws';
    return `${protocol}://${configApp.domain}/${configApp.pathPrefix}/websocket/${token}`;
}
