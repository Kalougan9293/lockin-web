import { PLAN_LIMITS } from "@/lib/dashboard/plan-limits";
import { BETA_MAX_IA_IMPORTS_PER_MONTH } from "@/lib/import/import-usage";

export type VigilanceInputs = {
  invoiceCount: number;
  tableCount: number;
  importsIaThisMonth: number;
};

export type VigilanceScore = {
  letter: "A" | "B" | "C" | "D" | "E";
  digit: 1 | 2 | 3 | 4 | 5;
  label: string;
  tooltip: string;
  tone: "ok" | "watch" | "alert";
};

function scoreDataLetter(invoiceCount: number, tableCount: number): VigilanceScore["letter"] {
  const rowRatio = invoiceCount / PLAN_LIMITS.MAX_TOTAL_ROWS;
  const atTableCap = tableCount >= PLAN_LIMITS.MAX_TABLES;
  const nearRowCap = rowRatio >= 0.9;
  const highRowUse = rowRatio >= 0.75;

  if (nearRowCap || (atTableCap && rowRatio >= 0.5)) return "E";
  if (highRowUse || atTableCap) return "D";
  if (rowRatio >= 0.5) return "C";
  if (rowRatio >= 0.25 || tableCount >= 2) return "B";
  return "A";
}

function scoreIaDigit(importsIaThisMonth: number): VigilanceScore["digit"] {
  if (importsIaThisMonth > 50) return 5;
  if (importsIaThisMonth >= 31) return 4;
  if (importsIaThisMonth >= 16) return 3;
  if (importsIaThisMonth >= 6) return 2;
  return 1;
}

function resolveTone(
  letter: VigilanceScore["letter"],
  digit: VigilanceScore["digit"],
): VigilanceScore["tone"] {
  if (letter === "E" || digit >= 5) return "alert";
  if (letter >= "C" || digit >= 3) return "watch";
  return "ok";
}

export function buildVigilanceScore(input: VigilanceInputs): VigilanceScore {
  const letter = scoreDataLetter(input.invoiceCount, input.tableCount);
  const digit = scoreIaDigit(input.importsIaThisMonth);
  const tone = resolveTone(letter, digit);

  const tooltip = [
    `Données ${letter} : ${input.invoiceCount}/${PLAN_LIMITS.MAX_TOTAL_ROWS} lignes, ${input.tableCount}/${PLAN_LIMITS.MAX_TABLES} tableaux`,
    `IA ${digit} : ${input.importsIaThisMonth} import${input.importsIaThisMonth > 1 ? "s" : ""} ce mois (max beta ${BETA_MAX_IA_IMPORTS_PER_MONTH})`,
  ].join(" · ");

  return {
    letter,
    digit,
    label: `${letter}·${digit}`,
    tooltip,
    tone,
  };
}

export function compareVigilanceDesc(a: VigilanceScore, b: VigilanceScore): number {
  const letterScore = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  const aWeight = letterScore[a.letter] * 10 + a.digit;
  const bWeight = letterScore[b.letter] * 10 + b.digit;
  return bWeight - aWeight;
}
