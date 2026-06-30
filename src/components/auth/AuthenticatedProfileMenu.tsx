"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { signOutAction } from "@/app/actions/auth";
import { getProfileAction } from "@/app/actions/profile";
import { ContactModal } from "@/components/dashboard/ContactModal";
import { useTutorial } from "@/contexts/TutorialContext";
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
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(
    () => (demoMode ? "Démo" : initialDisplayName),
  );
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
          <span className="max-w-[8rem] truncate text-sm font-medium text-violet-100/90 sm:max-w-[12rem]">
            {displayName}
          </span>
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

            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="block w-full px-4 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
              >
                Déconnexion
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
