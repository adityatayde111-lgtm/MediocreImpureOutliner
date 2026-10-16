import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { binary } from '@/lib/simulator';
import type { SimulationResult } from '@/lib/simulator';
import { BitBreakdown } from './BitBreakdown';
import { CacheView } from './CacheView';

const COLOR: Record<string, string> = {
  direct: 'var(--m-direct)',
  fully: 'var(--m-fully)',
  set: 'var(--m-set)',
};

function Stat({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div className="rounded-md border bg-background/60 px-3 py-2" data-testid={id}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mono text-lg font-semibold num">{value}</div>
    </div>
  );
}

export function MethodPanel({ result, stale }: { result: SimulationResult; stale: boolean }) {
  const [sel, setSel] = useState(0);
  const n = result.steps.length;
  useEffect(() => setSel(0), [result]);
  const step = result.steps[Math.min(sel, n - 1)];
  const color = `hsl(${COLOR[result.method]})`;
  const idxLabel = result.method === 'direct' ? 'Index' : 'Set';
  const th = 'px-2.5 py-2 text-left text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap';
  const td = 'px-2.5 py-2 whitespace-nowrap';

  return (
    <section
      className={`rounded-xl border-2 bg-card overflow-hidden rise transition-opacity ${stale ? 'opacity-60' : ''}`}
      style={{ borderColor: color }}
      aria-labelledby={`h-${result.method}`}
      data-testid={`panel-${result.method}`}
    >
      <header className="px-4 py-3 text-white flex flex-wrap items-center justify-between gap-2" style={{ background: color }}>
        <h3 id={`h-${result.method}`} className="text-xl font-extrabold">{result.name}</h3>
        <span className="mono text-xs bg-white/20 rounded px-2 py-1">
          {result.sets} set{result.sets > 1 ? 's' : ''} x {result.ways} way{result.ways > 1 ? 's' : ''} = {result.lines} lines
        </span>
      </header>

      <div className="p-4 space-y-5">
        <div>
          <h4 className="text-sm font-semibold mb-1.5">Address bits ({result.addressBits} total)</h4>
          <BitBreakdown
            result={result}
            tagBinary={step?.tagBinary}
            indexBinary={step?.indexBinary}
            offsetBinary={step?.offsetBinary}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {step ? `Showing access #${step.step}: address ${step.address}.` : 'Shape only.'} Config: cache {result.cacheSize} B, block {result.blockSize} B, {result.ways}-way.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat id={`hits-${result.method}`} label="Hits" value={String(result.hits)} />
          <Stat id={`misses-${result.method}`} label="Misses" value={String(result.misses)} />
          <Stat id={`hitrate-${result.method}`} label="Hit rate" value={`${result.hitRate.toFixed(1)}%`} />
          <Stat id={`missrate-${result.method}`} label="Miss rate" value={`${result.missRate.toFixed(1)}%`} />
        </div>

        {step && (
          <div className="rounded-lg border bg-background/50 p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="size-8 grid place-items-center rounded-md border-2 border-input bg-card hover:bg-muted disabled:opacity-40 active:scale-95 transition"
                onClick={() => setSel((s) => Math.max(0, s - 1))}
                disabled={sel === 0}
                aria-label="Previous access"
                data-testid={`prev-${result.method}`}
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="flex flex-wrap gap-1 flex-1" role="group" aria-label="Select access step">
                {result.steps.map((s, i) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setSel(i)}
                    aria-pressed={i === sel}
                    aria-label={`Access ${s.step}, address ${s.address}, ${s.hit ? 'hit' : 'miss'}`}
                    data-testid={`step-${result.method}-${s.step}`}
                    className={`mono text-xs h-8 min-w-8 px-1.5 rounded-md border-2 font-semibold transition active:scale-95 ${
                      s.hit
                        ? 'bg-[hsl(var(--hit-bg))] text-[hsl(var(--hit))] border-[hsl(var(--hit))]/50'
                        : 'bg-[hsl(var(--miss-bg))] text-[hsl(var(--miss))] border-[hsl(var(--miss))]/50'
                    } ${i === sel ? 'ring-2 ring-offset-1 ring-foreground' : ''}`}
                  >
                    {s.step}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="size-8 grid place-items-center rounded-md border-2 border-input bg-card hover:bg-muted disabled:opacity-40 active:scale-95 transition"
                onClick={() => setSel((s) => Math.min(n - 1, s + 1))}
                disabled={sel >= n - 1}
                aria-label="Next access"
                data-testid={`next-${result.method}`}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <p className="text-sm" aria-live="polite">
              <span className="font-semibold">Access {step.step}:</span> address <span className="mono">{step.address}</span> is block{' '}
              <span className="mono">{step.block}</span> (tag <span className="mono">{step.tagBinary}</span>, {idxLabel.toLowerCase()}{' '}
              <span className="mono">{step.indexBinary}</span>, offset <span className="mono">{step.offsetBinary}</span>) &rarr;{' '}
              <span className={`font-bold ${step.hit ? 'text-[hsl(var(--hit))]' : 'text-[hsl(var(--miss))]'}`}>
                {step.hit ? 'HIT' : 'MISS'}
              </span>
              {!step.hit && step.evicted !== null && <> and evicts block <span className="mono">{step.evicted}</span></>}.
            </p>
            <CacheView
              result={result}
              lines={step.cache}
              activeLine={step.line}
              hit={step.hit}
              label={`${result.name} cache after access ${step.step}`}
            />
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold mb-1.5">Access log, with cache contents after every access</h4>
          <div className="overflow-x-auto rounded-lg border" tabIndex={0} aria-label={`${result.name} access steps table, scrollable`}>
            <table className="w-full text-sm" data-testid={`table-steps-${result.method}`}>
              <thead className="bg-muted">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Addr</th>
                  <th className={th}>Binary</th>
                  <th className={`${th} text-[hsl(var(--tag))]`}>Tag</th>
                  <th className={`${th} text-[hsl(var(--idx))]`}>{idxLabel}</th>
                  <th className={`${th} text-[hsl(var(--off))]`}>Offset</th>
                  <th className={th}>Result</th>
                  <th className={th}>Line</th>
                  <th className={th}>Evicted</th>
                  <th className={th}>Cache after (line: block)</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((s, i) => (
                  <tr
                    key={s.step}
                    onClick={() => setSel(i)}
                    className={`border-t cursor-pointer transition-colors hover:bg-muted/60 ${i === sel ? 'bg-muted' : ''}`}
                    data-testid={`row-${result.method}-${s.step}`}
                  >
                    <td className={`${td} num`}>{s.step}</td>
                    <td className={`${td} mono num`}>{s.address}</td>
                    <td className={`${td} mono`}>{s.binaryAddress}</td>
                    <td className={`${td} mono text-[hsl(var(--tag))]`}>{s.tagBinary} <span className="text-muted-foreground">({s.tag})</span></td>
                    <td className={`${td} mono text-[hsl(var(--idx))]`}>{s.indexBinary} <span className="text-muted-foreground">({s.index})</span></td>
                    <td className={`${td} mono text-[hsl(var(--off))]`}>{s.offsetBinary}</td>
                    <td className={td}>
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${s.hit ? 'bg-[hsl(var(--hit-bg))] text-[hsl(var(--hit))]' : 'bg-[hsl(var(--miss-bg))] text-[hsl(var(--miss))]'}`}>
                        {s.hit ? 'HIT' : 'MISS'}
                      </span>
                    </td>
                    <td className={`${td} mono num`}>{s.line}</td>
                    <td className={`${td} mono num`}>{s.evicted ?? '—'}</td>
                    <td className={td}>
                      <span className="flex gap-1">
                        {s.cache.map((l) => (
                          <span
                            key={l.line}
                            className={`mono text-[11px] rounded px-1.5 py-0.5 border ${l.line === s.line ? 'border-foreground font-bold bg-card' : 'border-transparent bg-muted'}`}
                          >
                            {l.line}:{l.block ?? '—'}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-1.5">Final cache contents</h4>
          <div className="overflow-x-auto rounded-lg border" tabIndex={0} aria-label={`${result.name} final cache table, scrollable`}>
            <table className="w-full text-sm" data-testid={`table-final-${result.method}`}>
              <thead className="bg-muted">
                <tr>
                  <th className={th}>Line</th>
                  <th className={th}>{idxLabel}</th>
                  <th className={th}>Way</th>
                  <th className={th}>Block</th>
                  <th className={th}>Tag</th>
                  <th className={th}>Last used</th>
                </tr>
              </thead>
              <tbody>
                {result.finalCache.map((l) => (
                  <tr key={l.line} className="border-t">
                    <td className={`${td} mono num`}>{l.line}</td>
                    <td className={`${td} mono num`}>{l.set}</td>
                    <td className={`${td} mono num`}>{l.way}</td>
                    <td className={`${td} mono num`}>{l.block ?? '—'}</td>
                    <td className={`${td} mono text-[hsl(var(--tag))]`}>{l.tag === null ? '—' : binary(l.tag, result.tagBits)}</td>
                    <td className={`${td} mono num`}>{l.lastUsed ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
