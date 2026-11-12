import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/StatusViews';

type Form = { name: string; email: string; password: string; confirm: string };

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<Form>({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: '' }));
  };

  // Aturan disamakan dengan registerBodySchema di backend.
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const name = form.name.trim();
    if (name.length < 3) errs.name = 'Nama minimal 3 karakter';
    else if (name.length > 100) errs.name = 'Nama maksimal 100 karakter';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Format email tidak valid';
    if (form.password.length < 8) errs.password = 'Password minimal 8 karakter';
    else if (form.password.length > 72) errs.password = 'Password maksimal 72 karakter';
    if (form.confirm !== form.password) errs.confirm = 'Konfirmasi password tidak sama';
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const created = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/login', {
        replace: true,
        state: {
          email: created.email,
          flash: `Registrasi berhasil! Akun ${created.email} (role: ${created.role}) sudah dibuat. Silakan login.`,
        },
      });
    } catch (err) {
      const apiError = toApiError(err);
      setFieldErrors(apiError.fieldErrors());
      // Mis. 409 "Email sudah terdaftar" atau 400 validasi gagal.
      setError(apiError.status > 0 ? `${apiError.message} (HTTP ${apiError.status})` : apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Daftar Akun</h1>
        <p className="muted">Akun baru otomatis terdaftar sebagai Customer.</p>

        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <InputField
          id="name"
          label="Nama lengkap"
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name}
          disabled={submitting}
          autoComplete="name"
        />
        <InputField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
          disabled={submitting}
          autoComplete="email"
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
          hint="8–72 karakter"
          disabled={submitting}
          autoComplete="new-password"
        />
        <InputField
          id="confirm"
          label="Konfirmasi password"
          type="password"
          value={form.confirm}
          onChange={set('confirm')}
          error={fieldErrors.confirm}
          disabled={submitting}
          autoComplete="new-password"
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner spinner-sm" aria-hidden="true" /> Mendaftarkan...
            </>
          ) : (
            'Daftar'
          )}
        </button>

        <p className="auth-switch">
          Sudah punya akun? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

function InputField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className={`field ${props.error ? 'field-invalid' : ''}`}>
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        autoComplete={props.autoComplete}
      />
      {props.error ? (
        <span className="field-error">{props.error}</span>
      ) : (
        props.hint && <span className="field-hint">{props.hint}</span>
      )}
    </div>
  );
}
