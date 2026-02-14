// @ts-nocheck
import * as uWS from "uWebSockets.js";
// import type {
//   HttpRequest,
//   HttpResponse,
//   us_listen_socket,
//   WebSocket,
// } from "uWebSockets.js";
import type { CompressOptions } from "uWebSockets.js";
import appConfig from "#config/app.js";
import corsConfig from "#config/cors.js";
import cookiesConfig from "#config/cookies.js";
import state from "#app/state/state.js";
import {
  onMessage,
  onOpen,
  onClose,
  handleUpgrade,
  closeAllWs,
} from "#vendor/utils/network/ws-handlers.js";
import {
  getHeaders,
  getData,
  extractParameters,
  normalizePath,
  parseCookies,
} from "../utils/network/http-request-handlers.js";
import { ParameterValidationError } from "#app/validate/checkers/parameter-checker.js";
import { ValidationError } from "#app/validate/errors/validation-error.js";
import logger from "#vendor/utils/logger.js";
import { getListRoutes } from "#vendor/start/router.js";
import {
  setHeaders,
  setCookies,
} from "#vendor/utils/network/http-response-handlers.js";
import executeMiddlewares from "#vendor/utils/middlewares/core/execute-httpMiddlewares.js";
import checkRateLimit from "#vendor/utils/rate-limit/http-rate-limit.js";
import type {
  Cookie,
  Header,
  HttpData,
  MyWebSocket,
  ResponseData,
  RouteItem,
  Payload,
  CookieOptions,
} from "#vendor/types/types.js";
import contextHandler from "../utils/context/http-context.js";
import {
  cacheStaticSource,
  staticHandler,
  staticCacheHandler,
} from "#vendor/start/static-server.js";
import configApp from "#config/app.js";
import httpRoutes from "#app/routes/http-routes.js";
import wsRoutes from "#app/routes/ws-routes.js";
// import schemas from "#app/validate/schemas/schemas.js";
import getIP from "#vendor/utils/network/get-ip.js";
import { getApiTypesForDocumentation } from "#vendor/utils/tooling/parse-types-from-dts.js";
import { serializeRoutes } from "#vendor/utils/routing/serialize-routes.js";
import path from "path";
import {
  makeBroadcastJson,
  makeJson,
} from "#vendor/utils/helpers/json-handlers.js";
import { type } from "@arktype/type";
import * as console from "node:console";

export interface us_listen_socket {
  fd: number;
  port: number;
  addr: string;
  addr_len: number;
  flags: number;
  family: number;
  type: number;
  ssl: boolean;
  ssl_context: unknown;
  ssl_context_free: () => void;
  ssl_context_free_cb: () => void;
  ssl_context_free_cb_data: unknown;
  ssl_context_free_cb_data_free: () => void;
  ssl_context_free_cb_data_free_data: unknown;
}

/** Native type representing a raw uSockets struct us_socket_t.
 * Careful with this one, it is entirely unchecked and native so invalid usage will blow up.
 */
export interface us_socket {
  fd: number;
  port: number;
  addr: string;
  addr_len: number;
  flags: number;
  family: number;
  type: number;
}

/** Native type representing a raw uSockets struct us_socket_context_t.
 * Used while upgrading a WebSocket manually. */
export interface us_socket_context_t {
  fd: number;
  port: number;
  addr: string;
  addr_len: number;
  flags: number;
  family: number;
  type: number;
}

/** Recognized string types, things C++ can read and understand as strings.
 * "String" does not have to mean "text", it can also be "binary".
 *
 * Ironically, JavaScript strings are the least performant of all options, to pass or receive to/from C++.
 * This because we expect UTF-8, which is packed in 8-byte chars. JavaScript strings are UTF-16 internally meaning extra copies and reinterpretation are required.
 *
 * That's why all events pass data by ArrayBuffer and not JavaScript strings, as they allow zero-copy data passing.
 *
 * You can always do Buffer.from(arrayBuffer).toString(), but keeping things binary and as ArrayBuffer is preferred.
 */
export type RecognizedString =
  | string
  | ArrayBuffer
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array;

/** A WebSocket connection that is valid from open to close event.
 * Read more about this in the user manual.
 */
export interface WebSocket<UserData> {
  /** Sends a message. Returns 1 for success, 2 for dropped due to backpressure limit, and 0 for built up backpressure that will drain over time. You can check backpressure before or after sending by calling getBufferedAmount().
   *
   * Make sure you properly understand the concept of backpressure. Check the backpressure example file.
   */
  send(
    message: RecognizedString,
    isBinary?: boolean,
    compress?: boolean,
  ): number;

  /** Returns the bytes buffered in backpressure. This is similar to the bufferedAmount property in the browser counterpart.
   * Check backpressure example.
   */
  getBufferedAmount(): number;

