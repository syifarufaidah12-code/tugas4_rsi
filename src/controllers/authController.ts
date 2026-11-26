import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { getValidated } from '../middlewares/validate.ts';
import { getUser } from '../middlewares/auth.ts';
import { sendError } from '../utils/http.ts';
import { getClientInfo } from '../utils/requestContext.ts';
import type { LoginBody, RegisterBody } from '../schemas/authSchema.ts';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  register = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const body = getValidated<RegisterBody>(res, 'body');
      const user = await this.authService.register(body);
      return res.status(201).json({ status: 'success', data: { user } });
    } catch (error) {
      return sendError(res, error);
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = getValidated<LoginBody>(res, 'body');
      const data = await this.authService.login(body, getClientInfo(req));
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return sendError(res, error);
    }
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await this.authService.logout(getUser(res), getClientInfo(req));
      return res.status(200).json({
        status: 'success',
        message: 'Logout berhasil. Hapus token di sisi client.',
        // Hanya informasi; logout tetap sukses walau audit gagal.
        data: { audited: result.audited },
      });
    } catch (error) {
      return sendError(res, error);
    }
  };

  me = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = getUser(res);
      const user = await this.authService.me(id);
      return res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
      return sendError(res, error);
    }
  };
}