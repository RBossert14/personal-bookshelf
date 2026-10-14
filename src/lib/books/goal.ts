import { differenceInCalendarDays, endOfYear, startOfYear } from "date-fns";

const STORAGE_KEY = "bookshelf:v1:goals";

/** Goals are kept per year, so last year's goal stays put when a new year starts. */
type Goals = Record<string, number>;

function readGoals(): Goals {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Goals) : {};
  } catch {
    return {};
  }
}

export function getGoal(year: number): number | undefined {
  const goal = readGoals()[year];
  return typeof goal === "number" && goal > 0 ? goal : undefined;
}

export function setGoal(year: number, goal: number | undefined) {
  const goals = readGoals();
  if (goal) goals[year] = goal;
  else delete goals[year];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // Storage full or blocked: the goal still applies for this visit.
  }
}

export type GoalPace =
  | { status: "done" }
  | { status: "on-track" }
  | { status: "ahead" | "behind"; books: number };

/** Compares books finished so far with where an even pace through the year would be today. */
export function goalPace(finished: number, goal: number, today = new Date()): GoalPace {
  if (finished >= goal) return { status: "done" };
  const elapsed = differenceInCalendarDays(today, startOfYear(today)) + 1;
  const total = differenceInCalendarDays(endOfYear(today), startOfYear(today)) + 1;
  const diff = finished - (goal * elapsed) / total;
  if (diff >= 1) return { status: "ahead", books: Math.round(diff) };
  if (diff <= -1) return { status: "behind", books: Math.round(-diff) };
  return { status: "on-track" };
}