  /** Gracefully closes this WebSocket. Immediately calls the close handler.
   * A WebSocket close message is sent with code and shortMessage.
   */
  end(code?: number, shortMessage?: RecognizedString): void;

  /** Forcefully closes this WebSocket. Immediately calls the close handler.
   * No WebSocket close message is sent.
   */
  close(): void;

  /** Sends a ping control message. Returns sendStatus similar to WebSocket.send (regarding backpressure). This helper function correlates to WebSocket::send(message, uWS::OpCode::PING, ...) in C++. */
  ping(message?: RecognizedString): number;

  /** Subscribe to a topic. */
  subscribe(topic: RecognizedString): boolean;

  /** Unsubscribe from a topic. Returns true on success, if the WebSocket was subscribed. */
  unsubscribe(topic: RecognizedString): boolean;

  /** Returns whether this websocket is subscribed to topic. */
  isSubscribed(topic: RecognizedString): boolean;

  /** Returns a list of topics this websocket is subscribed to. */
  getTopics(): string[];

  /** Publish a message under topic. Backpressure is managed according to maxBackpressure, closeOnBackpressureLimit settings.
   * Order is guaranteed since v20.
   */
  publish(
    topic: RecognizedString,
    message: RecognizedString,
    isBinary?: boolean,
    compress?: boolean,
  ): boolean;

  /** See HttpResponse.cork. Takes a function in which the socket is corked (packing many sends into one single syscall/SSL block) */
  cork(cb: () => void): WebSocket<UserData>;

  /** Returns the remote IP address. Note that the returned IP is binary, not text.
   *
   * IPv4 is 4 byte long and can be converted to text by printing every byte as a digit between 0 and 255.
   * IPv6 is 16 byte long and can be converted to text in similar ways, but you typically print digits in HEX.
   *
   * See getRemoteAddressAsText() for a text version.
   */
  getRemoteAddress(): ArrayBuffer;

  /** Returns the remote IP address as text. See RecognizedString. */
  getRemoteAddressAsText(): ArrayBuffer;

  /** Returns the UserData object. */
  getUserData(): UserData;
}

/** An HttpResponse is valid until either onAborted callback or any of the .end/.tryEnd calls succeed. You may attach user data to this object. */
export interface HttpResponse {
  /** Writes the HTTP status message such as "200 OK".
   * This has to be called first in any response, otherwise
   * it will be called automatically with "200 OK".
   *
   * If you want to send custom headers in a WebSocket
   * upgrade response, you have to call writeStatus with
   * "101 Switching Protocols" before you call writeHeader,
   * otherwise your first call to writeHeader will call
   * writeStatus with "200 OK" and the upgrade will fail.
   *
   * As you can imagine, we format outgoing responses in a linear
   * buffer, not in a hash table. You can read about this in
   * the user manual under "corking".
   */

  /** Pause http body streaming (throttle) */
  pause(): void;

  /** Resume http body streaming (unthrottle) */
  resume(): void;

  writeStatus(status: RecognizedString): HttpResponse;
  /** Writes key and value to HTTP response.
   * See writeStatus and corking.
   */
  writeHeader(key: RecognizedString, value: RecognizedString): HttpResponse;
  /** Enters or continues chunked encoding mode. Writes part of the response. End with zero length write. Returns true if no backpressure was added. */
  write(chunk: RecognizedString): boolean;
  /** Ends this response by copying the contents of body. */
  end(body?: RecognizedString, closeConnection?: boolean): HttpResponse;
  /** Ends this response without a body. */
  endWithoutBody(
    reportedContentLength?: number,
    closeConnection?: boolean,
  ): HttpResponse;
  /** Ends this response, or tries to, by streaming appropriately sized chunks of body. Use in conjunction with onWritable. Returns tuple [ok, hasResponded].*/
  tryEnd(
    fullBodyOrChunk: RecognizedString,
    totalSize: number,
  ): [boolean, boolean];

  /** Immediately force closes the connection. Any onAborted callback will run. */
  close(): HttpResponse;

  /** Returns the global byte write offset for this response. Use with onWritable. */
  getWriteOffset(): number;

  /** Registers a handler for writable events. Continue failed write attempts in here.
   * You MUST return true for success, false for failure.
   * Writing nothing is always success, so by default you must return true.
   */
  onWritable(handler: (offset: number) => boolean): HttpResponse;

  /** Every HttpResponse MUST have an attached abort handler IF you do not respond
   * to it immediately inside of the callback. Returning from an Http request handler
   * without attaching (by calling onAborted) an abort handler is ill-use and will terminate.
   * When this event emits, the response has been aborted and may not be used. */
  onAborted(handler: () => void): HttpResponse;

