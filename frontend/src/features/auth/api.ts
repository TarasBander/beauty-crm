import { request } from '../../shared/api/http';
import type { PublicUser } from '../../shared/api/types';

export interface LoginResponse {
  accessToken: string;
  user: PublicUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: (token: string) => request<PublicUser>('/auth/me', { token }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<{ status: string }>('/auth/change-password', {
      method: 'POST',
      token,
      body: { currentPassword, newPassword },
    }),
};
