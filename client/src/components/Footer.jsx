import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ClockIcon, MapPinIcon, ShieldCheckIcon, SparklesIcon } from "./Icons.jsx";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

function ColumnHeading({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{children}</h2>
  );
}

/** Persistent site footer: brand, quick links, student/course info, year. */
export default function Footer() {
  const { isAuthenticated } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/10 bg-ink-900/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-aqua-400 font-mono text-sm font-bold text-ink-950">
              SK
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-white">Su Kaicheng</span>
              <span className="text-xs text-slate-400">苏楷程</span>
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">
            Full-stack developer building data-driven web applications with React, Node.js,
            Express and MongoDB.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-accent-300">
            <SparklesIcon className="h-3.5 w-3.5" />
            Capstone project · 2026
          </p>
        </div>

        <div>
          <ColumnHeading>Explore</ColumnHeading>
          <ul className="mt-4 space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-slate-400 transition-colors hover:text-accent-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <Link
                  to="/admin"
                  className="text-sm text-slate-400 transition-colors hover:text-accent-300"
                >
                  Admin dashboard
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <ColumnHeading>Student</ColumnHeading>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li>Su Kaicheng (苏楷程)</li>
            <li>Student ID · 24998094</li>
            <li>Web Data Management and Application</li>
          </ul>
        </div>

        <div>
          <ColumnHeading>Availability</ColumnHeading>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
              Replies within two working days
            </li>
            <li className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
              On campus · open to remote
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
              JWT-secured API · role-based access
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {year} Su Kaicheng (苏楷程). All rights reserved.</p>
          <p>Built with React, Node.js, Express & MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
