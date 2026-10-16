import { useMemo, useState } from 'react';
import { DEFAULT_INPUTS, simulateAll, validateInputs } from '@/lib/simulator';
import type { Inputs, SimulationResult } from '@/lib/simulator';
import { InputsPanel, type FormState } from '@/components/sim/InputsPanel';
import { MethodPanel } from '@/components/sim/MethodPanel';
import { Comparison, Definitions } from '@/components/sim/Learn';

const toForm = (i: Inputs): FormState => ({
  addressBits: String(i.addressBits),
  cacheSize: String(i.cacheSize),
  blockSize: String(i.blockSize),
  associativity: i.associativity,
  addresses: i.addresses,
});

function toInputs(f: FormState): { inputs: Inputs; errors: string[] } {
  const errors: string[] = [];
  const parse = (v: string, name: string) => {
    const n = Number(v);
    if (v.trim() === '' || !Number.isFinite(n)) {
      errors.push(`${name} must be a number.`);
      return 0;
    }
    return n;
  };
  const inputs: Inputs = {
    addressBits: parse(f.addressBits, 'Address width'),
    cacheSize: parse(f.cacheSize, 'Cache size'),
    blockSize: parse(f.blockSize, 'Block size'),
    associativity: f.associativity,
    addresses: f.addresses,
  };
  return { inputs, errors };
}

function runSafe(f: FormState): { results: SimulationResult[] | null; errors: string[]; key: string } {
  const { inputs, errors } = toInputs(f);
  if (errors.length) return { results: null, errors, key: '' };
  const v = validateInputs(inputs);
  if (v.length) return { results: null, errors: v, key: '' };
  try {
    return { results: simulateAll(inputs), errors: [], key: JSON.stringify(inputs) };
  } catch (e) {
    return { results: null, errors: [e instanceof Error ? e.message : 'Simulation failed.'], key: '' };
  }
}

export default function Home() {
  const [form, setForm] = useState<FormState>(() => toForm(DEFAULT_INPUTS));
  const initial = useMemo(() => runSafe(toForm(DEFAULT_INPUTS)), []);
  const [results, setResults] = useState<SimulationResult[] | null>(initial.results);
  const [ranKey, setRanKey] = useState(initial.key);
  const [runErrors, setRunErrors] = useState<string[]>([]);

  const live = useMemo(() => {
    const { inputs, errors } = toInputs(form);
    const errs = errors.length ? errors : validateInputs(inputs);
    return { errs, key: errors.length ? '' : JSON.stringify(inputs) };
  }, [form]);

  const stale = results !== null && live.key !== ranKey;
  const shownErrors = live.errs.length && (runErrors.length || stale) ? live.errs : runErrors.length ? runErrors : [];

  const run = () => {
    const r = runSafe(form);
    setRunErrors(r.errors);
    if (r.results) {
      setResults(r.results);
      setRanKey(r.key);
    }
  };
  const reset = () => {
    setForm(toForm(DEFAULT_INPUTS));
    const r = runSafe(toForm(DEFAULT_INPUTS));
    setResults(r.results);
    setRanKey(r.key);
    setRunErrors([]);
  };
  const clear = () => {
    setForm({ ...form, addresses: '' });
    setResults(null);
    setRanKey('');
    setRunErrors([]);
  };

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b-2 border-foreground bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <p className="mono text-xs uppercase tracking-[0.2em] opacity-80">Computer architecture lab</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mt-1">Cache Memory Mapping Simulator</h1>
          <p className="mt-2 max-w-2xl opacity-90">
            Feed in an address stream and watch three cache designs decide, bit by bit, whether each access hits or misses.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-8">
        <InputsPanel form={form} onChange={(f) => { setForm(f); setRunErrors([]); }} onRun={run} onReset={reset} onClear={clear} errors={shownErrors} />

        {stale && (
          <div role="status" data-testid="stale-banner" className="rounded-md border-2 border-[hsl(var(--idx))] bg-[hsl(var(--idx))]/10 px-3 py-2 text-sm font-semibold">
            Inputs changed since the last run. Results below are stale. Press Run Simulation to refresh.
          </div>
        )}

        {results ? (
          <>
            <Comparison results={results} stale={stale} />
            <div className="space-y-6">
              {results.map((r) => (
                <MethodPanel key={r.method} result={r} stale={stale} />
              ))}
            </div>
          </>
        ) : (
          <div data-testid="empty-state" className="rounded-xl border-2 border-dashed border-input bg-card/70 p-10 text-center">
            <div className="mx-auto mb-4 grid grid-cols-4 gap-1.5 w-40" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-6 rounded border-2 border-input" />
              ))}
            </div>
            <h2 className="text-xl font-bold">No results yet</h2>
            <p className="text-muted-foreground mt-1">Enter addresses above, or press Reset for the example, then Run Simulation.</p>
          </div>
        )}

        <Definitions />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground">
        Replacement policy: least recently used within a set. All simulation runs in your browser.
      </footer>
    </div>
  );
}
