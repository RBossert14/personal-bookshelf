/**
 * Morning sun through a four-pane cottage window, falling at an angle across
 * the back of the bookcase. Purely decorative and static.
 */
export function WindowLight() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Broad warm wash from the window side */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgb(255_214_140/0.32),transparent_60%)]" />
      {/* The panes themselves, skewed by the low sun and softened */}
      <div className="absolute top-[-8%] left-[6%] grid h-[78%] w-[min(46%,420px)] origin-top-left skew-x-[-24deg] grid-cols-2 gap-[6%] opacity-60 mix-blend-soft-light blur-[6px] sm:left-[14%]">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-sm bg-[#ffe7a8]" />
        ))}
      </div>
    </div>
  );
}
