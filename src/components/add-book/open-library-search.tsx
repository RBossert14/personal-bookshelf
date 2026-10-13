"use client";

import { BookOpenIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { searchOpenLibrary, type OpenLibraryResult } from "@/lib/open-library";

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; results: OpenLibraryResult[] }
  | { kind: "error" };

function useOpenLibrarySearch(query: string) {
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ kind: "loading" });
      try {
        setState({ kind: "done", results: await searchOpenLibrary(trimmed, controller.signal) });
      } catch (error) {
        if (!controller.signal.aborted) setState({ kind: "error" });
        void error;
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  return trimmed.length < 2 ? ({ kind: "idle" } as const) : state;
}

export function OpenLibrarySearch({ onPick }: { onPick: (result: OpenLibraryResult) => void }) {
  const [query, setQuery] = useState("");
  const state = useOpenLibrarySearch(query);

  return (
    <Command shouldFilter={false} className="rounded-lg border bg-paper" label="Search Open Library">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Type a title, like Piranesi"
        autoFocus
      />
      <CommandList className="max-h-[min(22rem,50dvh)]">
        {state.kind === "idle" && (
          <p className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
            <SearchIcon className="size-4" aria-hidden />
            Results from Open Library will show up here.
          </p>
        )}
        {state.kind === "loading" && (
          <div className="flex flex-col gap-2 p-2" aria-label="Searching Open Library" role="status">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-1">
                <Skeleton className="h-14 w-10" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}
        {state.kind === "error" && (
          <p role="alert" className="px-3 py-6 text-sm">
            Couldn&apos;t reach Open Library. Check your connection and try again, or add the book by hand.
          </p>
        )}
        {state.kind === "done" && (
          <>
            <CommandEmpty>No books found for &ldquo;{query.trim()}&rdquo;. Try fewer words, or add it by hand.</CommandEmpty>
            <CommandGroup heading={`${state.results.length} results`}>
              {state.results.map((result) => (
                <CommandItem key={result.key} value={result.key} onSelect={() => onPick(result)} className="gap-3 py-2">
                  <div className="flex h-14 w-10 flex-none items-center justify-center overflow-hidden rounded-[2px] bg-muted">
                    {result.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.coverUrl.replace("-L.jpg", "-S.jpg")}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <BookOpenIcon className="size-4 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{result.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[result.author, result.year].filter(Boolean).join(", ") || "Unknown author"}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}
