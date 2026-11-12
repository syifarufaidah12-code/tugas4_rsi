import { api } from './client';
import type { ApiSuccess, ListMeta, Stall, StallInput, StallQuery } from '../types';

/** Buang field kosong supaya tidak dikirim sebagai query/body string kosong. */
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}

export const stallApi = {
  /** GET /stalls?search=&category=&page=&limit= (query parameter). */
  async list(query: StallQuery): Promise<{ data: Stall[]; meta: ListMeta }> {
    const res = await api.get<ApiSuccess<Stall[]>>('/stalls', { params: clean(query) });
    return {
      data: res.data.data,
      meta: res.data.meta ?? { page: 1, limit: res.data.data.length, total: res.data.data.length },
    };
  },

  /** GET /stalls/:id (path parameter). */
  async getById(id: number): Promise<Stall> {
    const res = await api.get<ApiSuccess<Stall>>(`/stalls/${id}`);
    return res.data.data;
  },

  /** POST /stalls (request body) — owner & admin. */
  async create(input: StallInput): Promise<Stall> {
    const res = await api.post<ApiSuccess<Stall>>('/stalls', clean(input));
    return res.data.data;
  },

  /** PUT /stalls/:id — admin, atau owner untuk warung miliknya. */
  async update(id: number, input: Partial<StallInput>): Promise<Stall> {
    const res = await api.put<ApiSuccess<Stall>>(`/stalls/${id}`, input);
    return res.data.data;
  },

  /** DELETE /stalls/:id — admin saja. */
  async remove(id: number): Promise<Stall> {
    const res = await api.delete<ApiSuccess<Stall>>(`/stalls/${id}`);
    return res.data.data;
  },
};
