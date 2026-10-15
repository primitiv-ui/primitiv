import { Button } from "@components/button";

import { easeInCubic, progress, spring } from "@lib/time";
import { DensityScope, MODES } from "@kit/scopes";
import { useTime } from "@kit/timeline";
import { Header } from "@kit/ui";

export const SIZE_START = 23.2;
export const SIZE_END = 28.55;
const OUT = 4.85;
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

/** 23.2–28.55s: every size at every density — two independent axes. */
export const SizeGrid = () => {
  const t = useTime();
  return (
    <>
      <Header
        overline="Density × size"
        headline={"Two dials.\n*Twenty* buttons."}
        sub="Density sets how tight a product is. Size sets how prominent one control is. They compose."
        at={0.1}
        out={OUT}
      />
      <div className="v-stage" style={{ top: 228, display: "flex", flexDirection: "column", gap: 14 }}>
        {MODES.map((mode, r) => {
          const rowOut = easeInCubic(progress(t, OUT + r * 0.05, OUT + 0.35 + r * 0.05));
          return (
            <div key={mode} style={{ opacity: 1 - rowOut, transform: `translateX(${-rowOut * 30}px)` }}>
              <div
                className="v-mode-label"
                style={{ marginBottom: 6, opacity: Math.min(1, spring(t - 0.5 - r * 0.1) * 1.5) }}
              >
                <b>{mode}</b>
                <span style={{ flex: 1, height: 1, background: "var(--primitiv-border-subtle)" }} />
              </div>
              <DensityScope from={mode}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {SIZES.map((size, c) => {
                    const s = spring(t - 0.6 - (r + c) * 0.07, { stiffness: 260, damping: 16 });
                    return (
                      <div
                        key={size}
                        style={{
                          transform: `scale(${0.4 + 0.6 * s})`,
                          opacity: Math.min(1, s * 2),
                          transformOrigin: "0 50%",
                        }}
                      >
                        <Button size={size} variant={c === 4 ? "primary" : "secondary"}>
                          {size.toUpperCase()}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </DensityScope>
            </div>
          );
        })}
      </div>
    </>
  );
};
