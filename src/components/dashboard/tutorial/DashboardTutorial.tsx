"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  DASHBOARD_TUTORIAL_STEPS,
  TUTORIAL_STEP_COUNT,
} from "@/components/dashboard/tutorial/tutorial-steps";
import { useTutorial } from "@/contexts/TutorialContext";

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const SPOTLIGHT_PADDING = 6;
const POPUP_ESTIMATED_HEIGHT = 196;
const VIEWPORT_MARGIN = 16;
const TUTORIAL_SCROLL_SPACER_ID = "lockin-tutorial-scroll-spacer";
const TUTORIAL_SCROLL_SPACER_HEIGHT = "min(42vh, 360px)";

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

function computePopupPosition(rect: SpotlightRect) {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const popupWidth = Math.min(320, viewportWidth - VIEWPORT_MARGIN * 2);

  const spaceBelow = viewportHeight - (rect.top + rect.height) - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;

  let top: number;
  if (spaceBelow >= POPUP_ESTIMATED_HEIGHT) {
    top = rect.top + rect.height + 14;
  } else if (spaceAbove >= POPUP_ESTIMATED_HEIGHT) {
    top = rect.top - POPUP_ESTIMATED_HEIGHT - 14;
  } else {
    top = viewportHeight - POPUP_ESTIMATED_HEIGHT - VIEWPORT_MARGIN;
  }

  top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(top, viewportHeight - POPUP_ESTIMATED_HEIGHT - VIEWPORT_MARGIN),
  );

  let left = rect.left + rect.width / 2;
  const halfWidth = popupWidth / 2;
  left = Math.max(
    halfWidth + VIEWPORT_MARGIN,
    Math.min(left, viewportWidth - halfWidth - VIEWPORT_MARGIN),
  );

  return { top, left, width: popupWidth };
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
          Lancer le tutoriel ?
        </p>
        <p className="mt-1 text-center text-sm text-brand-muted">
          Étape 1 / {TUTORIAL_STEP_COUNT}
        </p>
        <p className="mt-1 text-center text-xs text-brand-muted/80">
          Durée estimée : ~1 minute
        </p>
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
  showSpotlight = true,
  stepIndex,
  message,
  isLastStep = false,
  onNext,
  onClose,
}: {
  rect: SpotlightRect;
  showSpotlight?: boolean;
  stepIndex: number;
  message: string;
  isLastStep?: boolean;
  onNext: () => void;
  onClose: () => void;
}) {
  const popupPosition = useMemo(() => computePopupPosition(rect), [rect]);

  return createPortal(
    <div className="fixed inset-0 z-[210] pointer-events-none">
      <button
        type="button"
        aria-label="Quitter le tutoriel"
        onClick={onClose}
        className="pointer-events-auto absolute inset-0 bg-black/65"
      />

      {showSpotlight ? (
        <div
          className="pointer-events-none absolute animate-tutorial-ring rounded-xl border-2 border-violet-400/90"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-step-title"
        className="pointer-events-auto fixed z-10 rounded-xl border border-white/15 bg-brand-card p-4 shadow-2xl shadow-black/50"
        style={{
          top: popupPosition.top,
          left: popupPosition.left,
          width: popupPosition.width,
          transform: "translateX(-50%)",
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
            {isLastStep ? "Terminer" : "Suivant"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ensureTutorialScrollSpacer() {
  if (document.getElementById(TUTORIAL_SCROLL_SPACER_ID)) return;

  const spacer = document.createElement("div");
  spacer.id = TUTORIAL_SCROLL_SPACER_ID;
  spacer.setAttribute("aria-hidden", "true");
  spacer.style.height = TUTORIAL_SCROLL_SPACER_HEIGHT;
  spacer.style.pointerEvents = "none";
  document.body.appendChild(spacer);
}

function removeTutorialScrollSpacer() {
  document.getElementById(TUTORIAL_SCROLL_SPACER_ID)?.remove();
}

export function DashboardTutorial() {
  const { phase, stepIndex, confirmTutorial, declineTutorial, nextStep, cancelTutorial } =
    useTutorial();
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const step = DASHBOARD_TUTORIAL_STEPS[stepIndex];

  function getFallbackRect(): SpotlightRect {
    const width = Math.min(360, window.innerWidth - VIEWPORT_MARGIN * 2);
    const top = Math.max(80, Math.round(window.innerHeight * 0.4));
    return {
      top,
      left: Math.max(VIEWPORT_MARGIN, (window.innerWidth - width) / 2),
      width,
      height: 1,
    };
  }

  useLayoutEffect(() => {
    if (phase !== "running" || !step) {
      setRect(null);
      return;
    }

    if (step.spotlight === false || !step.target) {
      setRect(getFallbackRect());
      return;
    }

    ensureTutorialScrollSpacer();

    function updateRect() {
      const nextRect = measureTarget(step.target!);
      setRect(nextRect);
    }

    function scrollTargetIntoView() {
      const element = document.querySelector(step.target!);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const topSafe = VIEWPORT_MARGIN + 40;
      const bottomSafe = viewportHeight - 220;
      const alreadyVisible =
        rect.top >= topSafe &&
        rect.bottom <= bottomSafe &&
        rect.height <= viewportHeight * 0.75;

      if (alreadyVisible) return;

      element.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }

    updateRect();
    scrollTargetIntoView();

    const element = document.querySelector(step.target!);
    const resizeObserver =
      element && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateRect)
        : null;
    if (element) resizeObserver?.observe(element);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const retryTimers = [
      window.setTimeout(updateRect, 280),
      window.setTimeout(() => {
        scrollTargetIntoView();
        updateRect();
      }, 520),
    ];

    return () => {
      for (const timer of retryTimers) window.clearTimeout(timer);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [phase, step, stepIndex]);

  useEffect(() => {
    if (phase === "confirm") {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (phase === "running") {
      function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape") cancelTutorial();
      }

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        removeTutorialScrollSpacer();
      };
    }

    removeTutorialScrollSpacer();
    return undefined;
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
      showSpotlight={step.spotlight !== false}
      stepIndex={stepIndex}
      message={step.message}
      isLastStep={stepIndex === TUTORIAL_STEP_COUNT - 1}
      onNext={nextStep}
      onClose={cancelTutorial}
    />
  );
}
