/**
 * Small hand-written inline SVG icon set.
 * No icon package is used so the bundle stays lean and no network assets are
 * required. Every icon inherits `currentColor` and is hidden from AT.
 */
const DEFAULT_CLASS = "h-5 w-5";

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function MenuIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowRightIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M20 12H4M11 19l-7-7 7-7" />
    </svg>
  );
}

export function CheckCircleIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function PlusIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PencilIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TrashIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

export function RefreshIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function GitHubIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor" {...props}>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

export function MailIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z" />
      <path d="M4.5 6.5 12 12l7.5-5.5" />
    </svg>
  );
}

export function MapPinIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function CodeIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
    </svg>
  );
}

export function BracesIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M8 4H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1" />
      <path d="M16 4h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

export function ServerIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <rect x="3" y="3" width="18" height="7" rx="2" />
      <rect x="3" y="14" width="18" height="7" rx="2" />
      <path d="M7 6.5h.01M7 17.5h.01" />
    </svg>
  );
}

export function DatabaseIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  );
}

export function GlobeIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z" />
    </svg>
  );
}

export function ShieldCheckIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M12 3l7 3v5.5c0 4.4-3 7.7-7 9.5-4-1.8-7-5.1-7-9.5V6l7-3Z" />
      <path d="M9 11.8l2.1 2.2L15 10" />
    </svg>
  );
}

export function WindIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
      <path d="M3 16h8a2.5 2.5 0 1 1-2.5 2.5" />
    </svg>
  );
}

export function GitBranchIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M6 3v12" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

export function LayersIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 12l9 5 9-5M3 16l9 5 9-5" />
    </svg>
  );
}

export function FileTextIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function InboxIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
      <path d="M2 12h5l2 3h6l2-3h5" />
    </svg>
  );
}

export function UserIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export function LogOutIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function LockIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function AlertCircleIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

export function AlertTriangleIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M12 3 2.5 20.5h19L12 3Z" />
      <path d="M12 9v5M12 17.5h.01" />
    </svg>
  );
}

export function InfoIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5h.01" />
    </svg>
  );
}

export function ClockIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function CalendarIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function SparklesIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M18.5 15l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z" />
    </svg>
  );
}

export function SendIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps} {...props}>
      <path d="M21.5 2.5 11 13" />
      <path d="M21.5 2.5l-6.8 19-3.7-8.5-8.5-3.7 19-6.8Z" />
    </svg>
  );
}

export function SpinnerIcon({ className = DEFAULT_CLASS, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
