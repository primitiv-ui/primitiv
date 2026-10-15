import { BrandLockup, Panel } from "@kit/panel";
import { useTime } from "@kit/timeline";
import { fadeStyle, Words } from "@kit/ui";

export const TITLE_START = 8.3;
export const TITLE_END = 12.4;

/** 8.3–12.4s: the name, between the hook and the detail. */
export const Title = () => {
  const t = useTime();
  return (
    <Panel inAt={0} outAt={3.45}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          paddingBottom: 30,
        }}
      >
        <BrandLockup at={0.55} />
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: 19,
            lineHeight: 1.35,
            color: "rgb(255 255 255 / 0.86)",
            ...fadeStyle(t, 1.55, undefined, { dist: 10 }),
          }}
        >
          Headless, accessible React components
          <br />
          with <b style={{ color: "#fff" }}>density</b> built in.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 52,
          textAlign: "center",
          fontFamily: "var(--primitiv-font-family-heading)",
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.22em",
          color: "rgb(255 255 255 / 0.7)",
        }}
      >
        <Words text="DESIGN SYSTEM · TOKENS · CLI" at={2.0} stagger={0.08} />
      </div>
    </Panel>
  );
};
