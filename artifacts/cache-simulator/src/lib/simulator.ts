/** Byte-addressed, initially empty caches. LRU timestamps update on every access. */
export interface Inputs {
  addressBits: number;
  cacheSize: number;
  blockSize: number;
  associativity: '1' | '2' | '4' | 'full';
  addresses: string;
}

export const DEFAULT_INPUTS: Inputs = {
  addressBits: 8,
  cacheSize: 16,
  blockSize: 4,
  associativity: '2',
  addresses: '0, 4, 8, 0, 16, 0, 4, 20',
};

export interface CacheLine {
  line: number;
  set: number;
  way: number;
  block: number | null;
  tag: number | null;
  lastUsed: number | null;
}

export interface AccessStep {
  step: number;
  address: number;
  binaryAddress: string;
  block: number;
  blockBase: number;
  tag: number;
  index: number;
  offset: number;
  tagBinary: string;
  indexBinary: string;
  offsetBinary: string;
  hit: boolean;
  line: number;
  evicted: number | null;
  cache: CacheLine[];
}

export interface SimulationResult {
  method: 'direct' | 'fully' | 'set';
  name: string;
  ways: number;
  sets: number;
  lines: number;
  tagBits: number;
  indexBits: number;
  offsetBits: number;
  addressBits: number;
  blockSize: number;
  cacheSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  steps: AccessStep[];
  finalCache: CacheLine[];
}

export function binary(value: number, bits: number): string {
  return bits === 0 ? '—' : value.toString(2).padStart(bits, '0');
}

function isPowerOfTwo(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && Number.isInteger(Math.log2(value));
}

export function validateInputs(input: Inputs): string[] {
  const errors: string[] = [];
  const bitsValid = Number.isInteger(input.addressBits) && input.addressBits >= 1 && input.addressBits <= 32;
  if (!bitsValid) errors.push('Main memory address bits must be an integer from 1 to 32.');
  const cacheValid = isPowerOfTwo(input.cacheSize);
  const blockValid = isPowerOfTwo(input.blockSize);
  if (!cacheValid) errors.push('Cache size must be a positive power of two.');
  if (!blockValid) errors.push('Block size must be a positive power of two.');
  if (cacheValid && blockValid) {
    if (input.blockSize > input.cacheSize) errors.push('Block size cannot exceed cache size.');
    const lines = input.cacheSize / input.blockSize;
    if (lines > 256) errors.push('Use at most 256 cache lines to keep step-by-step snapshots readable.');
    if (!['1', '2', '4', 'full'].includes(input.associativity)) {
      errors.push('Choose a supported set associativity.');
    } else if (input.associativity !== 'full' && Number(input.associativity) > lines) {
      errors.push('Associativity cannot exceed the number of cache lines.');
    }
  }
  if (bitsValid && cacheValid && input.cacheSize > 2 ** input.addressBits) {
    errors.push('Cache size cannot exceed the main memory address space.');
  }
  if (!input.addresses.trim()) {
    errors.push('Enter at least one decimal memory address.');
  } else {
    const tokens = input.addresses.split(',').map(token => token.trim());
    if (tokens.length > 512) errors.push('Enter at most 512 addresses per simulation.');
    if (tokens.some(token => !/^\d+$/.test(token) || !Number.isSafeInteger(Number(token)))) {
      errors.push('Use comma-separated nonnegative decimal integers, with no empty entries.');
    } else if (bitsValid && tokens.some(token => Number(token) >= 2 ** input.addressBits)) {
      errors.push(`Addresses must be between 0 and ${2 ** input.addressBits - 1} for ${input.addressBits}-bit memory.`);
    }
  }
  return errors;
}

function simulate(input: Inputs, method: SimulationResult['method']): SimulationResult {
  const lines = input.cacheSize / input.blockSize;
  const ways = method === 'direct' ? 1 : method === 'fully' || input.associativity === 'full'
    ? lines : Number(input.associativity);
  const sets = lines / ways;
  const indexBits = Math.log2(sets);
  const offsetBits = Math.log2(input.blockSize);
  const tagBits = input.addressBits - indexBits - offsetBits;
  const cache: CacheLine[] = Array.from({ length: lines }, (_, line) => ({
    line,
    set: Math.floor(line / ways),
    way: line % ways,
    block: null,
    tag: null,
    lastUsed: null,
  }));
  let hits = 0;
  const steps = input.addresses.split(',').map((token, position): AccessStep => {
    const address = Number(token.trim());
    const block = Math.floor(address / input.blockSize);
    const index = block % sets;
    const tag = Math.floor(block / sets);
    const offset = address % input.blockSize;
    const candidates = cache.slice(index * ways, (index + 1) * ways);
    let selected = candidates.find(line => line.block === block);
    const hit = selected !== undefined;
    let evicted: number | null = null;
    if (hit) {
      hits++;
    } else {
      selected = candidates.find(line => line.block === null)
        ?? candidates.reduce((oldest, line) => (line.lastUsed ?? -1) < (oldest.lastUsed ?? -1) ? line : oldest);
      evicted = selected.block;
      selected.block = block;
      selected.tag = tag;
    }
    // A successful hit and a replacement both make this line most recently used.
    const accessed = selected!;
    accessed.lastUsed = position + 1;
    return {
      step: position + 1,
      address,
      binaryAddress: binary(address, input.addressBits),
      block,
      blockBase: block * input.blockSize,
      tag,
      index,
      offset,
      tagBinary: binary(tag, tagBits),
      indexBinary: binary(index, indexBits),
      offsetBinary: binary(offset, offsetBits),
      hit,
      line: accessed.line,
      evicted,
      cache: cache.map(line => ({ ...line })),
    };
  });
  const misses = steps.length - hits;
  return {
    method,
    name: method === 'direct' ? 'Direct Mapping' : method === 'fully' ? 'Fully Associative Mapping' : 'Set-Associative Mapping',
    ways, sets, lines, tagBits, indexBits, offsetBits,
    addressBits: input.addressBits,
    blockSize: input.blockSize,
    cacheSize: input.cacheSize,
    hits, misses,
    hitRate: hits / steps.length * 100,
    missRate: misses / steps.length * 100,
    steps,
    finalCache: cache.map(line => ({ ...line })),
  };
}

export function simulateAll(input: Inputs): SimulationResult[] {
  const errors = validateInputs(input);
  if (errors.length) throw new Error(errors.join(' '));
  return (['direct', 'fully', 'set'] as const).map(method => simulate(input, method));
}
