import type { ReactNode } from "react";

import { Card, CardContent } from "@components/card";

import { progress, spring } from "@lib/time";
import { DensityScope } from "@kit/scopes";
import { useTime } from "@kit/timeline";
import { Caret, Header } from "@kit/ui";

export const WAYS_START = 46.3;
export const WAYS_END = 51.6;

/** Lines that type out one after another from `at`, `cps` chars per second. */
const Typed = ({ lines, at, cps = 38 }: { lines: { text: string; className?: string; instant?: boolean }[]; at: number; cps?: number }) => {
  const t = useTime();
  let clock = at;
  let caretShown = false;
  return (
    <>
      {lines.map((line, i) => {
        const start = clock;
        const dur = line.instant ? 0.12 : line.text.length / cps;
        clock += dur + 0.12;
        const n = Math.round(progress(t, start, start + dur) * line.text.length);
        if (t < start) return null;
        const typing = n < line.text.length;
        const showCaret = typing && !caretShown;
        if (showCaret) caretShown = true;
        return (
          <div key={i} className={line.className} style={{ whiteSpace: "pre" }}>
            {line.text.slice(0, n)}
            {showCaret ? <Caret on /> : null}
          </div>
        );
      })}
    </>
  );
};

const Way = ({
  n,
  title,
  tag,
  description,
  at,
  children,
}: {
  n: string;
  title: string;
  tag: string;
  description: string;
  at: number;
  children?: ReactNode;
}) => {
  const t = useTime();
  const s = spring(t - at, { stiffness: 170, damping: 20 });
  return (
    <div style={{ opacity: Math.min(1, s * 1.6), transform: `translateX(${(1 - s) * 70}px)` }}>
      <Card className="v-card">
        <CardContent>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                fontFamily: "var(--primitiv-font-family-heading)",
                fontWeight: 600,
                fontSize: 30,
                lineHeight: 0.9,
                color: "var(--primitiv-action-link-foreground-default)",
                width: 26,
              }}
            >
              {n}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="v-row-between">
                <h3 className="v-title" style={{ fontSize: 20, lineHeight: "24px" }}>
                  {title}
                </h3>
                <span className="v-mode-label" style={{ fontSize: 11 }}>
                  {tag}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4, color: "var(--primitiv-content-secondary)" }}>
                {description}
              </p>
              {children}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const term = {
  fontFamily: "var(--primitiv-font-family-mono)",
  fontSize: 12,
  lineHeight: "19px",
  marginTop: 6,
  padding: "9px 12px",
  borderRadius: 8,
  // A terminal stays dark in either theme.
  background: "oklch(0.17 0.012 260)",
  color: "oklch(0.93 0.01 260)",
  border: "1px solid oklch(1 0 0 / 0.08)",
} as const;

/** 46.3–51.3s: headless, styled, Figma. */
export const ThreeWays = () => (
  <>
    <Header overline="Get started" headline={"Three ways\nto *build.*"} at={0} />
    <div className="v-stage" style={{ top: 168, display: "flex", flexDirection: "column", gap: 10 }}>
      <DensityScope from="comfortable">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Way n="1" title="Headless" tag="npm package" description="Behaviour and accessibility only. Bring your own CSS." at={0.35}>
            <div style={term}>
              <Typed at={0.9} lines={[{ text: "$ npm i @primitiv-ui/react" }]} />
            </div>
          </Way>
          <Way n="2" title="Styled" tag="npm i -D primitiv-ui" description="Styled components copied into your app. The code is yours." at={0.5}>
            <div style={{ ...term, height: 19 * 5 + 20 }}>
              <Typed
                at={1.75}
                lines={[
                  { text: "$ primitiv add button" },
                  { text: "Wrote:", className: "v-dim", instant: true },
                  { text: "  src/styles/primitiv/button/styles.css  new", className: "v-ok", instant: true },
                  { text: "  src/components/button.recipe.ts        new", className: "v-ok", instant: true },
                  { text: "  src/components/button.tsx              new", className: "v-ok", instant: true },
                ]}
              />
            </div>
          </Way>
          <Way n="3" title="Figma" tag="design library" description="The same tokens and components, in Figma." at={0.65} />
        </div>
      </DensityScope>
    </div>
  </>
);
