export interface EventTypingResponse {
  status: 'ok' | 'error';
}

export interface ReadMessageResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface IncomingCallResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface AcceptCallResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface DeclineCallResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface WebrtcCallOfferResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface WebrtcCallAnswerResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface WebrtcIceCandidateResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface WebrtcStartCallResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface WebrtcCancelCallResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface WebrtcCallEndResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface WSErrorResponse {
  status: 'error';
  message?: string;
}

export interface TestWsResponse {
  status: 'ok';
  message: string;
}

export interface WSSaveUserResponse {
  status: 'ok';
  user: {
    id: number;
    name: string;
    email: string;
    password?: string;
  };
}
