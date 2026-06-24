"use client";

import { fredoka } from "@/lib/fonts/fredoka";
import { useEffect, useId, useRef, useState } from "react";

type TableauSummary = {
  id: string;
  name: string;
};

type TableauSelectorProps = {
  tableaux: TableauSummary[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddTableau: () => void;
  onConfigure: () => void;
};

export function TableauSelector({
  tableaux,
  activeId,
  onSelect,
  onAddTableau,
  onConfigure,
}: TableauSelectorProps) {
  const gearGradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const activeTableau =
    tableaux.find((tableau) => tableau.id === activeId) ?? tableaux[0];

  useEffect(() => {
    if (!dropdownOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [dropdownOpen]);

  function selectTableau(id: string) {
    onSelect(id);
    setDropdownOpen(false);
    setShowAll(false);
  }

  if (!activeTableau) return null;

  return (
    <section className="mb-6">
      <div ref={containerRef} className="relative inline-block max-w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            className={`${fredoka.className} group text-left text-4xl font-bold leading-none tracking-tight sm:text-5xl`}
          >
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent transition-opacity group-hover:opacity-90">
              {activeTableau.name}
            </span>
          </button>

          <button
            type="button"
            onClick={onConfigure}
            aria-label="Configurer le tableau"
            className="group relative mt-px flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/45 bg-gradient-to-br from-violet-500/45 via-fuchsia-500/35 to-indigo-500/45 shadow-[0_0_14px_rgba(167,139,250,0.28)] transition-all hover:scale-105 hover:border-fuchsia-200/60 hover:shadow-[0_0_18px_rgba(232,121,249,0.38)] sm:h-10 sm:w-10"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <svg
              className="relative h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.688c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.154.43l-.84.688a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.819l1.018-.382c.115-.043.284-.031.45.082.312.22.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.913.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.34.985-.571.166-.115.334-.126.45-.082l1.018.382a1.875 1.875 0 0 0 2.282-.819l.922-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.688c-.095-.078-.17-.229-.154-.43a7.598 7.598 0 0 0 0-1.139c-.016-.2.059-.352.154-.43l.84-.688a1.875 1.875 0 0 0 .432-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.819l-1.018.382c-.115.043-.284.031-.45-.082a7.493 7.493 0 0 0-.985-.57c-.183-.087-.277-.228-.297-.348l-.179-1.071a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                fill={`url(#${gearGradientId})`}
              />
              <defs>
                <linearGradient
                  id={gearGradientId}
                  x1="4"
                  y1="2"
                  x2="20"
                  y2="22"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#ffffff" />
                  <stop offset="0.45" stopColor="#f5d0fe" />
                  <stop offset="1" stopColor="#e9d5ff" />
                </linearGradient>
              </defs>
            </svg>
          </button>
        </div>

        {dropdownOpen ? (
          <div
            role="listbox"
            aria-label="Choisir un tableau"
            className="absolute left-0 top-full z-20 mt-3 min-w-[14rem] overflow-hidden rounded-xl border border-white/10 bg-brand-card py-1 shadow-xl shadow-black/40"
          >
            {tableaux.map((tableau) => (
              <button
                key={tableau.id}
                type="button"
                role="option"
                aria-selected={tableau.id === activeId}
                onClick={() => selectTableau(tableau.id)}
                className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 hover:text-white ${
                  tableau.id === activeId
                    ? "font-medium text-violet-300"
                    : "text-brand-muted"
                }`}
              >
                {tableau.name}
              </button>
            ))}
            <div className="my-1 border-t border-white/10" />
            <button
              type="button"
              onClick={() => {
                onAddTableau();
                setDropdownOpen(false);
                setShowAll(false);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              + Ajouter un tableau
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAll(true);
                setDropdownOpen(false);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              Voir tous
            </button>
          </div>
        ) : null}
      </div>

      {showAll ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tableaux.map((tableau) => (
            <button
              key={tableau.id}
              type="button"
              onClick={() => selectTableau(tableau.id)}
              className={`rounded-2xl border px-5 py-4 text-left transition-all hover:border-violet-400/30 hover:bg-white/[0.03] ${
                tableau.id === activeId
                  ? "border-violet-400/40 bg-violet-400/5"
                  : "border-white/10 bg-brand-card/40"
              }`}
            >
              <span
                className={`${fredoka.className} text-lg font-semibold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent`}
              >
                {tableau.name}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
