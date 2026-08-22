import { useEffect, useState } from 'react';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB, matches the server-side limit

/**
 * Generic public submission form: POSTs to a WordPress REST endpoint that
 * creates a *pending* post for editorial review. Nothing submitted here
 * goes live without an admin approving it in wp-admin.
 *
 * Always submits as multipart/form-data (via FormData) so text fields and
 * file fields travel in the same request without a separate upload step.
 *
 * Anti-spam is intentionally minimal (no sensitive data involved): a hidden
 * honeypot field real visitors never see, checked both here (fast client
 * bail-out) and, this is the part that actually matters since a bot can
 * always skip the JS and POST straight to the endpoint, server-side too.
 */
export default function SubmitForm({ endpoint, fields, submitLabel = 'Submit' }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.type === 'file' ? null : '']))
  );
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMessage, setErrorMessage] = useState('');

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  // Image uploads can take a while on shared hosting (WordPress resizes them
  // into every registered size server-side), so warn before an accidental
  // close/navigate loses the submission mid-flight.
  useEffect(() => {
    if (status !== 'sending') return;

    function warnBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [status]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (honeypot) {
      // Bots that auto-fill every field trip this. Pretend it worked so
      // they don't learn to skip the field next time.
      setStatus('success');
      return;
    }

    const tooLarge = fields.find(
      (f) => f.type === 'file' && values[f.name] && values[f.name].size > MAX_FILE_BYTES
    );
    if (tooLarge) {
      setErrorMessage(`${tooLarge.label} is too large, max 5MB.`);
      setStatus('error');
      return;
    }

    setStatus('sending');
    try {
      const body = new FormData();
      for (const [name, value] of Object.entries(values)) {
        if (value != null && value !== '') body.append(name, value);
      }

      // No Content-Type header: the browser sets the multipart boundary
      // itself, and overriding it here would break the upload.
      const res = await fetch(endpoint, { method: 'POST', body });
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
    } catch {
      setErrorMessage('Something went wrong. Try again in a moment.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <p className="submit-form__success">Thanks! Your submission is queued for review.</p>;
  }

  return (
    <form className="submit-form" onSubmit={handleSubmit} aria-busy={status === 'sending'}>
      <fieldset className="submit-form__fields" disabled={status === 'sending'}>
      {fields.map((f) => (
        <label key={f.name} className="filter submit-form__field">
          <span className="filter__label">
            {f.label}
            {f.required && ' *'}
          </span>

          {f.type === 'textarea' ? (
            <textarea
              className="filter__input submit-form__textarea"
              value={values[f.name]}
              onChange={(e) => update(f.name, e.target.value)}
              required={f.required}
              maxLength={f.maxLength}
            />
          ) : f.type === 'select' ? (
            <select
              className="filter__select"
              value={values[f.name]}
              onChange={(e) => update(f.name, e.target.value)}
              required={f.required}
            >
              <option value="">Select…</option>
              {f.options.map((o) => {
                // Plain strings double as both value and label (skip levels,
                // difficulty). Object options let a field show a friendlier
                // label than the value actually submitted (e.g. a technique
                // name in the UI, its post ID in the request).
                const { value, label } = typeof o === 'string' ? { value: o, label: o } : o;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          ) : f.type === 'file' ? (
            <input
              className="filter__input submit-form__file"
              type="file"
              accept={f.accept || 'image/*'}
              onChange={(e) => update(f.name, e.target.files?.[0] || null)}
              required={f.required}
            />
          ) : (
            <input
              className="filter__input"
              type={f.type || 'text'}
              value={values[f.name]}
              onChange={(e) => update(f.name, e.target.value)}
              required={f.required}
              maxLength={f.maxLength}
            />
          )}
        </label>
      ))}

      {/* Honeypot: hidden from real visitors via CSS + aria-hidden + a
          negative tab index, so only bots that fill every field find it. */}
      <label className="submit-form__honeypot" aria-hidden="true">
        Leave this field empty
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </label>
      </fieldset>

      <button className="btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Uploading…' : submitLabel}
      </button>

      {status === 'sending' && (
        <p className="submit-form__notice">
          This can take a moment on larger images. Please don't close this page.
        </p>
      )}

      {status === 'error' && <p className="submit-form__error">{errorMessage}</p>}
    </form>
  );
}
