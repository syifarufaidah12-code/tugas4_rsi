import {
  MenuItemRepository,
  type FindMenuItemsParams,
} from '../repositories/menuItemRepository.ts';
import type {
  CreateMenuItemInput,
  MenuItemDetailDto,
  UpdateMenuItemInput,
} from '../dtos/menuItemDto.ts';
import { AppError, ForbiddenError } from '../utils/http.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import { AuditLogService } from './auditLogService.ts';
import { getDb } from '../db/index.ts';
import type { AuthUser } from '../middlewares/auth.ts';

type MenuRow = NonNullable<Awaited<ReturnType<MenuItemRepository['findById']>>>;

export class MenuItemService {
  private menuItemRepository: MenuItemRepository;
  private stallRepository: StallRepository;
  private auditLogService: AuditLogService;

  constructor(
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    stallRepository: StallRepository = new StallRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.menuItemRepository = menuItemRepository;
    this.stallRepository = stallRepository;
    this.auditLogService = auditLogService;
  }

  // Warung tujuan harus ada; owner hanya boleh mengelola menu di warung miliknya.
  private async assertCanManageStall(stallId: number, user: AuthUser) {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw new AppError(404, 'Data warung tidak ditemukan');
    if (user.role === 'owner' && stall.ownerId !== user.id) {
      throw new ForbiddenError('Anda hanya boleh mengelola menu di warung milik sendiri');
    }
  }

  private toDto(row: MenuRow): MenuItemDetailDto {
    return {
      id: row.id,
      name: row.name,
      price: row.price,
      isAvailable: Boolean(row.isAvailable),
      stall: {
        id: row.stallId,
        name: row.stallName,
        category: row.stallCategory,
        location: row.stallLocation,
      },
    };
  }

  async getAllMenuItems(params: FindMenuItemsParams) {
    const { rows, total } = await this.menuItemRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getMenuItemById(id: number): Promise<MenuItemDetailDto> {
    const row = await this.menuItemRepository.findById(id);
    if (!row) throw new AppError(404, 'Data menu tidak ditemukan');
    return this.toDto(row);
  }

  // Mutasi menu + audit <ACTION>_MENU ditulis dalam transaksi yang sama.
  async createMenuItem(input: CreateMenuItemInput, user: AuthUser): Promise<MenuItemDetailDto> {
    const db = await getDb();
    const created = await db.transaction(async (tx) => {
      await this.assertCanManageStall(input.stallId, user);
      const row = await this.menuItemRepository.create(input, tx);
      if (!row) throw new AppError(500, 'Gagal membuat menu');
      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'CREATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: row.id,
          metadata: { role: user.role, after: pickMenuFields(row) },
        },
        tx,
      );
      return row;
    });
    return this.getMenuItemById(created.id);
  }

  async updateMenuItem(
    id: number,
    input: UpdateMenuItemInput,
    user: AuthUser,
  ): Promise<MenuItemDetailDto> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      const existing = await this.menuItemRepository.findById(id, tx);
      if (!existing) throw new AppError(404, 'Data menu tidak ditemukan');
      await this.assertCanManageStall(existing.stallId, user);
      if (input.stallId !== undefined && input.stallId !== existing.stallId) {
        await this.assertCanManageStall(input.stallId, user);
      }

      const updated = await this.menuItemRepository.update(id, input, tx);
      if (!updated) throw new AppError(404, 'Data menu tidak ditemukan');

      const before = { ...pickMenuFields(existing) };
      const after = pickMenuFields(updated);
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      for (const key of MENU_FIELDS) {
        if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
      }

      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'UPDATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: { role: user.role, changes },
        },
        tx,
      );
    });
    return this.getMenuItemById(id);
  }

  async deleteMenuItem(id: number, user: AuthUser): Promise<MenuItemDetailDto> {
    const existing = await this.getMenuItemById(id);
    const db = await getDb();
    await db.transaction(async (tx) => {
      await this.assertCanManageStall(existing.stall.id, user);
      const removed = await this.menuItemRepository.remove(id, tx);
      if (!removed) throw new AppError(404, 'Data menu tidak ditemukan');
      await this.auditLogService.record(
        {
          userId: user.id,
          action: 'DELETE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: { role: user.role, before: pickMenuFields(removed) },
        },
        tx,
      );
    });
    return existing;
  }
}

const MENU_FIELDS = ['stallId', 'name', 'price', 'isAvailable'] as const;
type MenuFields = Record<(typeof MENU_FIELDS)[number], unknown>;

function pickMenuFields(row: {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean | number;
}): MenuFields {
  return {
    stallId: row.stallId,
    name: row.name,
    price: row.price,
    isAvailable: Boolean(row.isAvailable),
  };
}
