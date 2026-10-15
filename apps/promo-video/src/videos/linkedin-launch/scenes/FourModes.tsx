import { Badge } from "@components/badge";
import { Button } from "@components/button";
import { Card, CardContent } from "@components/card";
import { Switch } from "@components/switch";

import { easeInCubic, progress, spring } from "@lib/time";
import { DensityScope, MODES } from "@kit/scopes";
import { useTime } from "@kit/timeline";
import { Header } from "@kit/ui";

export const FOUR_START = 11.55;
export const FOUR_END = 17.75;
const OUT = 5.7;

const AlertsCard = () => (
  <Card className="v-card">
    <CardContent>
      <div className="v-col">
        <div className="v-row-between">
          <h3 className="v-title" style={{ fontSize: "var(--primitiv-heading-h5-font-size)", lineHeight: "var(--primitiv-heading-h5-line-height)" }}>
            Alerts
          </h3>
          <Badge size="sm" tone="danger" variant="counter">
            3
          </Badge>
        </div>
        <Switch size="sm" checked onCheckedChange={() => {}}>
          Email digest
        </Switch>
        <Switch size="sm" checked={false} onCheckedChange={() => {}}>
          Push alerts
        </Switch>
        <div className="v-row">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="ghost">
            Reset
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

/** 11.55–17.75s: the same card at all four densities, side by side. */
export const FourModes = () => {
  const t = useTime();
  return (
    <>
      <Header
        overline="Four modes"
        headline={"One per\n*product.*"}
        sub="An ops console and a marketing site can share every component. No fork, no second theme."
        at={0.45}
        out={OUT}
      />
      <div
        className="v-stage"
        style={{
          top: 218,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 12px",
          alignItems: "start",
        }}
      >
        {MODES.map((mode, i) => {
          const s = spring(t - 0.3 - i * 0.1, { stiffness: 190, damping: 19 });
          const o = easeInCubic(progress(t, OUT + i * 0.05, OUT + 0.35 + i * 0.05));
          return (
            <div
              key={mode}
              style={{
                opacity: Math.min(1, s * 2) * (1 - o),
                transform: `translateY(${(1 - s) * 40 - o * 30}px) scale(${0.92 + 0.08 * s})`,
                transformOrigin: "50% 0",
              }}
            >
              <div className="v-mode-label" style={{ marginBottom: 7, gap: 0 }}>
                data-density=<b>"{mode}"</b>
              </div>
              <DensityScope from={mode}>
                <AlertsCard />
              </DensityScope>
            </div>
          );
        })}
      </div>
    </>
  );
};
