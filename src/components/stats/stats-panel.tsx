"use client";

import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import type { ReadingStats } from "@/lib/books/stats";

import { ReadingChart } from "./reading-chart";

const number = new Intl.NumberFormat();

export function StatsPanel({ stats }: { stats: ReadingStats }) {
  const [ref, inView] = useInView<HTMLElement>();
  const reducedMotion = usePrefersReducedMotion();

  const tiles = [
    { value: number.format(stats.booksThisYear), label: stats.booksThisYear === 1 ? "book finished" : "books finished" },
    { value: number.format(stats.pagesThisYear), label: "pages read" },
    { value: stats.favoriteGenre ?? "Not yet", label: "favorite genre", text: true },
  ];

  return (
    <section
      ref={ref}
      data-in-view={inView}
      aria-labelledby="stats-heading"
      className="reveal-on-scroll grid gap-8 rounded-lg border border-border/80 bg-paper p-5 shadow-[0_1px_0_rgb(255_255_255/0.6)_inset] sm:p-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
    >
      <div className="flex flex-col gap-5">
        <h2 id="stats-heading" className="font-serif text-2xl tracking-[-0.01em]">
          Reading in {stats.year}
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
          {tiles.map((tile) => (
            <div key={tile.label} className={tile.text ? "col-span-2 flex flex-col" : "flex flex-col"}>
              <dt className="text-sm text-muted-foreground">{tile.label}</dt>
              <dd className="order-first font-serif text-3xl leading-tight tabular-nums">{tile.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <figure className="flex min-w-0 flex-col gap-3">
        <figcaption className="text-sm font-medium">Books finished each month</figcaption>
        {inView && <ReadingChart data={stats.monthly} animate={!reducedMotion} />}
        {!inView && <div className="h-52" />}
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer rounded-sm hover:text-foreground">Show as a table</summary>
          <table className="mt-2 w-full max-w-xs text-left tabular-nums">
            <thead>
              <tr>
                <th className="py-1 font-medium">Month</th>
                <th className="py-1 text-right font-medium">Books</th>
              </tr>
            </thead>
            <tbody>
              {stats.monthly.map((row) => (
                <tr key={row.month} className="border-t">
                  <td className="py-1">{row.month}</td>
                  <td className="py-1 text-right">{row.books}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>
    </section>
  );
}
