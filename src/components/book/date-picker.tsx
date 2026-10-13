"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay, fromCalendarDay, toCalendarDay } from "@/lib/dates";

interface DatePickerProps {
  id?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  "aria-invalid"?: boolean;
}

/** shadcn's date picker pattern (Popover + Calendar), storing plain calendar days. */
export function DatePicker({ id, value, onChange, placeholder = "Pick a date", ...props }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            aria-invalid={props["aria-invalid"]}
            className="flex-1 justify-start font-normal data-[empty=true]:text-muted-foreground"
            data-empty={!value}
          >
            <CalendarIcon aria-hidden />
            {value ? formatDay(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={value ? fromCalendarDay(value) : undefined}
            defaultMonth={value ? fromCalendarDay(value) : undefined}
            onSelect={(date) => {
              onChange(date ? toCalendarDay(date) : undefined);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon" onClick={() => onChange(undefined)} aria-label="Clear date">
          <XIcon aria-hidden />
        </Button>
      )}
    </div>
  );
}
