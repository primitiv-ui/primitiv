import { useTime } from "../timeline";
import { fadeStyle } from "../ui";
import { BrandLockup, Panel } from "./Panel";

export const OUTRO_START = 50.9;

/** 50.9s–end: the lockup, the URL, the facts. */
export const Outro = () => {
  const t = useTime();
  return (
    <Panel inAt={0}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          paddingBottom: 40,
        }}
      >
        <BrandLockup at={0.5} markSize={104} wordHeight={36} />
        <div
          style={{
            fontFamily: "var(--primitiv-font-family-heading)",
            fontWeight: 600,
            fontSize: 30,
            lineHeight: 1,
            textTransform: "uppercase",
            textAlign: "center",
            ...fadeStyle(t, 1.45, undefined, { dist: 10 }),
          }}
        >
          Build once.
          <br />
          <span style={{ color: "#bcd5ff" }}>Fit every product.</span>
        </div>
        <div
          style={{
            fontFamily: "var(--primitiv-font-family-mono)",
            fontSize: 18,
            fontWeight: 500,
            padding: "11px 20px",
            borderRadius: 999,
            background: "#fff",
            color: "#0f3f99",
            boxShadow: "0 18px 40px -14px rgb(0 20 60 / 0.6)",
            ...fadeStyle(t, 1.9, undefined, { dist: 10 }),
          }}
        >
          primitiv-ui.dev
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 46,
          textAlign: "center",
          fontFamily: "var(--primitiv-font-family-mono)",
          fontSize: 12,
          letterSpacing: "0.06em",
          color: "rgb(255 255 255 / 0.75)",
          ...fadeStyle(t, 2.3, undefined, { dist: 6 }),
        }}
      >
        Open source · MIT · 63 components · 4 densities
      </div>
    </Panel>
  );
};
