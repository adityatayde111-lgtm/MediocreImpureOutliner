import { binary } from '@/lib/simulator';
import type { CacheLine, SimulationResult } from '@/lib/simulator';

interface Props {
  result: SimulationResult;
  lines: CacheLine[];
  activeLine?: number | null;
  hit?: boolean;
  label: string;
}

export function CacheView({ result, lines, activeLine, hit, label }: Props) {
  const sets: CacheLine[][] = [];
  lines.forEach((l) => {
    (sets[l.set] ||= []).push(l);
  });
  const showSet = result.ways > 1 || result.method !== 'direct';
  return (
    <div className="space-y-1.5" role="table" aria-label={label} data-testid={`cache-${result.method}`}>
      {sets.map((ways, si) => (
        <div key={si} role="row" className="flex items-stretch gap-1.5">
          {showSet && result.sets > 1 && (
            <div className="w-14 shrink-0 rounded-md bg-[hsl(var(--idx))] text-white text-xs font-semibold grid place-items-center" role="rowheader">
              Set {si}
            </div>
          )}
          <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${ways.length}, minmax(0,1fr))` }}>
            {ways.map((l) => {
              const active = activeLine === l.line;
              const empty = l.block === null;
              const tone = active
                ? hit
                  ? 'border-[hsl(var(--hit))] bg-[hsl(var(--hit-bg))]'
                  : 'border-[hsl(var(--miss))] bg-[hsl(var(--miss-bg))]'
                : 'border-border bg-card';
              return (
                <div
                  key={`${l.line}-${l.block}-${active}`}
                  role="cell"
                  className={`rounded-md border-2 px-2 py-1 transition-colors ${tone} ${active ? 'pop' : ''}`}
                  aria-label={`Line ${l.line}: ${empty ? 'empty' : `block ${l.block}, tag ${l.tag}`}`}
                >
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>L{l.line}</span>
                    {active && <span className="font-bold">{hit ? 'hit' : 'fill'}</span>}
                  </div>
                  <div className="mono text-sm font-semibold num">{empty ? '—' : `Blk ${l.block}`}</div>
                  <div className="mono text-[11px] text-[hsl(var(--tag))] truncate">
                    {empty || l.tag === null ? '—' : `tag ${binary(l.tag, result.tagBits)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
