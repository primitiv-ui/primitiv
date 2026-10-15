import type { CSSProperties, ReactNode } from "react";

import { easeInCubic, easeOutCubic, easeOutExpo, progress } from "@lib/time";
import { MODES, type Mode } from "./scopes";
import { useTime } from "./timeline";

/* ── Kinetic type ────────────────────────────────────────────────────────── */

/**
 * Words rise into view through a mask, staggered; and leave upward. Lines are
 * split on "\n"; a word wrapped in *asterisks* takes the accent colour.
 */
export const Words = ({
  text,
  at = 0,
  out,
  stagger = 0.055,
  dur = 0.55,
}: {
  text: string;
  at?: number;
  out?: number;
  stagger?: number;
  dur?: number;
}) => {
  const t = useTime();
  let i = 0;
  return (
    <>
      {text.split("\n").map((line, li) => (
        <span className="v-line" key={li}>
          {line.split(" ").map((raw, wi) => {
            const k = i++;
            const accent = raw.startsWith("*");
            const word = raw.replaceAll("*", "");
            const pIn = easeOutExpo(progress(t, at + k * stagger, at + k * stagger + dur));
            const pOut =
              out === undefined
                ? 0
                : easeInCubic(progress(t, out + k * stagger * 0.5, out + k * stagger * 0.5 + dur * 0.6));
            const y = (1 - pIn) * 105 - pOut * 105;
            return (
              <span className="v-word-mask" key={wi}>
                <span
                  className={`v-word${accent ? " v-accent" : ""}`}
                  style={{ transform: `translateY(${y}%)` }}
                >
                  {word}
                </span>
                {wi < line.split(" ").length - 1 ? " " : null}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
};

/** Fade + lift in at `at`, fade + lift out at `out`. */
export const fadeStyle = (
  t: number,
  at: number,
  out?: number,
  { dur = 0.5, dist = 14 }: { dur?: number; dist?: number } = {},
): CSSProperties => {
  const pIn = easeOutCubic(progress(t, at, at + dur));
  const pOut = out === undefined ? 0 : easeInCubic(progress(t, out, out + dur * 0.7));
  return {
    opacity: pIn * (1 - pOut),
    transform: `translateY(${(1 - pIn) * dist - pOut * dist}px)`,
  };
};

export const Header = ({
  overline,
  headline,
  sub,
  at = 0,
  out,
  style,
}: {
  overline: string;
  headline: string;
  sub?: string;
  at?: number;
  out?: number;
  style?: CSSProperties;
}) => {
  const t = useTime();
  return (
    <div className="v-header" style={style}>
      <div className="v-overline" style={fadeStyle(t, at, out, { dur: 0.4, dist: 6 })}>
        {overline}
      </div>
      <h1 className="v-headline">
        <Words text={headline} at={at + 0.05} out={out} />
      </h1>
      {sub ? (
        <p className="v-sub" style={fadeStyle(t, at + 0.35, out)}>
          {sub}
        </p>
      ) : null}
    </div>
  );
};

/* ── Code readout ───────────────────────────────────────────────────────── */

/** Backspaces `from` then types `to` across a 0..1 progress. */
export const retype = (from: string, to: string, q: number) => {
  if (q <= 0) return from;
  if (q >= 1) return to;
  return q < 0.5
    ? from.slice(0, Math.round(from.length * (1 - q * 2)))
    : to.slice(0, Math.round(to.length * (q * 2 - 1)));
};

export const Caret = ({ on }: { on: boolean }) => (
  <span className="caret" style={{ opacity: on ? 1 : 0 }} />
);

/** `blink` is true for the on-half of a 1s cycle. */
export const blink = (t: number) => t % 1 < 0.55;

/* ── Density dial ───────────────────────────────────────────────────────── */

export const Dial = ({ from, to, p }: { from: Mode; to: Mode; p: number }) => {
  const a = MODES.indexOf(from);
  const b = MODES.indexOf(to);
  const pos = a + (b - a) * p;
  // The pill stretches toward its destination mid-glide, then catches up.
  const stretch = Math.sin(Math.PI * p) * Math.abs(b - a) * 0.35;
  const left = Math.min(pos, pos + (b > a ? -stretch : 0));
  const width = 1 + stretch;
  const labels = MODES.map((m) => (
    <div key={m} className="v-dial-item">
      {m[0].toUpperCase() + m.slice(1)}
    </div>
  ));
  return (
    <div className="v-dial">
      <div
        className="v-dial-pill"
        style={{
          left: `calc(4px + ${left} * (100% - 8px) / 4)`,
          width: `calc(${width} * (100% - 8px) / 4)`,
        }}
      />
      {labels}
      {/* The same labels in white, clipped to the pill: text flips colour
          exactly at the pill's edge as it slides under them. */}
      <div
        className="v-dial v-dial-top"
        style={{
          clipPath: `inset(4px calc(100% - 4px - ${left + width} * (100% - 8px) / 4) 4px calc(4px + ${left} * (100% - 8px) / 4) round 999px)`,
        }}
      >
        {labels}
      </div>
    </div>
  );
};

/* ── Brand ──────────────────────────────────────────────────────────────── */

const MARK = [
  "M 11.00 77.50 L 16.99 67.14 L 22.97 77.50 Z",
  "M 19.91 62.08 L 29.04 46.28 L 47.08 77.50 L 28.82 77.50 Z",
  "M 31.96 41.22 L 50.00 10.00 L 89.00 77.50 L 52.92 77.50 Z",
];

const WORDMARK =
  "M7.75 -70.0V0.0H19.625V-70.0ZM14.825000000000001 -59.625H28.875Q35.0 -59.625 38.712500000000006 -56.7625Q42.425000000000004 -53.900000000000006 42.425000000000004 -48.25Q42.425000000000004 -42.675000000000004 38.712500000000006 -39.775000000000006Q35.0 -36.875 28.875 -36.875H14.825000000000001V-26.5H28.875Q36.550000000000004 -26.5 42.175000000000004 -29.137500000000003Q47.800000000000004 -31.775000000000002 50.925000000000004 -36.6875Q54.050000000000004 -41.6 54.050000000000004 -48.25Q54.050000000000004 -55.0 50.925000000000004 -59.862500000000004Q47.800000000000004 -64.72500000000001 42.175000000000004 -67.36250000000001Q36.550000000000004 -70.0 28.875 -70.0H14.825000000000001Z M96.05000000000001 -33.375 118.30000000000001 0.0H132.55L108.80000000000001 -33.375ZM81.55000000000001 -70.0V0.0H93.42500000000001V-70.0ZM88.62500000000001 -59.75H102.67500000000001Q106.75000000000001 -59.75 109.78750000000002 -58.3625Q112.82500000000002 -56.975 114.52500000000002 -54.3625Q116.22500000000002 -51.75 116.22500000000002 -48.0Q116.22500000000002 -44.275000000000006 114.52500000000002 -41.650000000000006Q112.82500000000002 -39.025000000000006 109.78750000000002 -37.6375Q106.75000000000001 -36.25 102.67500000000001 -36.25H88.62500000000001V-26.5H103.17500000000001Q110.85000000000002 -26.5 116.47500000000002 -29.1875Q122.10000000000002 -31.875 125.22500000000002 -36.8Q128.35000000000002 -41.725 128.35000000000002 -48.25Q128.35000000000002 -54.875 125.22500000000002 -59.75Q122.10000000000002 -64.625 116.47500000000002 -67.3125Q110.85000000000002 -70.0 103.17500000000001 -70.0H88.62500000000001Z M157.05 -70.0V0.0H169.05V-70.0Z M213.60000000000002 -42.625 234.925 -6.5 256.25 -42.625 261.05 0.0H273.3L263.675 -73.5L234.925 -26.025000000000002L206.175 -73.5L196.55 0.0H208.8Z M300.85 -70.0V0.0H312.85V-70.0Z M337.35 -59.125H355.85V0.0H367.725V-59.125H386.225V-70.0H337.35Z M410.75 -70.0V0.0H422.75V-70.0Z M481.0 -20.8 460.375 -70.0H446.75L481.0 3.875L515.25 -70.0H501.625Z";

/** The triangle mark. `build` (0..1 each) scales the three pieces up in turn. */
export const Mark = ({
  size,
  build = [1, 1, 1],
  style,
}: {
  size: number;
  build?: readonly number[];
  style?: CSSProperties;
}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={style} aria-hidden="true">
    {MARK.map((d, i) => (
      <path
        key={i}
        d={d}
        fill="currentColor"
        className="v-mark-piece"
        style={{ transform: `scale(${build[i]})`, opacity: Math.min(1, build[i] * 3) }}
      />
    ))}
  </svg>
);

/** The wordmark alone; `reveal` (0..1) wipes it in from the left. */
export const Wordmark = ({ height, reveal = 1 }: { height: number; reveal?: number }) => {
  const w = 515.25 + 8;
  const h = 81;
  return (
    <svg
      viewBox={`0 -76 ${w} ${h}`}
      height={height}
      width={(height * w) / h}
      aria-hidden="true"
      style={{
        clipPath: `inset(-10% ${(1 - reveal) * 100}% -10% 0)`,
        transform: `translateX(${(1 - reveal) * -12}px)`,
      }}
    >
      <path d={WORDMARK} fill="currentColor" />
    </svg>
  );
};

export const Footer = ({ style }: { style?: CSSProperties }) => (
  <div className="v-footer" style={style}>
    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <Mark size={16} />
      <span style={{ color: "var(--primitiv-content-primary)" }}>
        <Wordmark height={9} />
      </span>
    </span>
    <span>primitiv-ui.dev</span>
  </div>
);

export const Abs = ({ style, children }: { style?: CSSProperties; children: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);
