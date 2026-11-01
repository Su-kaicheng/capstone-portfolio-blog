/** Page banner with the single `<h1>` for a route plus optional actions. */
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="border-b border-white/5 bg-gradient-to-b from-ink-900/70 to-transparent">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">{eyebrow}</p>
        )}
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
            {description && (
              <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">{description}</p>
            )}
          </div>
          {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
