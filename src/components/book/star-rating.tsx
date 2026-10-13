"use client";

import { StarIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const STARS = [1, 2, 3, 4, 5];

function Star({ fill, className }: { fill: number; className?: string }) {
  return (
    <span className={cn("relative inline-block size-5 shrink-0", className)}>
      <StarIcon className="absolute inset-0 size-full fill-transparent text-oak-deep/40" strokeWidth={1.5} />
      <StarIcon
        className="absolute inset-0 size-full fill-marigold text-[#c98a2b]"
        strokeWidth={1.5}
        style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
      />
    </span>
  );
}

function fillFor(star: number, value: number) {
  return Math.min(Math.max(value - (star - 1), 0), 1);
}

export function describeRating(value?: number) {
  return value ? `${value} out of 5 stars` : "Not rated";
}

export function StarRating({ value, className }: { value?: number; className?: string }) {
  return (
    <span role="img" aria-label={describeRating(value)} className={cn("inline-flex gap-0.5", className)}>
      {STARS.map((star) => (
        <Star key={star} fill={fillFor(star, value ?? 0)} />
      ))}
    </span>
  );
}

/**
 * Half-star rating control. It behaves like a slider for keyboard and screen
 * reader users (arrow keys step by half a star) and like stars for pointers.
 */
export function StarRatingInput({
  value,
  onChange,
  id,
  "aria-labelledby": labelledBy,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
  id?: string;
  "aria-labelledby"?: string;
}) {
  const [preview, setPreview] = useState<number | null>(null);
  const current = value ?? 0;
  const shown = preview ?? current;

  const set = (next: number) => {
    const clamped = Math.min(Math.max(Math.round(next * 2) / 2, 0), 5);
    onChange(clamped === 0 ? undefined : clamped);
  };

  const valueFromPointer = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    return Math.max(0.5, Math.ceil(ratio * 10) / 2);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const steps: Record<string, number> = {
      ArrowRight: current + 0.5,
      ArrowUp: current + 0.5,
      ArrowLeft: current - 0.5,
      ArrowDown: current - 0.5,
      Home: 0,
      End: 5,
      Delete: 0,
      Backspace: 0,
    };
    if (event.key in steps) {
      event.preventDefault();
      set(steps[event.key]);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span
        id={id}
        role="slider"
        tabIndex={0}
        aria-labelledby={labelledBy}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={current}
        aria-valuetext={describeRating(value)}
        onKeyDown={onKeyDown}
        onPointerMove={(e) => e.pointerType === "mouse" && setPreview(valueFromPointer(e))}
        onPointerLeave={() => setPreview(null)}
        onClick={(e) => {
          const next = valueFromPointer(e as unknown as React.PointerEvent<HTMLElement>);
          set(next === current ? 0 : next);
        }}
        className="inline-flex cursor-pointer gap-1 rounded-md p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {STARS.map((star) => (
          <Star key={star} fill={fillFor(star, shown)} className="size-7" />
        ))}
      </span>
      <span className="text-sm text-muted-foreground tabular-nums" aria-hidden>
        {shown ? `${shown} / 5` : "Not rated"}
      </span>
    </div>
  );
}
