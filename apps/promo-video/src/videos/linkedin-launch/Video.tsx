import type { CSSProperties } from "react";

import type { VideoSpec } from "@kit/spec";

import { glideAt } from "@lib/glide";
import { easeInOutCubic, progress } from "@lib/time";
import { Accessible, A11Y_END, A11Y_START } from "./scenes/Accessible";
import {
  BRAND_GLIDE,
  BRAND_STEPS,
  Colour,
  COLOUR_END,
  COLOUR_START,
  REVEAL_AT,
  REVEAL_DUR,
  TOGGLE,
} from "./scenes/Colour";
import { FOUR_END, FOUR_START, FourModes } from "./scenes/FourModes";
import { Hook, HOOK_END } from "./scenes/Hook";
import { Nested, NESTED_END, NESTED_START } from "./scenes/Nested";
import { Outro, OUTRO_START } from "./scenes/Outro";
import { Title, TITLE_END, TITLE_START } from "./scenes/Title";
import { SIZE_END, SIZE_START, SizeGrid } from "./scenes/SizeGrid";
import { ThreeWays, WAYS_END, WAYS_START } from "./scenes/ThreeWays";
import { ThemeScope, type Brand, type Theme } from "@kit/scopes";
import { Sequence, TimeRoot, useTime } from "@kit/timeline";
import { Footer } from "@kit/ui";

const DURATION = 55;

const Scenes = () => (
  <>
    <Sequence from={0} to={HOOK_END}>
      <Hook />
    </Sequence>
    <Sequence from={FOUR_START} to={FOUR_END}>
      <FourModes />
    </Sequence>
    <Sequence from={NESTED_START} to={NESTED_END}>
      <Nested />
    </Sequence>
    <Sequence from={SIZE_START} to={SIZE_END}>
      <SizeGrid />
    </Sequence>
    <Sequence from={COLOUR_START} to={COLOUR_END}>
      <Colour />
    </Sequence>
    <Sequence from={A11Y_START} to={A11Y_END}>
      <Accessible />
    </Sequence>
    <Sequence from={WAYS_START} to={WAYS_END}>
      <ThreeWays />
    </Sequence>
    <Footer />
    <Sequence from={TITLE_START} to={TITLE_END}>
      <Title />
    </Sequence>
    <Sequence from={OUTRO_START} to={DURATION}>
      <Outro />
    </Sequence>
  </>
);

/** One complete copy of the frame in a theme, re-tinted by the rebrand glide. */
const Frame = ({ theme, style }: { theme: Theme; style?: CSSProperties }) => {
  const t = useTime();
  const g = glideAt<Brand>(t - COLOUR_START, "default", BRAND_STEPS, BRAND_GLIDE, easeInOutCubic);
  return (
    <ThemeScope theme={theme} from={g.from} to={g.to} p={g.p} className="v-frame" style={style}>
      <div className="v-backdrop" />
      <Scenes />
    </ThemeScope>
  );
};

const Video = ({ t }: { t: number }) => {
  const reveal = easeInOutCubic(progress(t, REVEAL_AT, REVEAL_AT + REVEAL_DUR));
  return (
    <TimeRoot t={t}>
      {reveal < 1 ? <Frame theme="light" /> : null}
      {t >= REVEAL_AT ? (
        <Frame
          theme="dark"
          style={
            reveal < 1
              ? { clipPath: `circle(${reveal * 820}px at ${TOGGLE.x}px ${TOGGLE.y}px)` }
              : undefined
          }
        />
      ) : null}
    </TimeRoot>
  );
};

/** The 55s LinkedIn launch video: 4:5, rendered at 1080 × 1350. */
export const linkedinLaunch: VideoSpec = { width: 540, height: 675, duration: DURATION, Video };
