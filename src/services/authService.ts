import { UserRepository } from '../repositories/userRepository.ts';
import { AppError, UnauthorizedError } from '../utils/http.ts';
import { hashPassword, verifyPassword } from '../utils/password.ts';
import { signToken } from '../utils/token.ts';
import type { LoginBody, RegisterBody } from '../schemas/authSchema.ts';
import { AuditLogService } from './auditLogService.ts';
import type { ClientInfo } from '../utils/requestContext.ts';
import type { AuthUser } from '../middlewares/auth.ts';

export class AuthService {
  private userRepository: UserRepository;
  private auditLogService: AuditLogService;

  constructor(
    userRepository: UserRepository = new UserRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.userRepository = userRepository;
    this.auditLogService = auditLogService;
  }

  // Register publik: role SELALU 'customer'. Role tidak pernah dibaca dari body.
  async register(input: RegisterBody) {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new AppError(409, 'Email sudah terdaftar');

    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
      role: 'customer',
    });
    if (!row) throw new AppError(500, 'Gagal membuat akun');

    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }

  async login(input: LoginBody, client: ClientInfo) {
    const user = await this.userRepository.findAuthByEmail(input.email);

    // Pesan sengaja sama untuk email salah dan password salah.
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      // Login gagal tetap diaudit (result: failed) bila akunnya ada.
      // Email yang tidak terdaftar tidak bisa dicatat karena user_id wajib merujuk ke USERS.
      if (user) {
        await this.auditLogService.recordBestEffort({
          userId: user.id,
          action: 'LOGIN',
          targetTable: 'USERS',
          targetId: user.id,
          metadata: { role: user.role, result: 'failed', reason: 'invalid_password' },
          ...client,
        });
      }
      throw new UnauthorizedError('Email atau password salah');
    }

    const token = signToken({ id: user.id, role: user.role });

    // Best-effort: kegagalan audit tidak menggagalkan login.
    await this.auditLogService.recordBestEffort({
      userId: user.id,
      action: 'LOGIN',
      targetTable: 'USERS',
      targetId: user.id,
      metadata: { role: user.role, result: 'success' },
      ...client,
    });
    return {
      token,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  /**
   * Logout untuk JWT stateless: token dihapus di client, backend mencatat audit LOGOUT.
   * Audit bersifat best-effort, jadi logout selalu berhasil walau audit gagal ditulis.
   */
  async logout(user: AuthUser, client: ClientInfo) {
    const audited = await this.auditLogService.recordBestEffort({
      userId: user.id,
      action: 'LOGOUT',
      targetTable: 'USERS',
      targetId: user.id,
      metadata: { role: user.role, result: 'success' },
      ...client,
    });
    return { loggedOut: true, audited };
  }

  async me(userId: number) {
    const row = await this.userRepository.findById(userId);
    if (!row) throw new UnauthorizedError('Akun tidak ditemukan');
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }
}