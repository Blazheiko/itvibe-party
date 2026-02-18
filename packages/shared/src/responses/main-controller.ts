export interface PingResponse {
  status: string;
}

export interface TestRouteResponse {
  status: string;
}

export interface InitResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  wsUrl?: string;
}

export interface TestHeadersResponse {
  status: string;
  headers: Array<{ key: string; value: string }>;
  params: unknown[];
}

export interface GetSetCookiesResponse {
  status: string;
  cookies: Array<{ key: string; value: string }>;
}

export interface TestSessionResponse {
  status: string;
  cookies: Array<{ key: string; value: string }>;
  sessionInfo: unknown;
}

export interface SaveUserResponse {
  status: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TestApiSessionResponse {
  status: string;
  headers: Array<{ key: string; value: string }>;
  sessionInfo: unknown;
}

export interface IndexResponse {
  payload: unknown;
  responseData: unknown;
}

export interface TestParamsResponse {
  params: unknown;
  query: string[];
  status: string;
}

export interface SetHeaderAndCookieResponse {
  status: string;
}

export interface TestMiddlewareResponse {
  middlewares: string[];
  status: string;
}

export interface UpdateWsTokenResponse {
  status: string;
  message?: string;
  wsUrl?: string;
}
