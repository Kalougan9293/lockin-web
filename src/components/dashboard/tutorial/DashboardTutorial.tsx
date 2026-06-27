"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  TUTORIAL_STEP_COUNT,
  useTutorial,
} from "@/contexts/TutorialContext";

import { DASHBOARD_TUTORIAL_STEPS } from "./tutorial-steps";

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const SPOTLIGHT_PADDING = 6;

function measureTarget(selector: string): SpotlightRect | null {
  const element = document.querySelector(selector);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

function TutorialConfirmDialog({
  onConfirm,
  onDecline,
}: {
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onDecline}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-confirm-title"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-brand-card p-6 shadow-2xl shadow-black/50"
      >
        <p
          id="tutorial-confirm-title"
          className="text-center text-base font-semibold text-white"
        >
          Lancer l&apos;explication rapide ?
        </p>
        <p className="mt-1 text-center text-sm text-brand-muted">Étape 1 / 5</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            Non
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Oui
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TutorialSpotlight({
  rect,
  stepIndex,
  message,
  onNext,
  onClose,
}: {
  rect: SpotlightRect;
  stepIndex: number;
  message: string;
  onNext: () => void;
  onClose: () => void;
}) {
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const popupBelow = rect.top + rect.height + 140 < viewportHeight;
  const popupTop = popupBelow ? rect.top + rect.height + 14 : rect.top - 14;
  const popupTransform = popupBelow ? "translateY(0)" : "translate(-50%, -100%)";

  return createPortal(
    <div className="fixed inset-0 z-[210]">
      <button
        type="button"
        aria-label="Quitter le tutoriel"
        onClick={onClose}
        className="absolute inset-0 bg-black/65"
      />

      <div
        className="pointer-events-none absolute animate-tutorial-ring rounded-xl border-2 border-red-500"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-step-title"
        className="absolute z-10 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-white/15 bg-brand-card p-4 shadow-2xl shadow-black/50"
        style={{
          top: popupTop,
          left: rect.left + rect.width / 2,
          transform: `translateX(-50%) ${popupTransform}`,
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300/90">
          Étape {stepIndex + 1} / {TUTORIAL_STEP_COUNT}
        </p>
        <p
          id="tutorial-step-title"
          className="mt-2 text-sm leading-relaxed text-white/95"
        >
          {message}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-brand-muted transition-colors hover:text-white"
          >
            Quitter
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-brand-accent px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function DashboardTutorial() {
  const { phase, stepIndex, confirmTutorial, declineTutorial, nextStep, cancelTutorial } =
    useTutorial();
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const step = DASHBOARD_TUTORIAL_STEPS[stepIndex];

  useLayoutEffect(() => {
    if (phase !== "running" || !step) {
      setRect(null);
      return;
    }

    function updateRect() {
      const nextRect = measureTarget(step.target);
      setRect(nextRect);
    }

    updateRect();

    const element = document.querySelector(step.target);
    element?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    const resizeObserver =
      element && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateRect)
        : null;
    if (element) resizeObserver?.observe(element);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const retryTimer = window.setTimeout(updateRect, 320);

    return () => {
      window.clearTimeout(retryTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [phase, step, stepIndex]);

  useEffect(() => {
    if (phase !== "running") return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") cancelTutorial();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [phase, cancelTutorial]);

  if (phase === "confirm") {
    return (
      <TutorialConfirmDialog
        onConfirm={confirmTutorial}
        onDecline={declineTutorial}
      />
    );
  }

  if (phase !== "running" || !step || !rect) {
    return null;
  }

  return (
    <TutorialSpotlight
      rect={rect}
      stepIndex={stepIndex}
      message={step.message}
      onNext={nextStep}
      onClose={cancelTutorial}
    />
  );
}
