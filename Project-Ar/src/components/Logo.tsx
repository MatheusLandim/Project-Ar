export function Logo({
  variant = "compact",
  className = "",
}: {
  variant?: "compact" | "full";
  className?: string;
}) {
  return (
    <span className={`inline-flex select-none items-center gap-3 ${className}`}>
      <LogoMark className="h-10 w-10 shrink-0" />
      <span className="leading-none">
        <span className="block font-display text-[19px] font-extrabold tracking-tight">
          <span className="text-ink">PROJECT</span>
          <span className="text-brand"> AR</span>
        </span>
        {variant === "full" ? (
          <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.22em] text-ink-faint">
            Um novo mundo de refrigeração
          </span>
        ) : (
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Controle Financeiro
          </span>
        )}
      </span>
    </span>
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {/* telhado da casa */}
      <path
        d="M7 33 L32 13 L57 33"
        className="stroke-brand"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* chaminé */}
      <path
        d="M48 24 V14"
        className="stroke-brand"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* fluxo de ar (lado esquerdo) */}
      <path
        d="M13 37 V47 M18 38 V49 M23 39 V51"
        className="stroke-brand"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* floco de neve centralizado sob o telhado */}
      <g
        className="stroke-ink"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 6 hastes principais */}
        <path d="M32 30 V53" />
        <path d="M22 35.75 L42 47.25" />
        <path d="M42 35.75 L22 47.25" />
        {/* ramos da haste vertical */}
        <path d="M32 34 l-3 3 M32 34 l3 3" />
        <path d="M32 49 l-3 -3 M32 49 l3 -3" />
        {/* ramos das diagonais */}
        <path d="M25.5 37.75 l-0.2 4.2 M25.5 37.75 l4.1 0.6" />
        <path d="M38.5 45.25 l0.2 -4.2 M38.5 45.25 l-4.1 -0.6" />
        <path d="M38.5 37.75 l-4.1 0.6 M38.5 37.75 l0.2 4.2" />
        <path d="M25.5 45.25 l4.1 -0.6 M25.5 45.25 l-0.2 -4.2" />
      </g>
    </svg>
  );
}
