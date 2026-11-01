/**
 * Labelled, accessible form fields.
 * Labels are always linked with `htmlFor`/`id`; validation errors are wired
 * through `aria-describedby` and `aria-invalid`.
 */
export function inputClasses(invalid = false) {
  return [
    "w-full rounded-xl border bg-ink-950/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500",
    "transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
    invalid
      ? "border-rose-400/60 focus:border-rose-400/70 focus:ring-rose-400/30"
      : "border-white/10 hover:border-white/20 focus:border-accent-400/50 focus:ring-accent-400/40",
  ].join(" ");
}

function FieldShell({ id, label, error, hint, required, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
        {required && (
          <span className="ml-0.5 text-accent-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  type = "text",
  error,
  hint,
  required = false,
  className = "",
  ...props
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <input
        id={id}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClasses(Boolean(error))}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  required = false,
  rows = 5,
  className = "",
  ...props
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClasses(Boolean(error))} resize-y leading-relaxed`}
        {...props}
      />
    </FieldShell>
  );
}
