import type { SimulationResult } from '@/lib/simulator';

export const BIT_COLORS = {
  tag: 'hsl(var(--tag))',
  index: 'hsl(var(--idx))',
  offset: 'hsl(var(--off))',
};

interface Props {
  result: SimulationResult;
  tagBinary?: string;
  indexBinary?: string;
  offsetBinary?: string;
}

export function BitBreakdown({ result, tagBinary, indexBinary, offsetBinary }: Props) {
  const idxLabel = result.method === 'direct' ? 'Index' : 'Set';
  const parts = [
    { key: 'tag', label: 'Tag', bits: result.tagBits, val: tagBinary, color: BIT_COLORS.tag },
    { key: 'index', label: idxLabel, bits: result.indexBits, val: indexBinary, color: BIT_COLORS.index },
    { key: 'offset', label: 'Offset', bits: result.offsetBits, val: offsetBinary, color: BIT_COLORS.offset },
  ];
  return (
    <div
      className="flex w-full gap-1"
      role="group"
      aria-label={`Address split: ${result.tagBits} tag bits, ${result.indexBits} ${idxLabel.toLowerCase()} bits, ${result.offsetBits} offset bits`}
      data-testid={`bits-${result.method}`}
    >
      {parts.map((p) => (
        <div
          key={p.key}
          className="rounded-md px-2 py-1.5 text-center text-white min-w-0"
          style={{ background: p.color, flex: Math.max(p.bits, 1.4) }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-95">{p.label}</div>
          <div className="mono text-sm font-semibold truncate">{p.val ?? (p.bits === 0 ? '—' : '')}</div>
          <div className="text-[11px] opacity-90">{p.bits} bit{p.bits === 1 ? '' : 's'}</div>
        </div>
      ))}
    </div>
  );
}
