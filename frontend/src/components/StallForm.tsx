import { useState, type FormEvent, type ReactNode } from 'react';
import { toApiError } from '../api/client';
import type { StallInput } from '../types';
import { Alert } from './StatusViews';

export const CATEGORY_SUGGESTIONS = [
  'Nasi',
  'Mie',
  'Bakso',
  'Kwetiau',
  'Soto',
  'Sate',
  'Western',
  'Minuman',
];

interface Props {
  initial?: StallInput;
  submitLabel: string;
  onSubmit: (input: StallInput) => Promise<void>;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof StallInput, string>>;

/** Validasi sisi client — aturan disamakan dengan createStallBodySchema di backend. */
function validate(values: StallInput): Errors {
  const errors: Errors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Nama warung wajib diisi';
  else if (name.length < 3) errors.name = 'Nama warung minimal 3 karakter';
  else if (name.length > 100) errors.name = 'Nama warung maksimal 100 karakter';
  if ((values.category ?? '').trim().length > 50) errors.category = 'Kategori maksimal 50 karakter';
  if ((values.location ?? '').trim().length > 100) errors.location = 'Lokasi maksimal 100 karakter';
  if ((values.description ?? '').length > 1000)
    errors.description = 'Deskripsi maksimal 1000 karakter';
  return errors;
}

export function StallForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<StallInput>({
    name: initial?.name ?? '',
    category: initial?.category ?? '',
    location: initial?.location ?? '',
    description: initial?.description ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Opsi untuk pengujian: kirim data apa adanya agar terlihat validasi dari backend (HTTP 400).
  const [skipClientValidation, setSkipClientValidation] = useState(false);

  const set = (field: keyof StallInput) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!skipClientValidation) {
      const clientErrors = validate(values);
      setErrors(clientErrors);
      if (Object.keys(clientErrors).length > 0) return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        category: values.category?.trim(),
        location: values.location?.trim(),
        description: values.description,
      });
    } catch (err) {
      const apiError = toApiError(err);
      // Error validasi dari backend (400) dipetakan ke field masing-masing.
      setErrors(apiError.fieldErrors() as Errors);
      setFormError(
        apiError.status > 0 ? `${apiError.message} (HTTP ${apiError.status})` : apiError.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      {formError && (
        <Alert type="error" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      <Field label="Nama warung" required error={errors.name} hint="3–100 karakter">
        <input
          id="name"
          value={values.name}
          onChange={(e) => set('name')(e.target.value)}
          placeholder="Contoh: Warung Bu Tini"
          aria-invalid={!!errors.name}
          disabled={submitting}
        />
      </Field>

      <div className="form-row">
        <Field label="Kategori" error={errors.category} hint="Maks. 50 karakter">
          <input
            id="category"
            list="category-list"
            value={values.category}
            onChange={(e) => set('category')(e.target.value)}
            placeholder="Contoh: Nasi"
            aria-invalid={!!errors.category}
            disabled={submitting}
          />
          <datalist id="category-list">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Lokasi" error={errors.location} hint="Maks. 100 karakter">
          <input
            id="location"
            value={values.location}
            onChange={(e) => set('location')(e.target.value)}
            placeholder="Contoh: Kantin FKIP"
            aria-invalid={!!errors.location}
            disabled={submitting}
          />
        </Field>
      </div>

      <Field
        label="Deskripsi"
        error={errors.description}
        hint={`${(values.description ?? '').length}/1000 karakter`}
      >
        <textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(e) => set('description')(e.target.value)}
          placeholder="Menu andalan, jam buka, dll."
          aria-invalid={!!errors.description}
          disabled={submitting}
        />
      </Field>

      <label className="checkbox muted">
        <input
          type="checkbox"
          checked={skipClientValidation}
          onChange={(e) => setSkipClientValidation(e.target.checked)}
        />
        Lewati validasi frontend (untuk menguji validasi dari backend)
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Batal
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner spinner-sm" aria-hidden="true" /> Menyimpan...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
