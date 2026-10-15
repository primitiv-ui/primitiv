import { Button } from "@components/button";
import { Moon, Sun } from "@primitiv-ui/icons";

import { Dashboard } from "@kit/Dashboard";
import sheet from "@docs-content/palette-sheet.generated.json";
import { contrast } from "@lib/contrast";
import { easeInOutCubic, easeOutCubic, progress, spring } from "@lib/time";
import { DensityScope, SEEDS, useTheme, type Brand } from "@kit/scopes";
import { useTime } from "@kit/timeline";
import { Caret, fadeStyle, Header, retype } from "@kit/ui";

export const COLOUR_START = 28.4;
export const COLOUR_END = 41.85;

/* Local (scene) times. */
const MORPH_AT = 1.05; // seed circle becomes the 500 row
const STRIP_AT = 3.65; // list collapses into a strip
const TYPE_AT = 4.45; // terminal starts typing
const DASH_OUT = 12.95;

/** Brand glides, in scene time; Video applies them to the whole frame. */
export const BRAND_STEPS: { at: number; to: Brand }[] = [
  { at: 5.5, to: "violet" },
  { at: 6.4, to: "pink" },
  { at: 7.3, to: "orange" },
  { at: 8.2, to: "default" },
];
export const BRAND_GLIDE = 0.55;

/* The dark reveal: the theme toggle is pressed and dark floods out from it. */
export const REVEAL_AT = COLOUR_START + 9.45;
export const REVEAL_DUR = 1.05;
export const TOGGLE = { x: 486, y: 58 };

type Rect = { x: number; y: number; w: number; h: number; r: number };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
  r: lerp(a.r, b.r, p),
});

const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
const CIRCLE: Rect = { x: 270 - 64, y: 380 - 64, w: 128, h: 128, r: 64 };
const listRect = (i: number): Rect => ({ x: 32, y: 214 + i * 38.5, w: 476, h: 34.5, r: 8 });
const stripRect = (i: number): Rect => ({ x: 32 + i * 47.6 + 1.5, y: 214, w: 44.6, h: 40, r: 9 });

const Ramp = () => {
  const t = useTime();
  const theme = useTheme();
  const rows = sheet[theme].find((r) => r.ramp === "brand")!.steps;
  const content = easeOutCubic(progress(t, MORPH_AT + 0.75, MORPH_AT + 1.25)) *
    (1 - easeOutCubic(progress(t, STRIP_AT - 0.3, STRIP_AT)));

  return (
    <>
      {STEPS.map((step, i) => {
        const d = Math.abs(i - 5);
        let rect: Rect;
        if (i === 5) {
          const birth = spring(t - 0.15, { stiffness: 200, damping: 18 });
          const c = { ...CIRCLE, x: 270 - 64 * birth, y: 380 - 64 * birth, w: 128 * birth, h: 128 * birth, r: 64 * birth };
          rect = lerpRect(c, listRect(5), easeInOutCubic(progress(t, MORPH_AT, MORPH_AT + 0.6)));
        } else {
          const from = { ...listRect(5), w: 476, h: 0, y: listRect(5).y + 17 };
          const grow = easeInOutCubic(progress(t, MORPH_AT + 0.25 + d * 0.05, MORPH_AT + 0.8 + d * 0.05));
          rect = lerpRect(from, listRect(i), grow);
          if (grow === 0) return null;
        }
        const strip = easeInOutCubic(progress(t, STRIP_AT + i * 0.03, STRIP_AT + 0.7 + i * 0.03));
        if (strip > 0) rect = lerpRect(listRect(i), stripRect(i), strip);

        const fg = rows[i].foreground;
        const ratio = contrast(rows[i].hex, fg);
        return (
          <div
            key={step}
            style={{
              position: "absolute",
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              borderRadius: rect.r,
              background: `var(--primitiv-color-brand-${step})`,
              color: fg,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 14px",
              boxSizing: "border-box",
              overflow: "hidden",
              opacity: i === 5 ? 1 : Math.min(1, (rect.h / 34.5) * 3),
              boxShadow: i === 5 && strip === 0 ? "0 10px 30px -10px color-mix(in oklch, var(--primitiv-color-brand-500) 70%, transparent)" : undefined,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", opacity: content }}>
              <span style={{ fontFamily: "var(--primitiv-font-family-heading)", fontWeight: 600, fontSize: 21, width: 26 }}>Aa</span>
              <span className="v-mono" style={{ fontSize: 12, opacity: 0.85 }}>
                brand-{step}
              </span>
              <span style={{ flex: 1 }} />
              <span className="v-mono" style={{ fontSize: 12.5, fontWeight: 500 }}>
                {ratio.toFixed(2)}:1
              </span>
              <span
                className="v-mono"
                style={{ fontSize: 10, fontWeight: 700, padding: "2px 5px", borderRadius: 4, border: "1.2px solid currentColor" }}
              >
                AA
              </span>
            </div>
          </div>
        );
      })}
      {/* The seed's own label, before it becomes a row. */}
      <div
        className="v-mono"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 380 + 84,
          textAlign: "center",
          fontSize: 15,
          color: "var(--primitiv-content-secondary)",
          ...fadeStyle(t, 0.4, MORPH_AT - 0.15, { dist: 8 }),
        }}
      >
        seed <span style={{ color: "var(--primitiv-content-primary)" }}>#236ce1</span>
      </div>
    </>
  );
};

