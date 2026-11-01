/** Small pill showing the account role from the API. */
export default function RoleBadge({ role, className = "" }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
        isAdmin
          ? "border-accent-400/40 bg-accent-400/10 text-accent-300"
          : "border-white/15 bg-white/5 text-slate-300"
      } ${className}`}
    >
      {isAdmin ? "Admin" : "Member"}
    </span>
  );
}
