export interface CreateInvitationResponse {
  status: 'success' | 'error';
  message?: string;
  token?: string;
}

export interface GetUserInvitationsResponse {
  status: 'success' | 'error';
  message?: string;
  invitations?: unknown[];
}

export interface UseInvitationResponse {
  status: 'success' | 'error' | 'awaiting';
  message?: string;
}