const HEX: Record<Brand, string> = SEEDS;

/** The seed being typed: the first hex types out, each later one retypes over it. */
const hexAt = (t: number) => {
  const first = BRAND_STEPS[0];
  let text = HEX[first.to].slice(0, Math.round(progress(t, TYPE_AT + 0.8, first.at - 0.15) * 7));
  for (let i = 1; i < BRAND_STEPS.length; i++) {
    const step = BRAND_STEPS[i];
    if (t < step.at - 0.45) break;
    text = retype(HEX[BRAND_STEPS[i - 1].to], HEX[step.to], progress(t, step.at - 0.45, step.at - 0.08));
  }
  return text;
};

const Terminal = () => {
  const t = useTime();
  const command = 'primitiv theme --brand "';
  const typed = Math.round(progress(t, TYPE_AT, TYPE_AT + 0.75) * command.length);
  const hex = hexAt(t);
  const pending = BRAND_STEPS.some((s) => t > s.at - 0.5 && t < s.at) || typed < command.length;
  const done = typed === command.length;
  return (
    <div className="v-stage" style={{ top: 268, display: "flex", ...fadeStyle(t, TYPE_AT - 0.2, 8.85) }}>
      <code className="v-code" style={{ fontSize: 14.5 }}>
        <span className="tag">$ </span>
        <span className="val">{command.slice(0, Math.min(typed, 9))}</span>
        <span className="attr">{command.slice(9, Math.min(typed, 15))}</span>
        <span className="tag">{command.slice(15, typed)}</span>
        {done ? <span className="val">{hex}</span> : null}
        {done && hex.length === 7 ? <span className="tag">"</span> : null}
        <Caret on={pending || t % 0.8 < 0.45} />
        {done && hex.length === 7 ? (
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              marginLeft: 10,
              borderRadius: 4,
              background: "var(--primitiv-color-brand-500)",
              boxShadow: "0 0 0 1.5px rgb(255 255 255 / 0.5)",
            }}
          />
        ) : null}
      </code>
    </div>
  );
};

/** 28.4–41.85s: seed → ramp → rebrand → dark. */
export const Colour = () => {
  const t = useTime();
  const theme = useTheme();
  const dashIn = spring(t - (STRIP_AT + 0.5), { stiffness: 150, damping: 20 });
  const dashOut = easeInOutCubic(progress(t, DASH_OUT, DASH_OUT + 0.5));
  const toggleIn = spring(t - 8.85, { stiffness: 260, damping: 18 });
  const press = Math.sin(Math.PI * progress(t, 9.25, 9.55));

  return (
    <>
      <Header
        overline="Colour"
        headline={"One seed.\n*Ten* accessible steps."}
        sub="Every swatch ships with the text colour that reads on it. Every pairing clears WCAG AA."
        at={0}
        out={STRIP_AT - 0.35}
      />
      <Header
        overline="Theming"
        headline={"Rebrand with\n*one* command."}
        sub="Harmoni rebuilds the brand ramp from a single seed colour. Every component follows."
        at={STRIP_AT + 0.05}
        out={8.85}
      />
      <Header
        overline="Theming"
        headline={"Light\n*and* dark."}
        sub="Both themes come from the same tokens, with every pairing contrast-checked in each."
        at={9.25}
        out={DASH_OUT - 0.05}
      />

      <div style={{ position: "absolute", inset: 0, ...fadeStyle(t, 0, DASH_OUT, { dist: 0 }) }}>
        <Ramp />
      </div>
      <Terminal />

      <div
        className="v-stage"
        style={{
          top: 326,
          opacity: Math.min(1, dashIn * 1.6) * (1 - dashOut),
          transform: `translateY(${(1 - dashIn) * 60 - dashOut * 40}px)`,
        }}
      >
        <div className="v-clip" style={{ maxHeight: 268 + 12 }}>
          <DensityScope from="comfortable">
            <Dashboard rows={3} progress={progress(t, STRIP_AT + 0.6, 12) * 92 + 8} />
          </DensityScope>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: TOGGLE.x - 18,
          top: TOGGLE.y - 18,
          opacity: Math.min(1, toggleIn * 2) * (1 - dashOut),
          transform: `scale(${(0.5 + 0.5 * toggleIn) * (1 - press * 0.12)})`,
        }}
      >
        <DensityScope from="comfortable">
          <Button size="sm" variant="secondary" aria-label="Toggle theme" style={{ width: 36, height: 36, padding: 0, borderRadius: 999 }}>
            {theme === "light" ? <Moon /> : <Sun />}
          </Button>
        </DensityScope>
      </div>
    </>
  );
};
