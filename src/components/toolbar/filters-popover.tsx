"use client";

import { SlidersHorizontalIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { countActiveFilters, EMPTY_FILTERS, type LibraryFilters } from "@/lib/books/query";

const RATING_STEPS = [
  { value: "0", label: "Any" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
];

interface FiltersPopoverProps {
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
  genres: string[];
  authors: string[];
}

function toggle(list: string[], value: string, on: boolean) {
  return on ? [...list, value] : list.filter((v) => v !== value);
}

function CheckList({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string, on: boolean) => void;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <ScrollArea className="max-h-44">
        <div className="flex flex-col gap-2 pr-3">
          {options.map((option) => {
            const id = `${legend}-${option}`.replace(/\s+/g, "-").toLowerCase();
            return (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={selected.includes(option)}
                  onCheckedChange={(checked) => onToggle(option, checked === true)}
                />
                <Label htmlFor={id} className="font-normal">
                  {option}
                </Label>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </fieldset>
  );
}

export function FiltersPopover({ filters, onChange, genres, authors }: FiltersPopoverProps) {
  const active = countActiveFilters(filters);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontalIcon aria-hidden />
          Filters
          {active > 0 && (
            <Badge className="ml-0.5 h-5 min-w-5 px-1.5 tabular-nums">
              {active}
              <span className="sr-only"> active</span>
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-[min(30rem,calc(100vw-2rem))] flex-col gap-4 p-4">
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckList
            legend="Genre"
            options={genres}
            selected={filters.genres}
            onToggle={(genre, on) => onChange({ ...filters, genres: toggle(filters.genres, genre, on) })}
          />
          <CheckList
            legend="Author"
            options={authors}
            selected={filters.authors}
            onToggle={(author, on) => onChange({ ...filters, authors: toggle(filters.authors, author, on) })}
          />
        </div>
        <Separator />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">My rating</legend>
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(filters.minRating)}
            onValueChange={(value) => onChange({ ...filters, minRating: Number(value || 0) })}
            className="w-full"
          >
            {RATING_STEPS.map((step) => (
              <ToggleGroupItem
                key={step.value}
                value={step.value}
                className="flex-1"
                aria-label={step.value === "0" ? "Any rating" : `${step.value} stars or more`}
              >
                {step.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </fieldset>
        {active > 0 && (
          <Button
            variant="ghost"
            className="self-start"
            onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
          >
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
