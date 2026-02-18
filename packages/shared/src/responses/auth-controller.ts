export interface RegisterResponse {
  status: "success" | "error";
  message?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  wsUrl?: string;
}

export interface LoginResponse {
  status: "success" | "error" | "unauthorized";
  message?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  wsUrl?: string;
}

export interface LogoutResponse {
  status: "success" | "error";
  message?: string;
}

export interface LogoutAllResponse {
  status: "success" | "error";
  message?: string;
  deletedCount?: number;
}
