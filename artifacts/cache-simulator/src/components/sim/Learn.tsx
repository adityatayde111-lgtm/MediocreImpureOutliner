import type { SimulationResult } from '@/lib/simulator';

const defs: [string, string, string][] = [
  ['Tag', 'Upper address bits stored with a line to identify which memory block it holds.', 'var(--tag)'],
  ['Index / Set', 'Middle bits that choose the line (direct) or set (set-associative) a block may live in.', 'var(--idx)'],
  ['Offset', 'Low bits that pick the byte inside a block. They never affect hit or miss.', 'var(--off)'],
  ['Hit', 'The chosen line or set already holds a valid line with a matching tag.', 'var(--hit)'],
  ['Miss', 'No matching tag, so the block is fetched and may evict another (LRU among a set).', 'var(--miss)'],
];

export function Definitions() {
  return (
    <section aria-labelledby="defs" className="space-y-3">
      <h2 id="defs" className="text-2xl font-extrabold">Vocabulary</h2>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {defs.map(([t, d, c]) => (
          <div key={t} className="rounded-lg border bg-card p-3 border-t-4" style={{ borderTopColor: `hsl(${c})` }}>
            <dt className="font-bold" style={{ color: `hsl(${c})` }}>{t}</dt>
            <dd className="text-sm mt-1 text-muted-foreground">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Comparison({ results, stale }: { results: SimulationResult[]; stale: boolean }) {
  const best = Math.max(...results.map((r) => r.hitRate));
  const th = 'px-3 py-2 text-left text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap';
  return (
    <section aria-labelledby="cmp" className="space-y-3">
      <h2 id="cmp" className="text-2xl font-extrabold">
        Side by side {stale && <span className="text-sm font-semibold text-[hsl(var(--miss))]">(stale)</span>}
      </h2>
      <div className="overflow-x-auto rounded-lg border bg-card" tabIndex={0} aria-label="Method comparison table, scrollable">
        <table className="w-full text-sm" data-testid="table-comparison">
          <thead className="bg-muted">
            <tr>
              {['Method', 'Sets x Ways', 'Tag', 'Index/Set', 'Offset', 'Hits', 'Misses', 'Hit rate'].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.method} className="border-t">
                <td className="px-3 py-2 font-bold whitespace-nowrap" style={{ color: `hsl(var(--m-${r.method}))` }}>{r.name}</td>
                <td className="px-3 py-2 mono">{r.sets} x {r.ways}</td>
                <td className="px-3 py-2 mono">{r.tagBits}</td>
                <td className="px-3 py-2 mono">{r.indexBits}</td>
                <td className="px-3 py-2 mono">{r.offsetBits}</td>
                <td className="px-3 py-2 mono">{r.hits}</td>
                <td className="px-3 py-2 mono">{r.misses}</td>
                <td className="px-3 py-2 mono font-semibold">
                  {r.hitRate.toFixed(1)}%{r.hitRate === best && <span className="ml-2 text-[11px] rounded bg-[hsl(var(--hit-bg))] text-[hsl(var(--hit))] px-1.5 py-0.5">best</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Direct mapped is simplest but conflicts when blocks share an index. Fully associative has no conflicts, only capacity limits, but compares every tag. Set associative sits between: fewer conflicts than direct at modest comparator cost.
      </p>
    </section>
  );
}
