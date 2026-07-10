"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getProfileAction } from "@/app/actions/profile";
import { SignOutForm } from "@/components/auth/SignOutForm";
import { ContactModal } from "@/components/dashboard/ContactModal";
import { useDashboardSummaryOptional } from "@/contexts/DashboardSummaryContext";
import { useImportZone } from "@/contexts/ImportZoneContext";
import { useTutorial } from "@/contexts/TutorialContext";
import { formatAmountForDisplay } from "@/lib/preferences/currency-format";
const ProfileMenuPanel = dynamic(
  () => import("@/components/dashboard/ProfileMenuPanel").then((mod) => mod.ProfileMenuPanel),
  { ssr: false },
);

const SettingsMenuPanel = dynamic(
  () => import("@/components/dashboard/SettingsMenuPanel").then((mod) => mod.SettingsMenuPanel),
  { ssr: false },
);

type AuthenticatedProfileMenuProps = {
  initialDisplayName?: string | null;
  isDemoWorkspace?: boolean;
};

export function AuthenticatedProfileMenu({
  initialDisplayName = null,
  isDemoWorkspace = false,
}: AuthenticatedProfileMenuProps) {
  const demoMode = isDemoWorkspace;
  const { requestTutorial } = useTutorial();
  const { importZoneVisible, toggleImportZone } = useImportZone();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryContext = useDashboardSummaryOptional();
  const summary = summaryContext?.summary ?? null;
  const [displayName, setDisplayName] = useState<string | null>(
    () => (demoMode ? "Démo" : initialDisplayName),
  );
  const [companyName, setCompanyName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (demoMode) {
      setDisplayName("Démo");
      return;
    }

    if (initialDisplayName) {
      setDisplayName(initialDisplayName);
      return;
    }

    let cancelled = false;

    getProfileAction().then((profile) => {
      if (!cancelled) {
        setDisplayName(profile?.prenom?.trim() || null);
        setCompanyName(profile?.nomSociete?.trim() || null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [demoMode, initialDisplayName]);

  useEffect(() => {
    if (!open || demoMode) return;

    let cancelled = false;

    getProfileAction().then((profile) => {
      if (!cancelled) {
        setDisplayName(profile?.prenom?.trim() || null);
        setCompanyName(profile?.nomSociete?.trim() || null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, demoMode]);

  useEffect(() => {
    if (demoMode) {
      setProfileOpen(false);
    }
  }, [demoMode]);

  useEffect(() => {
    if (!open) {
      setProfileOpen(false);
      setSettingsOpen(false);
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setProfileOpen(false);
        setSettingsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (profileOpen || settingsOpen) {
          setProfileOpen(false);
          setSettingsOpen(false);
          return;
        }
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, profileOpen, settingsOpen]);

  useEffect(() => {
    if (!summaryOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSummaryOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [summaryOpen]);

  function toggleProfile() {
    setSettingsOpen(false);
    setProfileOpen((current) => !current);
  }

  function toggleSettings() {
    setProfileOpen(false);
    setSettingsOpen((current) => !current);
  }

  return (
    <>
      <div ref={containerRef} className="relative flex items-center gap-2.5">
        {displayName ? (
          <div className="hidden text-right sm:block">
            <p className="max-w-[12rem] truncate text-sm font-medium text-violet-100/90">
              {displayName}
            </p>
            {companyName ? (
              <p className="max-w-[12rem] truncate text-[11px] text-brand-muted/75">
                {companyName}
              </p>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Menu compte"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/30 bg-[#7C3AED] shadow-sm shadow-violet-900/30 transition-all hover:bg-violet-500"
        >
          <svg
            className="h-5 w-5 text-violet-100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path
              d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {open ? (
          <div
            role="menu"
            className={`absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-brand-card py-1 shadow-xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150 ${
              profileOpen ? "w-64" : "w-56"
            }`}
          >
            <button
              type="button"
              role="menuitem"
              aria-expanded={profileOpen}
              aria-disabled={demoMode}
              disabled={demoMode}
              onClick={demoMode ? undefined : toggleProfile}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                demoMode
                  ? "cursor-default text-brand-muted/45"
                  : profileOpen
                    ? "text-violet-200 hover:bg-white/5 hover:text-white"
                    : "text-brand-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              Modifier son profil
              {!demoMode ? (
                <span className="text-xs text-brand-muted/70">{profileOpen ? "▴" : "▾"}</span>
              ) : null}
            </button>
            {profileOpen && !demoMode ? <ProfileMenuPanel /> : null}

            <button
              type="button"
              role="menuitem"
              aria-expanded={settingsOpen}
              onClick={toggleSettings}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 hover:text-white ${
                settingsOpen ? "text-violet-200" : "text-brand-muted"
              }`}
            >
              Paramètres
              <span className="text-xs text-brand-muted/70">{settingsOpen ? "▴" : "▾"}</span>
            </button>
            {settingsOpen ? <SettingsMenuPanel /> : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setContactOpen(true);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              Contact
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                requestTutorial();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              Tutoriel
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                toggleImportZone();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              {importZoneVisible ? "Masquer l'import" : "Voir l'import"}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setSummaryOpen(true);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              Synthèse
            </button>

            <SignOutForm variant="menu" />
          </div>
        ) : null}
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      {summaryOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Fermer"
                className="absolute inset-0 bg-black/65"
                onClick={() => setSummaryOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="summary-title"
                className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-brand-card p-5 text-center shadow-2xl shadow-black/50"
              >
                <button
                  type="button"
                  aria-label="Fermer la synthèse"
                  onClick={() => setSummaryOpen(false)}
                  className="absolute right-3 top-3 rounded-md px-2 py-1 text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  ×
                </button>

                <div className="px-6">
                  <p
                    id="summary-title"
                    className="text-base font-semibold text-white"
                  >
                    Synthèse
                  </p>
                </div>

                {!summary ? (
                  <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-brand-muted">
                    Aucune donnée à afficher pour le moment.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.08] px-3 py-2 text-center">
                        <p className="text-[11px] uppercase tracking-wide text-emerald-200/75">
                          Montant récupéré
                        </p>
                        <p className="mt-1 text-lg font-semibold text-emerald-100">
                          {formatAmountForDisplay(String(summary.recoveredAmount)) || "0,00 €"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-3 py-2 text-center">
                        <p className="text-[11px] uppercase tracking-wide text-amber-200/75">
                          Montant en attente
                        </p>
                        <p className="mt-1 text-lg font-semibold text-amber-100">
                          {formatAmountForDisplay(String(summary.pendingAmount)) || "0,00 €"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-brand-muted">
                          Payé
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white">
                          {summary.paidCount}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-brand-muted">
                          En cours
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white">
                          {summary.inProgressCount}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-brand-muted">
                          Mails envoyés
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white">
                          {summary.sentRelancesCount}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
