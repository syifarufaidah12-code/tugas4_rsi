// Tipe data mengikuti DTO backend (src/dtos/*.ts pada backend).

export type Role = 'admin' | 'owner' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Stall {
  id: number;
  ownerId: number;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  avgRating: number;
  reviewCount: number;
  isPopular: boolean;
}

export interface StallInput {
  name: string;
  category?: string;
  location?: string;
  description?: string;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface StallQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

/** Bentuk respons sukses standar backend: { status: 'success', data, meta? } */
export interface ApiSuccess<T> {
  status: 'success';
  data: T;
  meta?: ListMeta;
}

/** Bentuk respons gagal standar backend: { status: 'fail' | 'error', message, errors? } */
export interface ApiFailBody {
  status: 'fail' | 'error';
  message: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface LoginResult {
  token: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: User;
}
