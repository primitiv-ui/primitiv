import "@tokens";
import "./video.css";

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { DURATION, Video } from "./Video";

declare global {
  interface Window {
    __seek: (t: number) => Promise<void>;
    __duration: number;
  }
}

const root = createRoot(document.getElementById("root")!);
const render = (t: number) => flushSync(() => root.render(<Video t={t} />));

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

window.__duration = DURATION;
window.__seek = async (t: number) => {
  render(t);
  await nextFrame();
};

// Preview: ?t=12.5 renders one moment; ?play loops in real time.
const params = new URLSearchParams(location.search);
if (params.has("play")) {
  const start = performance.now() - Number(params.get("from") ?? 0) * 1000;
  const loop = () => {
    render(((performance.now() - start) / 1000) % DURATION);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} else {
  render(Number(params.get("t") ?? 0));
}
