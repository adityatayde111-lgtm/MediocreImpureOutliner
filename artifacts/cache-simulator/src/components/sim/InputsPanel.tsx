import { Play, RotateCcw, Eraser } from 'lucide-react';
import type { Inputs } from '@/lib/simulator';

export interface FormState {
  addressBits: string;
  cacheSize: string;
  blockSize: string;
  associativity: Inputs['associativity'];
  addresses: string;
}

interface Props {
  form: FormState;
  onChange: (f: FormState) => void;
  onRun: () => void;
  onReset: () => void;
  onClear: () => void;
  errors: string[];
}

const field =
  'w-full rounded-md border-2 border-input bg-card px-3 py-2 mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition';

export function InputsPanel({ form, onChange, onRun, onReset, onClear, errors }: Props) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => onChange({ ...form, [k]: v });
  const num = (k: 'addressBits' | 'cacheSize' | 'blockSize', label: string, unit: string) => (
    <div>
      <label htmlFor={`in-${k}`} className="block text-sm font-semibold mb-1">
        {label} <span className="font-normal text-muted-foreground">({unit})</span>
      </label>
      <input
        id={`in-${k}`}
        data-testid={`input-${k}`}
        type="number"
        inputMode="numeric"
        min={1}
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className={field}
        aria-invalid={errors.length > 0}
      />
    </div>
  );
  return (
    <form
      className="rounded-xl border-2 border-foreground bg-card p-4 sm:p-5 space-y-4 shadow-[4px_4px_0_hsl(var(--foreground))]"
      onSubmit={(e) => {
        e.preventDefault();
        onRun();
      }}
      aria-label="Simulation inputs"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {num('addressBits', 'Address width', 'bits')}
        {num('cacheSize', 'Cache size', 'bytes')}
        {num('blockSize', 'Block size', 'bytes')}
        <div>
          <label htmlFor="in-assoc" className="block text-sm font-semibold mb-1">
            Set-assoc. ways
          </label>
          <select
            id="in-assoc"
            data-testid="select-associativity"
            value={form.associativity}
            onChange={(e) => set('associativity', e.target.value as FormState['associativity'])}
            className={field}
          >
            <option value="1">1-way</option>
            <option value="2">2-way</option>
            <option value="4">4-way</option>
            <option value="full">Full</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="in-addresses" className="block text-sm font-semibold mb-1">
          Address sequence <span className="font-normal text-muted-foreground">(decimal, comma separated)</span>
        </label>
        <textarea
          id="in-addresses"
          data-testid="input-addresses"
          rows={2}
          value={form.addresses}
          onChange={(e) => set('addresses', e.target.value)}
          className={field}
          placeholder="0, 4, 8, 0, 16"
          spellCheck={false}
        />
      </div>
      {errors.length > 0 && (
        <ul role="alert" data-testid="validation-errors" className="rounded-md border-2 border-[hsl(var(--miss))] bg-[hsl(var(--miss-bg))] px-3 py-2 text-sm text-[hsl(var(--miss))] font-medium space-y-0.5 list-disc list-inside">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" data-testid="button-run" className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 font-bold hover:-translate-y-0.5 active:translate-y-0 transition">
          <Play className="size-4" /> Run Simulation
        </button>
        <button type="button" data-testid="button-reset" onClick={onReset} className="inline-flex items-center gap-2 rounded-md border-2 border-input bg-card px-4 py-2 font-semibold hover:bg-muted active:scale-95 transition">
          <RotateCcw className="size-4" /> Reset
        </button>
        <button type="button" data-testid="button-clear" onClick={onClear} className="inline-flex items-center gap-2 rounded-md border-2 border-input bg-card px-4 py-2 font-semibold hover:bg-muted active:scale-95 transition">
          <Eraser className="size-4" /> Clear
        </button>
      </div>
    </form>
  );
}