  /** Handler for reading data from POST and such requests. You MUST copy the data of chunk if isLast is not true. We Neuter ArrayBuffers on return, making it zero length.*/
  onData(handler: (chunk: ArrayBuffer, isLast: boolean) => void): HttpResponse;

  /** Returns the remote IP address in binary format (4 or 16 bytes). */
  getRemoteAddress(): ArrayBuffer;

  /** Returns the remote IP address as text. */
  getRemoteAddressAsText(): ArrayBuffer;

  /** Returns the remote IP address in binary format (4 or 16 bytes), as reported by the PROXY Protocol v2 compatible proxy. */
  getProxiedRemoteAddress(): ArrayBuffer;

  /** Returns the remote IP address as text, as reported by the PROXY Protocol v2 compatible proxy. */
  getProxiedRemoteAddressAsText(): ArrayBuffer;

  /** Corking a response is a performance improvement in both CPU and network, as you ready the IO system for writing multiple chunks at once.
   * By default, you're corked in the immediately executing top portion of the route handler. In all other cases, such as when returning from
   * await, or when being called back from an async database request or anything that isn't directly executing in the route handler, you'll want
   * to cork before calling writeStatus, writeHeader or just write. Corking takes a callback in which you execute the writeHeader, writeStatus and
   * such calls, in one atomic IO operation. This is important, not only for TCP but definitely for TLS where each write would otherwise result
   * in one TLS block being sent off, each with one send syscall.
   *
   * Example usage:
   *
   * ```
   * res.cork(() => {
   *   res.writeStatus("200 OK").writeHeader("Some", "Value").write("Hello world!");
   * });
   * ```
   */
  cork(cb: () => void): HttpResponse;

  /** Upgrades a HttpResponse to a WebSocket. See UpgradeAsync, UpgradeSync example files. */
  upgrade(
    userData: UserData,
    secWebSocketKey: RecognizedString,
    secWebSocketProtocol: RecognizedString,
    secWebSocketExtensions: RecognizedString,
    context: us_socket_context_t,
  ): void;

  /** Arbitrary user data may be attached to this object */
  [key: string]: unknown;
}

export type UserData = Record<string, unknown>;

/** An HttpRequest is stack allocated and only accessible during the callback invocation. */
export interface HttpRequest {
  /** Returns the lowercased header value or empty string. */
  getHeader(lowerCaseKey: RecognizedString): string;
  /** Returns the parsed parameter at index. Corresponds to route. Can also take the name of the parameter. */
  getParameter(index: number | RecognizedString): string | undefined;
  /** Returns the URL including initial /slash */
  getUrl(): string;
  /** Returns the lowercased HTTP method, useful for "any" routes. */
  getMethod(): string;
  /** Returns the HTTP method as-is. */
  getCaseSensitiveMethod(): string;
  /** Returns the raw querystring (the part of URL after ? sign) or empty string. */
  getQuery(): string;
  /** Returns a decoded query parameter value or undefined. */
  getQuery(key: string): string | undefined;
  /** Loops over all headers. */
  forEach(cb: (key: string, value: string) => void): void;
  /** Setting yield to true is to say that this route handler did not handle the route, causing the router to continue looking for a matching route handler, or fail. */
  setYield(_yield: boolean): HttpRequest;
}

