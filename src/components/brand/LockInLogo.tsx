export function LockInLogo() {
  return (
    <div
      className="flex items-center gap-2.5 font-bold text-xl tracking-tight select-none"
      aria-label="LockIn"
    >
      <svg
        className="w-7 h-7 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 10V8a5 5 0 0 1 10 0v2"
          stroke="#A78BFA"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="5" y="10" width="14" height="11" rx="2" fill="#7C3AED" />
        <circle cx="12" cy="15.5" r="1.5" fill="#EDE9FE" />
        <rect x="11.25" y="15.5" width="1.5" height="3" rx="0.75" fill="#EDE9FE" />
      </svg>
      <span className="bg-gradient-to-r from-brand-accent to-purple-400 bg-clip-text text-transparent">
        LockIn
      </span>
    </div>
  );
}
