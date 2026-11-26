import { z } from 'zod';

const positiveInt = (field: string) =>
  z.coerce
    .number({ invalid_type_error: `${field} harus berupa angka` })
    .int(`${field} harus bilangan bulat`)
    .positive(`${field} harus bilangan bulat positif`);

// YYYY-MM-DD dan harus tanggal yang benar-benar ada di kalender (mis. 2026-02-30 ditolak).
const calendarDate = (field: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} harus berformat YYYY-MM-DD`)
    .refine((value) => {
      const [y, m, d] = value.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return (
        date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
      );
    }, `${field} bukan tanggal yang valid`);

export const listAuditLogsQuerySchema = z
  .object({
    page: z.coerce
      .number({ invalid_type_error: 'page harus berupa angka' })
      .int('page harus bilangan bulat')
      .min(1, 'page minimal 1')
      .default(1),
    pageSize: z.coerce
      .number({ invalid_type_error: 'pageSize harus berupa angka' })
      .int('pageSize harus bilangan bulat')
      .min(1, 'pageSize minimal 1')
      .max(100, 'pageSize maksimal 100')
      .default(20),
    action: z.string().trim().min(1, 'action tidak boleh kosong').max(50, 'action maksimal 50 karakter').optional(),
    targetTable: z
      .string()
      .trim()
      .min(1, 'targetTable tidak boleh kosong')
      .max(50, 'targetTable maksimal 50 karakter')
      .optional(),
    targetId: positiveInt('targetId').optional(),
    userId: positiveInt('userId').optional(),
    from: calendarDate('from').optional(),
    to: calendarDate('to').optional(),
  })
  // Parameter yang tidak dikenal ditolak 400.
  .strict()
  .superRefine((q, ctx) => {
    // String YYYY-MM-DD bisa dibandingkan langsung secara leksikografis.
    if (q.from && q.to && q.from > q.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['from'],
        message: 'from tidak boleh lebih besar dari to',
      });
    }
  });

export const auditLogIdParamsSchema = z.object({
  id: positiveInt('id'),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
