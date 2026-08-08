// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useMediaQuery } from "../useMediaQuery.ts";

function Probe() {
  const matches = useMediaQuery("(min-width: 40rem)");
  return matches ? <>matches</> : <>no-match</>;
}

describe("useMediaQuery SSR", () => {
  it("should render a static false snapshot when there is no window", () => {
    expect(typeof window).toBe("undefined");

    const markup = renderToStaticMarkup(<Probe />);

    expect(markup).toBe("no-match");
  });
});
