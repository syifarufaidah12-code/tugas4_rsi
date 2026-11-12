import axios, { AxiosError } from 'axios';
import type { ApiFailBody, FieldError } from '../types';
import { tokenStorage } from './tokenStorage';

/**
 * Base URL backend diambil dari env (VITE_API_BASE_URL) agar mudah diganti
 * tanpa mengubah kode. Default: http://localhost:3000/api/v1
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/** Satu instance Axios untuk seluruh komunikasi HTTP aplikasi. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** Error yang sudah dinormalisasi agar mudah ditampilkan di UI. */
export class ApiError extends Error {
  status: number; // 0 = error jaringan / server tidak dapat dihubungi
  errors: FieldError[];

  constructor(status: number, message: string, errors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  get isNetwork() {
    return this.status === 0;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }

  /** Ubah daftar error validasi backend menjadi map { field: pesan }. */
  fieldErrors(): Record<string, string> {
    return this.errors.reduce<Record<string, string>>((acc, e) => {
      if (!acc[e.field]) acc[e.field] = e.message;
      return acc;
    }, {});
  }
}

// Listener yang dipanggil saat token ditolak backend (401) -> dipakai AuthContext untuk logout.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// REQUEST interceptor: sisipkan header Authorization: Bearer <token> (mekanisme JWT backend).
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// RESPONSE interceptor: normalisasi semua error menjadi ApiError.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiFailBody>) => {
    // Tidak ada response sama sekali -> error jaringan / CORS / server mati / timeout.
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Permintaan ke server melebihi batas waktu. Coba lagi.'
          : 'Tidak dapat terhubung ke server. Pastikan backend berjalan.';
      return Promise.reject(new ApiError(0, message));
    }

    const { status, data } = error.response;
    const message =
      (data && typeof data === 'object' && data.message) || defaultMessage(status);
    const errors = (data && Array.isArray(data.errors) && data.errors) || [];

    // Token yang dikirim ditolak (kedaluwarsa / tidak valid) -> sesi diakhiri.
    const sentToken = Boolean(error.config?.headers?.Authorization);
    if (status === 401 && sentToken && tokenStorage.get() && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(new ApiError(status, message, errors));
  },
);

function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Data yang dikirim tidak valid.';
    case 401:
      return 'Anda harus login terlebih dahulu.';
    case 403:
      return 'Anda tidak memiliki akses untuk melakukan aksi ini.';
    case 404:
      return 'Data tidak ditemukan.';
    case 409:
      return 'Terjadi konflik data.';
    default:
      return status >= 500 ? 'Terjadi kesalahan pada server.' : `Request gagal (${status}).`;
  }
}

/** Helper untuk mengubah error apa pun menjadi ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return new ApiError(-1, error.message);
  return new ApiError(-1, 'Terjadi kesalahan tak terduga.');
}