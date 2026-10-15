/**
 * Blending between two resolved custom-property values, so a density change
 * can glide frame-by-frame instead of relying on CSS transitions (which run on
 * wall-clock time and would make the frame capture non-deterministic).
 */

const NUMERIC = /^(-?\d*\.?\d+(?:e-?\d+)?)([a-z%]*)$/i;

const parse = (v: string) => {
  const m = NUMERIC.exec(v.trim());
  return m ? { n: Number(m[1]), unit: m[2] } : null;
};

const round = (n: number) => Number(n.toFixed(4));

export const blendValue = (a: string, b: string, p: number): string => {
  if (a === b) return a;
  const pa = parse(a);
  const pb = parse(b);
  if (pa && pb) {
    // A bare 0 adopts the other side's unit (`0` and `0.5rem` are both lengths).
    const unitA = pa.n === 0 && !pa.unit ? pb.unit : pa.unit;
    const unitB = pb.n === 0 && !pb.unit ? pa.unit : pb.unit;
    if (unitA === unitB) return `${round(pa.n + (pb.n - pa.n) * p)}${unitA}`;
  }
  const looksNumeric = (v: string) => parse(v) !== null || v.trim().startsWith("calc(");
  if (looksNumeric(a) && looksNumeric(b)) {
    return `calc(${a} * ${round(1 - p)} + ${b} * ${round(p)})`;
  }
  return p < 0.5 ? a : b;
};

export const blendMaps = (
  a: Readonly<Record<string, string>>,
  b: Readonly<Record<string, string>>,
  p: number,
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const key of Object.keys(a)) {
    if (key in b && a[key] !== b[key]) out[key] = blendValue(a[key], b[key], p);
  }
  return out;
};
