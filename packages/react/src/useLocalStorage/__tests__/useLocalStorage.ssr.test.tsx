// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { useLocalStorage } from "../useLocalStorage.ts";

function Probe() {
  const [value] = useLocalStorage("primitiv-theme", "light");
  return <>{value}</>;
}

describe("useLocalStorage SSR", () => {
  it("should render the fallback when there is no window to read storage from", () => {
    expect(typeof window).toBe("undefined");

    const markup = renderToStaticMarkup(<Probe />);

    expect(markup).toBe("light");
  });
});
