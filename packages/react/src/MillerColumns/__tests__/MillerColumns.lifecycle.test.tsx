import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { MockResizeObserver } from "../../test/resizeObserverPolyfill";
import { MILLER_COLUMNS_PART, MillerColumns } from "..";
import {
  MillerColumnsColumnContext,
  MillerColumnsContext,
  MillerColumnsItemContext,
} from "../MillerColumnsContext";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Give every element a rendered width, as layout would. */
const renderedWidth = (width: number) =>
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);

describe("MillerColumns — resize handle lifecycle", () => {
  it("publishes its column's rendered width on mount and follows it as the column resizes", () => {
    // Arrange
    const width = renderedWidth(180.4);

    // Act
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle aria-label="Resize" />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Assert
    const handle = screen.getByRole("separator");
    expect(handle).toHaveAttribute("aria-valuenow", "180");

    // Act
    width.mockReturnValue({ width: 240 } as DOMRect);
    act(() => MockResizeObserver.fireAll());

    // Assert
    expect(handle).toHaveAttribute("aria-valuenow", "240");
  });

  it("stops observing its column when it unmounts", () => {
    // Arrange
    renderedWidth(200);
    const { unmount } = render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle aria-label="Resize" />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );
    const observer = MockResizeObserver.latest!;
    expect(observer.observed.size).toBe(1);

    // Act
    unmount();

    // Assert
    expect(observer.observed.size).toBe(0);
  });

  it("ends a drag when the handle unmounts mid-drag", () => {
    // Arrange
    renderedWidth(200);
    let hide = () => {};
    function Strip() {
      const [shown, setShown] = useState(true);
      hide = () => setShown(false);
      return (
        <MillerColumns.Root>
          <MillerColumns.Column>
            {shown ? <MillerColumns.ResizeHandle aria-label="Resize" /> : null}
            <MillerColumns.Item value="a">A</MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Root>
      );
    }
    render(<Strip />);
    fireEvent.pointerDown(screen.getByRole("separator"), { clientX: 0 });

    // Act
    act(() => hide());
    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { clientX: 40 }));
    });

    // Assert — the column keeps the width CSS gives it
    expect(screen.getByRole("group").style.width).toBe("");
  });

  it("marks itself with empty-string hooks, and while dragging", () => {
    // Arrange
    renderedWidth(200);
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle aria-label="Resize" />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );
    const handle = screen.getByRole("separator");

    // Act
    fireEvent.pointerDown(handle, { clientX: 0 });

    // Assert
    expect(handle.getAttribute("data-miller-columns-resize-handle")).toBe("");
    expect(handle.getAttribute("data-dragging")).toBe("");
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"));
    });
  });
});

