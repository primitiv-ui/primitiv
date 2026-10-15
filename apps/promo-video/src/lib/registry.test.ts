import { describe, expect, it } from "vitest";

import { resolveVideo } from "./registry";

const VIDEOS = { launch: "the launch video", teaser: "the teaser" };

describe("resolveVideo", () => {
  it("returns the named video", () => {
    expect(resolveVideo(VIDEOS, "teaser", "launch")).toEqual({ id: "teaser", video: "the teaser" });
  });

  it("falls back to the default when no name is given", () => {
    expect(resolveVideo(VIDEOS, null, "launch")).toEqual({ id: "launch", video: "the launch video" });
    expect(resolveVideo(VIDEOS, "", "launch")).toEqual({ id: "launch", video: "the launch video" });
  });

  it("names the available videos when asked for one that does not exist", () => {
    expect(() => resolveVideo(VIDEOS, "nope", "launch")).toThrow('Unknown video "nope". Available: launch, teaser');
  });
});
