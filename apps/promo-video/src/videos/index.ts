import type { VideoSpec } from "@kit/spec";

import { linkedinLaunch } from "./linkedin-launch/Video";

/** Every video this app can render, by id (`?video=<id>`, `--video <id>`). */
export const VIDEOS: Readonly<Record<string, VideoSpec>> = {
  "linkedin-launch": linkedinLaunch,
};

export const DEFAULT_VIDEO = "linkedin-launch";
