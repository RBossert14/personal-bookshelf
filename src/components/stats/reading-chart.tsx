"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { MonthlyCount } from "@/lib/books/stats";

const config = {
  books: { label: "Books finished", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ReadingChart({ data, animate }: { data: MonthlyCount[]; animate: boolean }) {
  const max = Math.max(...data.map((d) => d.books), 1);

  return (
    <ChartContainer config={config} className="aspect-auto h-52 w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -28 }} barCategoryGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={[0, Math.max(max, 3)]}
          tickCount={Math.min(Math.max(max, 3), 5) + 1}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent hideIndicator />} />
        <Bar
          dataKey="books"
          fill="var(--color-books)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={animate}
          animationDuration={700}
        />
      </BarChart>
    </ChartContainer>
  );
}
