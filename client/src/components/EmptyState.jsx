import { InboxIcon } from "./Icons.jsx";

/** Friendly empty state for lists without any records yet. */
export default function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-ink-900/40 px-6 py-14 text-center ${className}`}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent-300">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && <p className="max-w-md text-sm leading-relaxed text-slate-400">{description}</p>}
      {children && <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
