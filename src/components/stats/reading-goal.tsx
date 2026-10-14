"use client";

import { TargetIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { getGoal, goalPace, setGoal, type GoalPace } from "@/lib/books/goal";

function describePace(pace: GoalPace) {
  switch (pace.status) {
    case "done":
      return "Goal reached. Anything more is a bonus.";
    case "on-track":
      return "Right on pace.";
    case "ahead":
      return `${pace.books} ${pace.books === 1 ? "book" : "books"} ahead of pace.`;
    case "behind":
      return `${pace.books} ${pace.books === 1 ? "book" : "books"} behind pace.`;
  }
}

/** A yearly target for books finished. Only rendered in the browser, so it can read localStorage directly. */
export function ReadingGoal({ year, finished }: { year: number; finished: number }) {
  const [goal, setGoalState] = useState(() => getGoal(year));
  const [open, setOpen] = useState(false);

  const save = (next: number | undefined) => {
    setGoal(year, next);
    setGoalState(next);
    setOpen(false);
  };

  const editor = (
    <PopoverContent align="start" className="w-64 p-4">
      <GoalForm year={year} initial={goal} onSave={save} />
    </PopoverContent>
  );

  if (!goal) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="self-start">
            <TargetIcon aria-hidden />
            Set a {year} reading goal
          </Button>
        </PopoverTrigger>
        {editor}
      </Popover>
    );
  }

  const percent = Math.min(100, Math.round((finished / goal) * 100));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm">
          <span className="font-serif text-xl tabular-nums">{finished}</span>
          <span className="text-muted-foreground tabular-nums"> of {goal} books</span>
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="link" className="h-auto p-0 text-sm text-muted-foreground underline">
              Edit goal
            </Button>
          </PopoverTrigger>
          {editor}
        </Popover>
      </div>
      <Progress
        value={percent}
        aria-label={`${year} reading goal: ${finished} of ${goal} books`}
        className="h-2.5 bg-oak-light/30"
        indicatorClassName="bg-sage"
      />
      <p className="text-sm text-muted-foreground">{describePace(goalPace(finished, goal))}</p>
    </div>
  );
}

function GoalForm({
  year,
  initial,
  onSave,
}: {
  year: number;
  initial: number | undefined;
  onSave: (goal: number | undefined) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(initial?.toString() ?? "");
  const [error, setError] = useState("");

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const goal = Number(value);
        if (!Number.isInteger(goal) || goal < 1 || goal > 1000) {
          setError("Use a number of books, like 24.");
          return;
        }
        onSave(goal);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          Books to finish in {year}
        </label>
        <Input
          id={id}
          inputMode="numeric"
          autoFocus
          value={value}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
        />
        {error && (
          <p id={`${id}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex justify-between gap-2">
        {initial ? (
          <Button type="button" variant="ghost" onClick={() => onSave(undefined)}>
            Remove goal
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
