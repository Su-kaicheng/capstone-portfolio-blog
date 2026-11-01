import { useState } from "react";
import { CodeIcon } from "./Icons.jsx";

/**
 * Project artwork: uses the API-provided image when present and falls back to
 * a deterministic gradient derived from the project title (no external asset
 * needed, works for projects created without an imageUrl).
 */
const GRADIENTS = [
  "from-emerald-500/30 via-teal-500/15 to-ink-900",
  "from-teal-500/30 via-emerald-400/15 to-ink-900",
  "from-sky-500/25 via-teal-500/15 to-ink-900",
  "from-cyan-500/25 via-emerald-500/15 to-ink-900",
  "from-emerald-400/20 via-sky-500/20 to-ink-900",
  "from-aqua-400/25 via-emerald-500/15 to-ink-900",
];

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash;
}

export default function ProjectMedia({ title = "", imageUrl = "", className = "" }) {
  const [failed, setFailed] = useState(false);
  const gradient = GRADIENTS[hashString(title) % GRADIENTS.length];
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className={`relative overflow-hidden bg-ink-850 ${className}`}>
      {showImage ? (
        <img
          src={imageUrl}
          alt={`${title || "Project"} preview`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-2 text-white/70">
            <CodeIcon className="h-8 w-8" />
            <span className="max-w-[16rem] px-6 text-center font-mono text-[11px] uppercase tracking-[0.28em]">
              {title || "Project"}
            </span>
          </div>
        </div>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
      />
    </div>
  );
}
