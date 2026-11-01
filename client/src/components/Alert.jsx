import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "./Icons.jsx";

const TONES = {
  error: {
    wrapper: "border-rose-400/30 bg-rose-500/10 text-rose-50",
    icon: AlertCircleIcon,
    iconClass: "text-rose-300",
  },
  success: {
    wrapper: "border-emerald-400/30 bg-emerald-400/10 text-emerald-50",
    icon: CheckCircleIcon,
    iconClass: "text-emerald-300",
  },
  warning: {
    wrapper: "border-amber-400/30 bg-amber-500/10 text-amber-50",
    icon: AlertTriangleIcon,
    iconClass: "text-amber-300",
  },
  info: {
    wrapper: "border-sky-400/30 bg-sky-500/10 text-sky-50",
    icon: InfoIcon,
    iconClass: "text-sky-300",
  },
};

/** Inline feedback banner used by every form and the dashboard. */
export default function Alert({ tone = "info", title, children, className = "" }) {
  const toneConfig = TONES[tone] ?? TONES.info;
  const Icon = toneConfig.icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${toneConfig.wrapper} ${className}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${toneConfig.iconClass}`} />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-[13px] leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}
