import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { initials } from "../lib/format.js";
import Button, { ButtonLink } from "./Button.jsx";
import RoleBadge from "./RoleBadge.jsx";
import { CloseIcon, LogOutIcon, MenuIcon } from "./Icons.jsx";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

function desktopNavClass({ isActive }) {
  return `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
  }`;
}

function mobileNavClass({ isActive }) {
  return `rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
  }`;
}

function Brand() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      aria-label="Su Kaicheng — home"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-aqua-400 font-mono text-sm font-bold text-ink-950 shadow-[0_0_24px_-6px_rgba(52,211,153,0.8)]">
        SK
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-white transition-colors group-hover:text-accent-300">
          Su Kaicheng
        </span>
        <span className="text-[11px] text-slate-400">Full-Stack Developer</span>
      </span>
    </Link>
  );
}

function AccountSummary({ user, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-400/15 text-xs font-bold text-accent-300">
        {initials(user?.username)}
      </span>
      <span className="max-w-[9rem] truncate text-sm font-medium text-white">{user?.username}</span>
      <RoleBadge role={user?.role} />
    </div>
  );
}

/**
 * Auth-aware, responsive site header. The small-screen hamburger sheet closes
 * on navigation and on Escape, and exposes the same links/actions as desktop.
 */
export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  const links = isAuthenticated
    ? [...NAV_LINKS, { to: "/admin", label: "Admin" }]
    : NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Brand />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={desktopNavClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <AccountSummary user={user} />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOutIcon className="h-4 w-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink to="/register" size="sm">
                Register
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 md:hidden"
        >
          {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-white/10 bg-ink-950/95 md:hidden">
          <nav aria-label="Mobile" className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-4 sm:px-8">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={mobileNavClass}>
                {link.label}
              </NavLink>
            ))}

            <div className="mt-3 border-t border-white/10 pt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <AccountSummary user={user} className="px-1" />
                  <Button variant="secondary" className="w-full" onClick={handleLogout}>
                    <LogOutIcon className="h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <ButtonLink to="/login" variant="secondary" className="w-full">
                    Log in
                  </ButtonLink>
                  <ButtonLink to="/register" className="w-full">
                    Register
                  </ButtonLink>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
