import { Dashboard } from "../Dashboard";
import { glideAt } from "../lib/glide";
import { easeInOutCubic } from "../lib/time";
import { DensityScope, type Mode } from "../scopes";
import { useTime } from "../timeline";
import { blink, Caret, Dial, fadeStyle, Header, retype } from "../ui";

const GLIDE = 0.85;
const STEPS = [
  { at: 0.6, to: "dense" },
  { at: 2.1, to: "spacious" },
  { at: 3.6, to: "compact" },
  { at: 5.0, to: "comfortable" },
  { at: 6.6, to: "dense" },
  { at: 7.45, to: "spacious" },
] as const satisfies readonly { at: number; to: Mode }[];

export const HOOK_END = 9.0;

/** 0–9s: the dashboard glides through all four densities. */
export const Hook = () => {
  const t = useTime();
  const g = glideAt<Mode>(t, "comfortable", STEPS, GLIDE, easeInOutCubic);
  const value = retype(g.from, g.to, g.p);
  const typing = g.p > 0 && g.p < 1;

  return (
    <>
      <Header overline="Density" headline={"One attribute.\n*Four* densities."} at={-0.9} out={6.0} />
      <Header
        overline="Density"
        headline={"Everything\n*reflows.*"}
        sub="Spacing, control height, corner radius and type — set by one attribute."
        at={6.35}
      />

      <div className="v-stage" style={{ top: 158, ...fadeStyle(t, -0.6, 5.95, { dist: 8 }) }}>
        <Dial from={g.from} to={g.to} p={g.p} />
      </div>

      <div className="v-stage" style={{ top: 212 }}>
        <div className="v-clip" style={{ maxHeight: 368 + 12 }}>
          <DensityScope from={g.from} to={g.to} p={g.p}>
            <Dashboard />
          </DensityScope>
        </div>
      </div>

      <div className="v-stage" style={{ top: 594, display: "flex", justifyContent: "center", ...fadeStyle(t, -0.6) }}>
        <code className="v-code">
          <span className="tag">{"<main "}</span>
          <span className="attr">data-density</span>
          <span className="tag">=</span>
          <span className="val">"{value}</span>
          {typing ? <Caret on /> : null}
          <span className="val">"</span>
          <span className="tag">{">"}</span>
          {!typing ? <Caret on={blink(t) && false} /> : null}
        </code>
      </div>
    </>
  );
};
