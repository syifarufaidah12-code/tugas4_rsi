import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, type LoginPayload, type RegisterPayload } from '../api/authApi';
import { setUnauthorizedHandler } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** true selama aplikasi memeriksa token lama lewat GET /auth/me. */
  initializing: boolean;
  /** Pesan bila sesi berakhir karena token ditolak backend (401). */
  sessionMessage: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<User | null>;
  clearSessionMessage: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(tokenStorage.get()));
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // Logout: POST /auth/logout agar backend mencatat audit LOGOUT, lalu token dihapus di client.
  // Kegagalan request logout tidak menghalangi logout di sisi client.
  const logout = useCallback(async () => {
    try {
      if (tokenStorage.get()) await authApi.logout();
    } catch {
      /* abaikan: sesi tetap diakhiri */
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!tokenStorage.get()) {
      setUser(null);
      return null;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      tokenStorage.clear();
      setUser(null);
      return null;
    }
  }, []);

  // Saat aplikasi dibuka: validasi token tersimpan ke GET /auth/me.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    refreshMe().finally(() => setInitializing(false));
  }, [refreshMe]);

  // Bila ada request ber-token yang dibalas 401 -> paksa logout + beri pesan.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStorage.clear();
      setUser(null);
      setSessionMessage('Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    tokenStorage.set(result.token);
    // Ambil ulang profil dari GET /auth/me agar data user berasal dari token yang baru.
    const me = await authApi.me();
    setUser(me);
    setSessionMessage(null);
    return me;
  }, []);

  const register = useCallback((payload: RegisterPayload) => authApi.register(payload), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      sessionMessage,
      login,
      register,
      logout,
      refreshMe,
      clearSessionMessage: () => setSessionMessage(null),
    }),
    [user, initializing, sessionMessage, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
