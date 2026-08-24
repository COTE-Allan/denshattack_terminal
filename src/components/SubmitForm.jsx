import { useEffect, useState } from 'react';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5mb, matches the server-side limit

// generic public submission form; posts multipart to a wordpress rest endpoint that creates a pending post for review
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

  // warn before an accidental close/navigate loses the submission mid-flight
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
      setStatus('success'); // bots that auto-fill every field trip this; pretend it worked
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

      // no content-type header: the browser sets the multipart boundary itself
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
                // plain strings double as value + label; object options let the label differ from the submitted value
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

      {/* hidden from real visitors, only bots that fill every field find it */}
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
