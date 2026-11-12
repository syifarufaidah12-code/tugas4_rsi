import type { Role, Stall, User } from '../types';

// Aturan ini MENCERMINKAN aturan backend (stallRouter.ts & stallService.ts).
// Backend tetap menjadi penentu akhir; frontend hanya menyesuaikan tampilan.

/** POST /stalls -> authorize('owner', 'admin') */
export function canCreateStall(user: User | null): boolean {
  return !!user && (user.role === 'admin' || user.role === 'owner');
}

/** PUT /stalls/:id -> admin semua warung, owner hanya warung miliknya. */
export function canEditStall(user: User | null, stall: Stall): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'owner' && stall.ownerId === user.id;
}

/** DELETE /stalls/:id -> authorize('admin') */
export function canDeleteStall(user: User | null): boolean {
  return user?.role === 'admin';
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  owner: 'Owner',
  customer: 'Customer',
};

export const ROLE_ACCESS: Record<Role, string> = {
  admin: 'Dapat menambah, mengubah, dan menghapus semua warung.',
  owner: 'Dapat menambah warung dan mengubah warung milik sendiri.',
  customer: 'Dapat melihat daftar dan detail warung.',
};
