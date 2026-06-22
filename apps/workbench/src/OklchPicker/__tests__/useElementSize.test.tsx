import { describe, it, expect } from "vitest";
import { useRef } from "react";
import { render, screen, act } from "@testing-library/react";

import { useElementSize } from "../useElementSize";
import { triggerResize, resizeDisconnects } from "./resizeObserverMock";

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  return (
    <div ref={ref} data-testid="box">
      {size.width}x{size.height}
    </div>
  );
}

// A probe that never attaches the ref, so the hook's effect sees a null element.
function DetachedProbe() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  return <div data-testid="detached">{`${size.width}x${size.height}`}</div>;
}

describe("useElementSize", () => {
  it("starts at zero before the element is measured", () => {
    render(<Probe />);

    expect(screen.getByTestId("box")).toHaveTextContent("0x0");
  });

  it("reports the observed element's content size", () => {
    render(<Probe />);

    act(() => triggerResize(300, 150));

    expect(screen.getByTestId("box")).toHaveTextContent("300x150");
  });

  it("stays at zero when the ref is never attached", () => {
    render(<DetachedProbe />);

    act(() => triggerResize(300, 150));

    expect(screen.getByTestId("detached")).toHaveTextContent("0x0");
  });

  it("disconnects the observer on unmount", () => {
    const before = resizeDisconnects();
    const { unmount } = render(<Probe />);

    unmount();

    expect(resizeDisconnects()).toBe(before + 1);
  });
});
