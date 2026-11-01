import { AlertCircleIcon, RefreshIcon } from "./Icons.jsx";
import Button from "./Button.jsx";

/** Error panel with an optional retry action. */
export default function ErrorState({
  title = "Something went wrong",
  message = "The content could not be loaded. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className = "",
  children,
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/5 px-6 py-14 text-center ${className}`}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
        <AlertCircleIcon className="h-6 w-6" />
      </span>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-rose-100/80">{message}</p>
      {(onRetry || children) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RefreshIcon className="h-4 w-4" />
              {retryLabel}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
