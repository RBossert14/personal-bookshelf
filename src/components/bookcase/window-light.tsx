/**
 * The light falling across the back of the bookcase. By day, morning sun through
 * a four-pane cottage window. In evening mode, pale moonlight through the same
 * window and a warm pool from a reading lamp off to the right. Purely decorative.
 */
export function WindowLight() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Broad wash from the window side: warm sun by day, cool moon at night */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,color-mix(in_oklab,var(--sunlight)_40%,transparent),transparent_60%)] dark:hidden" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_12%_0%,color-mix(in_oklab,var(--moonlight)_18%,transparent),transparent_55%)] dark:block" />
      {/* The panes themselves, skewed by the low light and softened */}
      <div className="absolute top-[-8%] left-[6%] grid h-[78%] w-[min(46%,420px)] origin-top-left skew-x-[-24deg] grid-cols-2 gap-[6%] opacity-60 mix-blend-soft-light blur-[6px] sm:left-[14%] dark:opacity-15 dark:mix-blend-screen dark:blur-[10px]">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-sm bg-sunlight dark:bg-moonlight" />
        ))}
      </div>
      {/* Lamplight, only after dark */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_55%_70%_at_96%_100%,color-mix(in_oklab,var(--sunlight)_38%,transparent),transparent_70%)] mix-blend-screen dark:block" />
    </div>
  );
}