describe("MillerColumns — item registration", () => {
  it("follows an item's disabled as it changes, so the arrows skip it", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
          <MillerColumns.Item value="b">B</MillerColumns.Item>
          <MillerColumns.Item value="c">C</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Act
    rerender(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
          <MillerColumns.Item value="b" disabled>
            B
          </MillerColumns.Item>
          <MillerColumns.Item value="c">C</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );
    screen.getByRole("treeitem", { name: "A" }).focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(screen.getByRole("treeitem", { name: "C" })).toHaveFocus();
  });

  it("forgets an item once it unmounts, so the arrows no longer reach it", async () => {
    // Arrange — keyed, so React unmounts B rather than reusing its component for C
    const user = userEvent.setup();
    const items = (values: string[]) =>
      values.map((value) => (
        <MillerColumns.Item key={value} value={value}>
          {value.toUpperCase()}
        </MillerColumns.Item>
      ));
    const { rerender } = render(
      <MillerColumns.Root>
        <MillerColumns.Column>{items(["a", "b", "c"])}</MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Act
    rerender(
      <MillerColumns.Root>
        <MillerColumns.Column>{items(["a", "c"])}</MillerColumns.Column>
      </MillerColumns.Root>,
    );
    screen.getByRole("treeitem", { name: "A" }).focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(screen.getByRole("treeitem", { name: "C" })).toHaveFocus();
  });

  it("marks the path, branches and disabled items with empty-string hooks", () => {
    // Arrange & Act
    render(
      <MillerColumns.Root defaultValue={["a"]}>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">
            A
            <MillerColumns.Column>
              <MillerColumns.Item value="x">X</MillerColumns.Item>
            </MillerColumns.Column>
          </MillerColumns.Item>
          <MillerColumns.Item value="b" disabled>
            B
          </MillerColumns.Item>
        </MillerColumns.Column>
        <MillerColumns.PreviewPanel forceMount>Preview</MillerColumns.PreviewPanel>
      </MillerColumns.Root>,
    );

    // Assert
    const a = screen.getByRole("treeitem", { name: "A" });
    expect(a.getAttribute("data-terminal")).toBe("");
    expect(a.getAttribute("data-has-children")).toBe("");
    expect(screen.getByRole("treeitem", { name: "B" }).getAttribute("data-disabled")).toBe("");
  });

  it("marks an empty preview panel with an empty-string hook", () => {
    // Arrange & Act
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
        <MillerColumns.PreviewPanel forceMount>Preview</MillerColumns.PreviewPanel>
      </MillerColumns.Root>,
    );

    // Assert
    expect(screen.getByText("Preview").getAttribute("data-empty")).toBe("");
  });

  it("keys the cell children it unwraps from fragments, so React warns of no duplicate", () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">
            <>
              <span>One</span>
              <span>Two</span>
            </>
            <>
              <span>Three</span>
            </>
          </MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Assert
    expect(error).not.toHaveBeenCalled();
    expect(screen.getByRole("treeitem")).toHaveTextContent("OneTwoThree");
  });
});

describe("MillerColumns — structural hooks", () => {
  it("renders each column slot as display: contents, so the columns sit in the tree's own layout", () => {
    // Arrange & Act
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Assert
    const slot = document.querySelector<HTMLElement>("[data-miller-columns-slot]")!;
    expect(slot.style.display).toBe("contents");
  });

  it("keeps a column's own width until a resize handle sets one", () => {
    // Arrange & Act
    render(
      <MillerColumns.Root>
        <MillerColumns.Column style={{ width: 200 }}>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Assert
    expect(screen.getByRole("group").style.width).toBe("200px");
  });

  it("marks an empty column with an empty-string hook", () => {
    // Arrange & Act
    render(
      <MillerColumns.Root defaultValue={["a"]}>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">
            A
            <MillerColumns.Column />
          </MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Assert
    expect(screen.getAllByRole("group")[1].getAttribute("data-empty")).toBe("");
  });
});

describe("MillerColumns — auto-scroll", () => {
  it("scrolls the strip smoothly to its full scroll width as a column opens", async () => {
    // Arrange
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(Element.prototype, "scrollTo");
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">
            A
            <MillerColumns.Column>
              <MillerColumns.Item value="x">X</MillerColumns.Item>
            </MillerColumns.Column>
          </MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    // Act
    await user.click(screen.getByRole("treeitem", { name: "A" }));

    // Assert
    const strip = document.querySelector("[data-miller-columns-strip]")!;
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: strip.scrollWidth, behavior: "smooth" });
    expect(scrollTo.mock.contexts[0]).toBe(strip);
  });
});

describe("MillerColumns — devtools names", () => {
  it("names each context, so React DevTools shows which one it is", () => {
    expect(MillerColumnsContext.displayName).toBe("MillerColumnsContext");
    expect(MillerColumnsColumnContext.displayName).toBe("MillerColumnsColumnContext");
    expect(MillerColumnsItemContext.displayName).toBe("MillerColumnsItemContext");
  });
});

describe("MillerColumns — part marker", () => {
  it("is the property name a styled wrapper sets to stand in for a part", () => {
    expect(MILLER_COLUMNS_PART).toBe("__primitivMillerColumnsPart");
  });
});
