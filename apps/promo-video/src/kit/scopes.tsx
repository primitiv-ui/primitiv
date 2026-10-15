import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { blendMaps } from "@lib/blend";
import violet from "../data/theme-7c3aed.css?raw";
import pink from "../data/theme-e11d74.css?raw";
import orange from "../data/theme-ea6c0a.css?raw";
import teal from "../data/theme-0d9488.css?raw";

export const MODES = ["dense", "compact", "comfortable", "spacious"] as const;
export type Mode = (typeof MODES)[number];

/* ── Density ─────────────────────────────────────────────────────────────── */

let densityCache: Record<Mode, Record<string, string>> | null = null;

const collectDensityNames = (rules: CSSRuleList, names: Set<string>) => {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule && rule.selectorText.includes("data-density")) {
      for (const name of Array.from(rule.style)) if (name.startsWith("--")) names.add(name);
    }
    if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) {
      collectDensityNames((rule as CSSGroupingRule).cssRules, names);
    }
  }
};

/**
 * Every density-scoped custom property, resolved to a concrete value in each
 * of the four modes — read from the live token layer, so the blend is exactly
 * what the stylesheet says at either end.
 */
const densityValues = () => {
  if (densityCache) return densityCache;
  const names = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      collectDensityNames(sheet.cssRules, names);
    } catch {
      /* cross-origin sheet (fonts) */
    }
  }
  const out = {} as Record<Mode, Record<string, string>>;
  for (const mode of MODES) {
    const probe = document.createElement("div");
    probe.dataset.density = mode;
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    out[mode] = Object.fromEntries([...names].map((n) => [n, cs.getPropertyValue(n).trim()]));
    probe.remove();
  }
  densityCache = out;
  return out;
};

const useInlineVars = (vars: Record<string, string>) => {
  const ref = useRef<HTMLDivElement>(null);
  const applied = useRef<string[]>([]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const k of applied.current) if (!(k in vars)) el.style.removeProperty(k);
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    applied.current = Object.keys(vars);
  });
  return ref;
};

type ScopeProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode; style?: CSSProperties };

/**
 * A `data-density` region part-way between two modes. The attribute is set to
 * whichever end is nearer, and every property the two ends disagree on is
 * blended inline — so at p = 0 or 1 it is exactly the real attribute.
 */
export const DensityScope = ({
  from,
  to = from,
  p = 1,
  ...rest
}: ScopeProps & { from: Mode; to?: Mode; p?: number }) => {
  const blending = from !== to && p > 0 && p < 1;
  const ref = useDensityRef(from, to, p, blending);
  return <div ref={ref} data-density={p < 0.5 ? from : to} {...rest} />;
};

const useDensityRef = (from: Mode, to: Mode, p: number, blending: boolean) => {
  const vars = blending ? blendMaps(densityValues()[from], densityValues()[to], p) : {};
  return useInlineVars(vars);
};

/* ── Brand ───────────────────────────────────────────────────────────────── */

/** Ramps emitted by the real `primitiv theme --brand <seed>` for each seed. */
const THEME_FILES = { violet, pink, orange, teal } as const;
export const SEEDS = {
  default: "#236ce1",
  violet: "#7c3aed",
  pink: "#e11d74",
  orange: "#ea6c0a",
  teal: "#0d9488",
} as const;
export type Brand = keyof typeof SEEDS;
export type Theme = "light" | "dark";

const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;

const parseTheme = (css: string, theme: Theme) => {
  const marker = theme === "light" ? '[data-theme="light"] {' : '[data-theme="dark"] {';
  const body = css.slice(css.indexOf(marker)).split("}")[0];
  return Object.fromEntries(
    STEPS.map((s) => {
      const m = new RegExp(`--primitiv-color-brand-${s}: ([^;]+);`).exec(body);
      return [s, m![1]];
    }),
  ) as Record<string, string>;
};

let brandCache: Record<Theme, Record<Brand, Record<string, string>>> | null = null;

const brandRamps = () => {
  if (brandCache) return brandCache;
  const out = { light: {}, dark: {} } as Record<Theme, Record<Brand, Record<string, string>>>;
  for (const theme of ["light", "dark"] as const) {
    const probe = document.createElement("div");
    probe.dataset.theme = theme;
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    out[theme].default = Object.fromEntries(
      STEPS.map((s) => [s, cs.getPropertyValue(`--primitiv-color-brand-${s}`).trim()]),
    );
    probe.remove();
    for (const [name, css] of Object.entries(THEME_FILES)) {
      out[theme][name as Brand] = parseTheme(css, theme);
    }
  }
  brandCache = out;
  return out;
};

/**
 * A themed region whose brand ramp is part-way between two seeds. Setting
 * `data-theme` here is what makes the Intent roles (`action/primary/*` and
 * friends) re-resolve against the inline ramp rather than inherit `:root`'s.
 */
export const ThemeScope = ({
  theme,
  from = "default",
  to = from,
  p = 1,
  ...rest
}: ScopeProps & { theme: Theme; from?: Brand; to?: Brand; p?: number }) => {
  const vars: Record<string, string> = {};
  if (!(from === "default" && (to === "default" || p <= 0))) {
    const ramps = brandRamps()[theme];
    for (const s of STEPS) {
      const a = ramps[from][s];
      const b = ramps[to][s];
      vars[`--primitiv-color-brand-${s}`] =
        p <= 0 || a === b ? a : p >= 1 ? b : `color-mix(in oklch, ${a}, ${b} ${(p * 100).toFixed(2)}%)`;
    }
  }
  const ref = useInlineVars(vars);
  return (
    <ThemeContext.Provider value={theme}>
      <div ref={ref} data-theme={theme} {...rest} />
    </ThemeContext.Provider>
  );
};

const ThemeContext = createContext<Theme>("light");
/** Which copy of the frame this is (the dark reveal renders both). */
export const useTheme = () => useContext(ThemeContext);