/** A structure holding settings and handlers for a WebSocket URL route handler. */
export interface WebSocketBehavior<UserData> {
  /** Maximum length of received message. If a client tries to send you a message larger than this, the connection is immediately closed. Defaults to 16 * 1024. */
  maxPayloadLength?: number;
  /** Whether or not we should automatically close the socket when a message is dropped due to backpressure. Defaults to false. */
  closeOnBackpressureLimit?: boolean;
  /** Maximum number of minutes a WebSocket may be connected before being closed by the server. 0 disables the feature. */
  maxLifetime?: number;
  /** Maximum amount of seconds that may pass without sending or getting a message. Connection is closed if this timeout passes. Resolution (granularity) for timeouts are typically 4 seconds, rounded to closest.
   * Disable by using 0. Defaults to 120.
   */
  idleTimeout?: number;
  /** What permessage-deflate compression to use. uWS.DISABLED, uWS.SHARED_COMPRESSOR or any of the uWS.DEDICATED_COMPRESSOR_xxxKB. Defaults to uWS.DISABLED. */
  compression?: CompressOptions;
  /** Maximum length of allowed backpressure per socket when publishing or sending messages. Slow receivers with too high backpressure will be skipped until they catch up or timeout. Defaults to 64 * 1024. */
  maxBackpressure?: number;
  /** Whether or not we should automatically send pings to uphold a stable connection given whatever idleTimeout. */
  sendPingsAutomatically?: boolean;
  /** Upgrade handler used to intercept HTTP upgrade requests and potentially upgrade to WebSocket.
   * See UpgradeAsync and UpgradeSync example files.
   */
  upgrade?: (
    res: HttpResponse,
    req: HttpRequest,
    context: us_socket_context_t,
  ) => void | Promise<void>;
  /** Handler for new WebSocket connection. WebSocket is valid from open to close, no errors. */
  open?: (ws: WebSocket<UserData>) => void | Promise<void>;
  /** Handler for a WebSocket message. Messages are given as ArrayBuffer no matter if they are binary or not. Given ArrayBuffer is valid during the lifetime of this callback (until first await or return) and will be neutered. */
  message?: (
    ws: WebSocket<UserData>,
    message: ArrayBuffer,
    isBinary: boolean,
  ) => void | Promise<void>;
  /** Handler for a dropped WebSocket message. Messages can be dropped due to specified backpressure settings. Messages are given as ArrayBuffer no matter if they are binary or not. Given ArrayBuffer is valid during the lifetime of this callback (until first await or return) and will be neutered. */
  dropped?: (
    ws: WebSocket<UserData>,
    message: ArrayBuffer,
    isBinary: boolean,
  ) => void | Promise<void>;
  /** Handler for when WebSocket backpressure drains. Check ws.getBufferedAmount(). Use this to guide / drive your backpressure throttling. */
  drain?: (ws: WebSocket<UserData>) => void;
  /** Handler for close event, no matter if error, timeout or graceful close. You may not use WebSocket after this event. Do not send on this WebSocket from within here, it is closed. */
  close?: (ws: WebSocket<UserData>, code: number, message: ArrayBuffer) => void;
  /** Handler for received ping control message. You do not need to handle this, pong messages are automatically sent as per the standard. */
  ping?: (ws: WebSocket<UserData>, message: ArrayBuffer) => void;
  /** Handler for received pong control message. */
  pong?: (ws: WebSocket<UserData>, message: ArrayBuffer) => void;
  /** Handler for subscription changes. */
  subscription?: (
    ws: WebSocket<UserData>,
    topic: ArrayBuffer,
    newCount: number,
    oldCount: number,
  ) => void;
}

/** Options used when constructing an app. Especially for SSLApp.
 * These are options passed directly to uSockets, C layer.
 */
export interface AppOptions {
  key_file_name?: RecognizedString;
  cert_file_name?: RecognizedString;
  ca_file_name?: RecognizedString;
  passphrase?: RecognizedString;
  dh_params_file_name?: RecognizedString;
  ssl_ciphers?: RecognizedString;
  /** This translates to SSL_MODE_RELEASE_BUFFERS */
  ssl_prefer_low_memory_usage?: boolean;
}

export enum ListenOptions {
  LIBUS_LISTEN_DEFAULT = 0,
  LIBUS_LISTEN_EXCLUSIVE_PORT = 1,
}

