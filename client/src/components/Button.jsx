import { Link } from "react-router-dom";
import { SpinnerIcon } from "./Icons.jsx";

const VARIANTS = {
  primary:
    "bg-accent-400 text-ink-950 shadow-[0_10px_30px_-14px_rgba(52,211,153,0.85)] hover:bg-accent-300",
  secondary:
    "border border-white/15 bg-white/5 text-slate-100 hover:border-accent-400/40 hover:bg-white/10",
  ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
  danger:
    "border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/50 hover:bg-rose-500/20",
};

const SIZES = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-4 py-2.5 text-sm",
  lg: "gap-2 px-6 py-3 text-sm sm:text-base",
};

/** Shared button styling so `<button>` and `<Link>` actions look identical. */
export function buttonClasses({ variant = "primary", size = "md", className = "" } = {}) {
  return [
    "inline-flex items-center justify-center rounded-xl font-semibold transition duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
    "disabled:cursor-not-allowed disabled:opacity-60",
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled = false,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <SpinnerIcon className="h-4 w-4" />}
      {children}
    </button>
  );
}

/** A router link styled as a button (keeps navigation client-side). */
export function ButtonLink({ to, variant = "primary", size = "md", className = "", children, ...props }) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}

/** An external link styled as a button (new tab, safe rel attributes). */
export function ExternalButtonLink({ href, variant = "primary", size = "md", className = "", children, ...props }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {children}
    </a>
  );
}
