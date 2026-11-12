import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/StatusViews';

interface LocationState {
  from?: string;
  flash?: string;
  email?: string;
}

export function LoginPage() {
  const { user, login, sessionMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LocationState;

  const [email, setEmail] = useState(state.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sudah login (dan bukan sedang proses submit) -> tidak perlu halaman login.
  if (user && !submitting) return <Navigate to={state.from ?? '/'} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Format email tidak valid';
    if (!password) errs.password = 'Password wajib diisi';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const me = await login({ email: email.trim(), password });
      clearSessionMessage();
      navigate(state.from ?? '/', {
        replace: true,
        state: { flash: `Selamat datang, ${me.name}! Anda login sebagai ${me.role}.` },
      });
    } catch (err) {
      const apiError = toApiError(err);
      setFieldErrors(apiError.fieldErrors());
      // 401 dari backend: "Email atau password salah"
      setError(apiError.status > 0 ? `${apiError.message} (HTTP ${apiError.status})` : apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Masuk</h1>
        <p className="muted">Login untuk mengelola warung sesuai role Anda.</p>

        {sessionMessage && (
          <Alert type="warning" onClose={clearSessionMessage}>
            {sessionMessage}
          </Alert>
        )}
        {state.flash && !error && <Alert type="info">{state.flash}</Alert>}
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className={`field ${fieldErrors.email ? 'field-invalid' : ''}`}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@kantin.test"
            disabled={submitting}
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        <div className={`field ${fieldErrors.password ? 'field-invalid' : ''}`}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner spinner-sm" aria-hidden="true" /> Memproses...
            </>
          ) : (
            'Login'
          )}
        </button>

        <p className="auth-switch">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </form>
    </div>
  );
}
