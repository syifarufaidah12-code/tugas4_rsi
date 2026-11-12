import { api } from './client';
import type { ApiSuccess, LoginResult, User } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  /** POST /auth/register -> akun baru (role customer). */
  async register(payload: RegisterPayload): Promise<User> {
    const res = await api.post<ApiSuccess<{ user: User }>>('/auth/register', payload);
    return res.data.data.user;
  },

  /** POST /auth/login -> token JWT + data user. */
  async login(payload: LoginPayload): Promise<LoginResult> {
    const res = await api.post<ApiSuccess<LoginResult>>('/auth/login', payload);
    return res.data.data;
  },

  /** GET /auth/me -> data user pemilik token. */
  async me(): Promise<User> {
    const res = await api.get<ApiSuccess<{ user: User }>>('/auth/me');
    return res.data.data.user;
  },
};
