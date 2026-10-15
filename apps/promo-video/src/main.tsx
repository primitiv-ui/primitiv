import "@tokens";
import "@kit/video.css";

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { resolveVideo } from "@lib/registry";

import { DEFAULT_VIDEO, VIDEOS } from "./videos";

declare global {
  interface Window {
    __seek: (t: number) => Promise<void>;
    __video: { id: string; width: number; height: number; duration: number };
  }
}

// ?video=<id> picks the video; ?t=12.5 renders one moment; ?play loops it.
const params = new URLSearchParams(location.search);
const { id, video } = resolveVideo(VIDEOS, params.get("video"), DEFAULT_VIDEO);

const el = document.getElementById("root")!;
el.style.width = `${video.width}px`;
el.style.height = `${video.height}px`;
document.title = `${id} · Primitiv video`;

const root = createRoot(el);
const render = (t: number) => flushSync(() => root.render(<video.Video t={t} />));
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

window.__video = { id, width: video.width, height: video.height, duration: video.duration };
window.__seek = async (t: number) => {
  render(t);
  await nextFrame();
};

if (params.has("play")) {
  const start = performance.now() - Number(params.get("from") ?? 0) * 1000;
  const loop = () => {
    render(((performance.now() - start) / 1000) % video.duration);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} else {
  render(Number(params.get("t") ?? 0));
}
