"use client";

import { ArrowDownUpIcon, SearchIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORT_OPTIONS, type LibraryFilters, type SortKey } from "@/lib/books/query";

import { FiltersPopover } from "./filters-popover";

interface LibraryToolbarProps {
  filters: LibraryFilters;
  onFiltersChange: (filters: LibraryFilters) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  genres: string[];
  authors: string[];
}

export function LibraryToolbar({ filters, onFiltersChange, sort, onSortChange, genres, authors }: LibraryToolbarProps) {
  const chips = [
    ...filters.genres.map((genre) => ({
      label: genre,
      remove: () => onFiltersChange({ ...filters, genres: filters.genres.filter((g) => g !== genre) }),
    })),
    ...filters.authors.map((author) => ({
      label: author,
      remove: () => onFiltersChange({ ...filters, authors: filters.authors.filter((a) => a !== author) }),
    })),
    ...(filters.minRating > 0
      ? [{ label: `${filters.minRating}+ stars`, remove: () => onFiltersChange({ ...filters, minRating: 0 }) }]
      : []),
  ];

  return (
    <div role="search" className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <InputGroup className="min-w-[min(100%,16rem)] flex-1 bg-paper">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            className="[&::-webkit-search-cancel-button]:appearance-none"
            aria-label="Search by title or author"
            placeholder="Search by title or author"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => onFiltersChange({ ...filters, search: "" })}>
                <XIcon aria-hidden />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <div className="flex gap-2">
          <FiltersPopover filters={filters} onChange={onFiltersChange} genres={genres} authors={authors} />
          <Select value={sort} onValueChange={(value) => onSortChange(value as SortKey)}>
            <SelectTrigger aria-label="Sort books" className="min-w-40 bg-paper">
              <ArrowDownUpIcon aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <ul aria-label="Active filters" className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li key={chip.label}>
              <Badge variant="secondary" asChild className="h-7 gap-1 pr-1 pl-2.5">
                <button type="button" onClick={chip.remove} aria-label={`Remove filter: ${chip.label}`}>
                  {chip.label}
                  <XIcon aria-hidden />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
