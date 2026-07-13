"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { TUTORIAL_STEP_COUNT } from "@/components/dashboard/tutorial/tutorial-steps";

export { TUTORIAL_STEP_COUNT };

type TutorialPhase = "idle" | "confirm" | "running";

type TutorialContextValue = {
  phase: TutorialPhase;
  stepIndex: number;
  requestTutorial: () => void;
  confirmTutorial: () => void;
  declineTutorial: () => void;
  nextStep: () => void;
  cancelTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<TutorialPhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);

  const requestTutorial = useCallback(() => {
    setPhase("confirm");
    setStepIndex(0);
  }, []);

  const confirmTutorial = useCallback(() => {
    setPhase("running");
    setStepIndex(0);
  }, []);

  const declineTutorial = useCallback(() => {
    setPhase("idle");
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((current) => {
      if (current >= TUTORIAL_STEP_COUNT - 1) {
        setPhase("idle");
        return 0;
      }
      return current + 1;
    });
  }, []);

  const cancelTutorial = useCallback(() => {
    setPhase("idle");
    setStepIndex(0);
  }, []);

  const value = useMemo(
    () => ({
      phase,
      stepIndex,
      requestTutorial,
      confirmTutorial,
      declineTutorial,
      nextStep,
      cancelTutorial,
    }),
    [
      phase,
      stepIndex,
      requestTutorial,
      confirmTutorial,
      declineTutorial,
      nextStep,
      cancelTutorial,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial doit être utilisé dans TutorialProvider.");
  }
  return context;
}

export function useTutorialOptional() {
  return useContext(TutorialContext);
}