/** TemplatedApp is either an SSL or non-SSL app. See App for more info, read user manual. */
export interface TemplatedApp {
  /** Listens to hostname & port. Callback hands either false or a listen socket. */
  listen(
    host: RecognizedString,
    port: number,
    cb: (listenSocket: us_listen_socket | false) => void | Promise<void>,
  ): TemplatedApp;
  /** Listens to port. Callback hands either false or a listen socket. */
  listen(
    port: number,
    cb: (listenSocket: us_listen_socket | false) => void | Promise<void>,
  ): TemplatedApp;
  /** Listens to port and sets Listen Options. Callback hands either false or a listen socket. */
  listen(
    port: number,
    options: ListenOptions,
    cb: (listenSocket: us_listen_socket | false) => void | Promise<void>,
  ): TemplatedApp;
  /** Listens to unix socket. Callback hands either false or a listen socket. */
  listen_unix(
    cb: (listenSocket: us_listen_socket) => void | Promise<void>,
    path: RecognizedString,
  ): TemplatedApp;
  /** Registers an HTTP GET handler matching specified URL pattern. */
  get(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP POST handler matching specified URL pattern. */
  post(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP OPTIONS handler matching specified URL pattern. */
  options(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP DELETE handler matching specified URL pattern. */
  del(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP PATCH handler matching specified URL pattern. */
  patch(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP PUT handler matching specified URL pattern. */
  put(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP HEAD handler matching specified URL pattern. */
  head(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP CONNECT handler matching specified URL pattern. */
  connect(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP TRACE handler matching specified URL pattern. */
  trace(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers an HTTP handler matching specified URL pattern on any HTTP method. */
  any(
    pattern: RecognizedString,
    handler: (res: HttpResponse, req: HttpRequest) => void | Promise<void>,
  ): TemplatedApp;
  /** Registers a handler matching specified URL pattern where WebSocket upgrade requests are caught. */
  ws<UserData>(
    pattern: RecognizedString,
    behavior: WebSocketBehavior<UserData>,
  ): TemplatedApp;
  /** Publishes a message under topic, for all WebSockets under this app. See WebSocket.publish. */
  publish(
    topic: RecognizedString,
    message: RecognizedString,
    isBinary?: boolean,
    compress?: boolean,
  ): boolean;
  /** Returns number of subscribers for this topic. */
  numSubscribers(topic: RecognizedString): number;
  /** Adds a server name. */
  addServerName(hostname: string, options: AppOptions): TemplatedApp;
  /** Browse to SNI domain. Used together with .get, .post and similar to attach routes under SNI domains. */
  domain(domain: string): TemplatedApp;
  /** Removes a server name. */
  removeServerName(hostname: string): TemplatedApp;
  /** Registers a synchronous callback on missing server names. See /examples/ServerName.js. */
  missingServerName(cb: (hostname: string) => void): TemplatedApp;
  /** Attaches a "filter" function to track socket connections / disconnections */
  filter(
    cb: (res: HttpResponse, count: number) => void | Promise<void>,
  ): TemplatedApp;
  /** Closes all sockets including listen sockets. This will forcefully terminate all connections. */
  close(): TemplatedApp;
}

/** Constructs a non-SSL app. An app is your starting point where you attach behavior to URL routes.
 * This is also where you listen and run your app, set any SSL options (in case of SSLApp) and the like.
 */
// export function App(options?: AppOptions) : TemplatedApp;

// /** Constructs an SSL app. See App. */
// export function SSLApp(options: AppOptions) : TemplatedApp;

// /** Closes a uSockets listen socket. */
// export function us_listen_socket_close(listenSocket: us_listen_socket) : void;

// /** Gets local port of socket (or listenSocket) or -1. */
// export function us_socket_local_port(socket: us_socket) : number;

export interface MultipartField {
  data: ArrayBuffer;
  name: string;
  type?: string;
  filename?: string;
}

/** Takes a POSTed body and contentType, and returns an array of parts if the request is a multipart request */
// export function getParts(body: RecognizedString, contentType: RecognizedString) : MultipartField[] | undefined;

// /** WebSocket compression options. Combine any compressor with any decompressor using bitwise OR. */
// export type CompressOptions = number;
// /** No compression (always a good idea if you operate using an efficient binary protocol) */
// export var DISABLED: CompressOptions;
// /** Zero memory overhead compression. */
// export var SHARED_COMPRESSOR: CompressOptions;
// /** Zero memory overhead decompression. */
// export var SHARED_DECOMPRESSOR: CompressOptions;
// /** Sliding dedicated compress window, requires 3KB of memory per socket */
// export var DEDICATED_COMPRESSOR_3KB: CompressOptions;
// /** Sliding dedicated compress window, requires 4KB of memory per socket */
// export var DEDICATED_COMPRESSOR_4KB: CompressOptions;
// /** Sliding dedicated compress window, requires 8KB of memory per socket */
// export var DEDICATED_COMPRESSOR_8KB: CompressOptions;
// /** Sliding dedicated compress window, requires 16KB of memory per socket */
// export var DEDICATED_COMPRESSOR_16KB: CompressOptions;
// /** Sliding dedicated compress window, requires 32KB of memory per socket */
// export var DEDICATED_COMPRESSOR_32KB: CompressOptions;
// /** Sliding dedicated compress window, requires 64KB of memory per socket */
// export var DEDICATED_COMPRESSOR_64KB: CompressOptions;
// /** Sliding dedicated compress window, requires 128KB of memory per socket */
// export var DEDICATED_COMPRESSOR_128KB: CompressOptions;
// /** Sliding dedicated compress window, requires 256KB of memory per socket */
// export var DEDICATED_COMPRESSOR_256KB: CompressOptions;
// /** Sliding dedicated decompress window, requires 32KB of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR_32KB: CompressOptions;
// /** Sliding dedicated decompress window, requires 16KB of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR_16KB: CompressOptions;
// /** Sliding dedicated decompress window, requires 8KB of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR_8KB: CompressOptions;
// /** Sliding dedicated decompress window, requires 4KB of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR_4KB: CompressOptions;
// /** Sliding dedicated decompress window, requires 2KB of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR_2KB: CompressOptions;
// /** Sliding dedicated decompress window, requires 1KB of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR_1KB: CompressOptions;
// /** Sliding dedicated decompress window, requires 512B of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR_512B: CompressOptions;
// /** Sliding dedicated decompress window, requires 32KB of memory per socket (plus about 23KB) */
// export var DEDICATED_DECOMPRESSOR: CompressOptions;

/** Constructs a non-SSL app. An app is your starting point where you attach behavior to URL routes.
 * This is also where you listen and run your app, set any SSL options (in case of SSLApp) and the like.
 */
// export function App(options?: AppOptions) : TemplatedApp;

const server: TemplatedApp = uWS.App() as TemplatedApp;

const broadcastMessage = (
  userId: number,
  event: string,
  payload: Payload,
): void => {
  // logger.info(`broadcastMessage: ${userId} ${event}`);
  if (state['listenSocket'] !== undefined)
    server.publish(
      `user:${String(userId)}`,
      JSON.stringify(
        { event: `broadcast:${event}`, status: 200, payload },
        (_, v: unknown) => (typeof v === "bigint" ? v.toString() : v),
      ),
    );
};

const broadcastToChannel = (
  channel: string,
  event: string,
  payload: Payload,
): void => {
  server.publish(channel, makeBroadcastJson(event, 200, payload));
};

// const broadcastOnline = (userId: string, status: string) => {
//     server.publish(
//         `change_online`,
//         JSON.stringify({
//             event: `broadcast:change_online`,
//             status: 200,
//             payload: { userId, status },
//         },
//         (_, v) => (typeof v === 'bigint' ? v.toString() : v),
//     ));
// };

const configureWebsockets = (server: TemplatedApp): TemplatedApp => {
  return server.ws(`/${appConfig.pathPrefix}/websocket/:token`, {
    compression: 0,
    idleTimeout: 120, // According to protocol
    maxPayloadLength: 1 * 1024 * 1024,
    maxBackpressure: 64 * 1024,
    open: (ws: WebSocket<Record<string, unknown>>): void => {
      onOpen(ws as MyWebSocket);
    },
    message: (
      ws: WebSocket<Record<string, unknown>>,
      message: ArrayBuffer,
      isBinary: boolean,
    ) => onMessage(ws as MyWebSocket, message, isBinary),
    // upgrade: async (res: HttpResponse, req: HttpRequest, context: us_socket_context_t) => {
    //    await handleUpgrade(res, req, context);
    // },
    upgrade: handleUpgrade,
    // drain: (ws) => handleDrain(ws),
    close: (
      ws: WebSocket<Record<string, unknown>>,
      code: number,
      message: ArrayBuffer,
    ): void => {
      onClose(ws as MyWebSocket, code, message).catch((error: unknown) => {
        console.error(error);
      });
    },
  });
};

type SetCookie = (name: string, value: string, options: CookieOptions) => void;
type DeleteCookie = (name: string) => void;
type SetHeader = (name: string, value: string) => void;
// CSP header is applied from staticServer for HTML responses
const getResponseData = (): ResponseData => {
  const cookies: Map<string, Cookie> = new Map<string, Cookie>();
  const headers: Header[] = [];
  const setCookie: SetCookie = (
    name: string,
    value: string,
    options: CookieOptions,
  ): void => {
    cookies.set(name, {
      name,
      value,
      path: options.path ?? cookiesConfig.default.path,
      httpOnly: options.httpOnly ?? cookiesConfig.default.httpOnly,
      secure: options.secure ?? cookiesConfig.default.secure,
      expires: options.expires ?? undefined,
      maxAge: options.maxAge ?? cookiesConfig.default.maxAge,
      sameSite: options.sameSite ?? cookiesConfig.default.sameSite,
    });
  };

  const deleteCookie: DeleteCookie = (name: string): void => {
    cookies.delete(name);
  };
  const setHeader: SetHeader = (name: string, value: string): void => {
    headers.push({ name, value });
  };

  return {
    aborted: false,
    payload: {},
    middlewareData: {},
    headers,
    cookies,
    status: 200,
    setCookie,
    deleteCookie,
    setHeader,
  };
};

const getHttpData = async (
  req: HttpRequest,
  res: HttpResponse,
  route: RouteItem,
): Promise<HttpData> => {
  const cookies: Map<string, string> = parseCookies(req.getHeader("cookie"));
  //   const url = req.getUrl();
  const query = new URLSearchParams(req.getQuery());
  const headers = getHeaders(req);
  let params: Record<string, string>;
  if (route.parametersKey !== undefined && route.parametersKey.length > 0) {
    params = extractParameters(route.parametersKey, req);
  } else {
    params = {};
  }
  const contentType = headers.get("content-type");
  // const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
  const ip = getIP(req, res);
  const isJson =
    (route.method === "post" || route.method === "put") &&
    contentType?.trim().toLowerCase() === "application/json";

  let payload: Payload | null = null;
  console.log(route.validator)

  if (
    isJson &&
    route.validator !== undefined
  ) {
    logger.info('route.validator Get Http Data')

    const httpPayload = await getData(res, contentType);
    if (httpPayload !== null) {
      const validatedInput = (route.validator as (payload: Payload) => unknown)(httpPayload);

      if (validatedInput instanceof type.errors) {
        throw new ValidationError([validatedInput.summary]);
      }

      payload = validatedInput;
    }
  }

  return {
    ip,
    params,
    payload,
    query,
    headers,
    contentType,
    cookies,
    isJson,
    validator: route.validator,
  };
};

const sendResponse = (res: HttpResponse, responseData: ResponseData): void => {
  res.writeStatus(String(responseData.status));
  // if (httpData.isJson) res.writeHeader('content-type', 'application/json');
  res.writeHeader("content-type", "application/json");
  if (responseData.headers.length > 0) setHeaders(res, responseData.headers);
  if (responseData.cookies.size > 0) setCookies(res, responseData.cookies);
  if (corsConfig.enabled) setCorsHeader(res);
  // && responseData.status >= 200 && responseData.status < 300
  if (responseData.payload !== null) {
    // const transformedData = transformBigInts(responseData.payload);
    // res.end(JSON.stringify(transformedData));
    res.end(makeJson(responseData.payload));
  } else res.end(String(responseData.status));
};

// interface State {
//   listenSocket: us_listen_socket | null;
// }

const handleError = (res: HttpResponse, error: unknown): void => {
  logger.error({ err: error }, "Handle Error");

  if (error instanceof ValidationError) {
    res.writeStatus("422");
    res.end(
      JSON.stringify({
        message: "Validation failure",
        messages: error.messages,
      }),
    );
  } else if (error instanceof ParameterValidationError) {
    // Handle parameter validation errors with 400 Bad Request
    res.writeStatus("400");
    res.end(
      JSON.stringify({
        message: "Invalid parameter",
        parameter: error.parameterName,
        value: error.parameterValue,
        error: error.message,
      }),
    );
  } else {
    const errorMessage =
      configApp.env === "prod" || configApp.env === "production"
        ? "Internal server error"
        : String(error);
    res.writeStatus("500");
    res.end(makeJson(errorMessage));
  }
};

// Always point to source types directory, not dist
const projectRoot = process.cwd();
const typesDirectory = path.join(projectRoot, "app/controllers/types");

// Parse types from .d.ts files
let types: Record<string, unknown> = {};
// let mapping: Record<string, string> = {};
if (configApp.docPage) {
  ({ types } = getApiTypesForDocumentation(typesDirectory));
}

const docRoutesHandler = async (
  res: HttpResponse,
  _: HttpRequest,
): Promise<void> => {
  return new Promise((resolve: () => void) => {
    if (
      state['listenSocket'] !== undefined &&
      configApp.docPage &&
      configApp.serveStatic
    ) {
      try {
        // Convert schemas to readable format
        const validationSchemas: Record<string, unknown> = {};

        // for (const key of Object.keys(schemas)) {
        //   validationSchemas[key] = schemas[key]?.doc ?? {};
        // }

        // Serialize routes with handler names instead of function references

        const serializedHttpRoutes = serializeRoutes(httpRoutes);
        const serializedWsRoutes = serializeRoutes(wsRoutes);

        res.cork(() => {
          res.writeStatus(`200`);
          res.writeHeader("content-type", "application/json");
          res.end(
            makeJson({
              httpRoutes: serializedHttpRoutes,
              wsRoutes: serializedWsRoutes,
              validationSchemas,
              responseTypes: types,
              pathPrefix: appConfig.pathPrefix,
            }),
          );
        });
      } catch (err: unknown) {
        console.error(err);
        //   logger.error({ err }, "docRoutesHandler error");
        res.cork(() => {
          handleError(res, err);
        });
      }
    } else {
      // logger.warn("We just refuse if already shutting down");
      res.cork(() => {
        res.writeStatus("404").end(makeJson({ message: "Not found" }));
      });
    }
    resolve();
  });
  //   logger.info("docRoutesHandler");

  //   await new Promise(resolve => setTimeout(resolve, 1));
};

const setHttpHandler = async (
  res: HttpResponse,
  req: HttpRequest,
  route: RouteItem,
): Promise<void> => {
  // logger.info('Handler method:' + route.method + ' url:' + route.url);
  if (state['listenSocket'] !== undefined) {
    try {
      let aborted = false as boolean;
      res.onAborted(() => {
        aborted = true;
      });
      const httpData = await getHttpData(req, res, route);
      const responseData = getResponseData();
      const context = contextHandler(httpData, responseData, route.validator);

      // Check rate limit before executing middleware
      const rateLimitPassed = await checkRateLimit(
        httpData,
        responseData,
        route,
        route.groupRateLimit,
      );

      if (
        rateLimitPassed &&
        (route.middlewares?.length === 0 ||
          (await executeMiddlewares(route.middlewares, context))) &&
        responseData.status >= 200 &&
        responseData.status < 300
      )
        responseData.payload = await route.handler(context);

      if (aborted) return;

      res.cork(() => {
        sendResponse(res, responseData);
      });
    } catch (err: unknown) {
      logger.error({ err }, "Set Http Handler Error");
      res.cork(() => {
        handleError(res, err);
      });
    }
  } else {
    logger.warn("We just refuse if already shutting down");
    res.close();
  }
};

const configureHttp = async (server: TemplatedApp): Promise<void> => {
  //   logger.info("configureHttp get");
  // console.log(getGetRoutes());
  if (appConfig.serveStatic) {
    const staticCache = await cacheStaticSource();
    if (staticCache !== null) {
      staticCache.forEach((value, key) => {
        server.get(key, async (res, req) => {
          await staticCacheHandler(res, req, value);
        });
      });
    }
    // staticRoutes.forEach((route) => {
    //     server.get(route, (res, req) => {
    //         staticIndexHandler(res, req);
    //     });
    // });
  }
  getListRoutes().forEach((route: RouteItem) => {
    if (route.method !== "ws" && route.method !== "delete") {
      server[route.method](
        `/${normalizePath(route.url)}`,
        async (res: HttpResponse, req: HttpRequest) => {
          await setHttpHandler(res, req, route);
        },
      );
    }
  });
  if (configApp.docPage && configApp.serveStatic) {
    server.get(`/${appConfig.pathPrefix}/doc/routes`, async (res, req) => {
      await docRoutesHandler(res, req);
    });
  }

  server.any("/*", (res: HttpResponse, req: HttpRequest): void => {
    const url = req.getUrl();
    const method = req.getMethod();
    if (corsConfig.enabled && method === "options") {
      //'OPTIONS' method === 'OPTIONS'
      res.cork(() => {
        if (corsConfig.enabled) setCorsHeader(res);
        res.writeStatus("200").end();
      });
    } else if (
      url.startsWith(`/${appConfig.pathPrefix}/`) &&
      method !== "options"
    ) {
      res.cork(() => {
        const data = "404 Not Found";
        const statusCode = "404";
        res.writeStatus(statusCode);
        res.end(data);
      });
    } else if (appConfig.serveStatic && method === "get") {
      staticHandler(res, req);
    } else {
      res.cork(() => {
        res.writeStatus("404").end(makeJson({ message: "Not found" }));
      });
    }
  });
};

const setCorsHeader = (res: HttpResponse): void => {
  res.writeHeader("Access-Control-Allow-Origin", corsConfig.origin);
  res.writeHeader("Access-Control-Allow-Methods", corsConfig.methods);
  res.writeHeader("Access-Control-Max-Age", String(corsConfig.maxAge));
  res.writeHeader("Access-Control-Expose-Headers", corsConfig.exposeHeaders);
  res.writeHeader("Access-Control-Allow-Headers", corsConfig.allowHeaders);
  if (corsConfig.credentials) {
    res.writeHeader("Access-Control-Allow-Credentials", "true");
  }
  //   if (corsConfig.headers !== undefined) {
  //     //TODO
  //     // const reqHeaders = req.getHeader('access-control-request-headers');
  //     // res.writeHeader('Access-Control-Allow-Headers', reqHeaders);
  //   }
};
// let server = null;
const initServer = async (): Promise<void> => {
  configureWebsockets(server);
  await configureHttp(server);
  if (appConfig.unixPath !== undefined) {
    server.listen_unix((token: us_listen_socket | false) => {
      if (token !== false) {
        logger.info(`Listening unix socket: ${appConfig.unixPath ?? ""}`);
        state['listenSocket'] = token;
      } else {
        logger.error(
          `Failed to listening unix socket: ${appConfig.unixPath ?? ""}`,
        );
      }
    }, appConfig.unixPath);
  } else {
    server.listen(
      appConfig.host,
      appConfig.port,
      (token: us_listen_socket | false) => {
        if (token !== false) {
          logger.info(
            `Listening http://${appConfig.host}:${String(appConfig.port)}`,
          );
          state['listenSocket'] = token;
        } else {
          logger.error(`Failed to listen to port ${String(appConfig.port)}`);
        }
      },
    );
  }
};

const stopServer = (type = "handle"): void => {
  logger.info(`server stop type: ${type}`);
  closeAllWs()
    .then(() => {
      if (state['listenSocket'] !== undefined)
        uWS.us_listen_socket_close(state['listenSocket']);
      state['listenSocket'] = undefined;
    })
    .catch((error: unknown) => {
      console.error(error);
    });
};

export {
  initServer,
  stopServer,
  broadcastMessage,
  broadcastToChannel,
  getHttpData,
};
