import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MillerColumns } from "../MillerColumns";

function Resizable({
  dir,
  ...handleProps
}: {
  dir?: "ltr" | "rtl";
  minWidth?: number;
  maxWidth?: number;
  step?: number;
}) {
  return (
    <MillerColumns.Root dir={dir}>
      <MillerColumns.Column>
        <MillerColumns.ResizeHandle aria-label="Resize" {...handleProps} />
        <MillerColumns.Item value="a">A</MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

describe("MillerColumns — resize handle", () => {
  it("renders a vertical separator inside a column", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const handle = screen.getByRole("separator");

    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("data-miller-columns-resize-handle");
  });

  it("is a focusable splitter carrying its value range", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle
            aria-label="Resize"
            minWidth={120}
            maxWidth={400}
          />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const handle = screen.getByRole("separator", { name: "Resize" });

    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("aria-valuemin", "120");
    expect(handle).toHaveAttribute("aria-valuemax", "400");
    expect(handle).toHaveAttribute("aria-valuenow");
  });

  it("steps the column width with the arrow keys", async () => {
    const user = userEvent.setup();

    render(<Resizable minWidth={100} maxWidth={400} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    // Seed a known width so stepping is measured from something.
    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 200 });
    fireEvent.pointerUp(window);

    handle.focus();
    await user.keyboard("{ArrowRight}");
    expect(column).toHaveStyle({ width: "210px" });

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(column).toHaveStyle({ width: "190px" });
  });

  it("honours a custom step", async () => {
    const user = userEvent.setup();

    render(<Resizable minWidth={100} maxWidth={400} step={25} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 200 });
    fireEvent.pointerUp(window);

    handle.focus();
    await user.keyboard("{ArrowRight}");

    expect(column).toHaveStyle({ width: "225px" });
  });

  it("clamps stepping to the min and max width", async () => {
    const user = userEvent.setup();

    render(<Resizable minWidth={100} maxWidth={220} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 215 });
    fireEvent.pointerUp(window);

    handle.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(column).toHaveStyle({ width: "220px" });
    expect(handle).toHaveAttribute("aria-valuenow", "220");
  });

  it("jumps to the min and max width with Home and End", async () => {
    const user = userEvent.setup();

    render(<Resizable minWidth={100} maxWidth={400} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    handle.focus();
    await user.keyboard("{End}");
    expect(column).toHaveStyle({ width: "400px" });

    await user.keyboard("{Home}");
    expect(column).toHaveStyle({ width: "100px" });
  });

  it("mirrors the stepping arrows under rtl", async () => {
    const user = userEvent.setup();

    render(<Resizable dir="rtl" minWidth={100} maxWidth={400} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 200 });
    fireEvent.pointerUp(window);

    handle.focus();
    // The column grows leftwards in rtl, so ArrowLeft widens it.
    await user.keyboard("{ArrowLeft}");

    expect(column).toHaveStyle({ width: "210px" });
  });

  it("leaves the width alone for keys it does not handle", async () => {
    const user = userEvent.setup();

    render(<Resizable minWidth={100} maxWidth={400} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 200 });
    fireEvent.pointerUp(window);

    handle.focus();
    await user.keyboard("{ArrowUp}{ArrowDown}a");

    expect(column).toHaveStyle({ width: "200px" });
  });

  it("ignores End when no maxWidth bounds the column", async () => {
    const user = userEvent.setup();

    // Without a maxWidth there is no largest width to jump to, so End
    // must not resize to Infinity.
    render(<Resizable minWidth={100} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 200 });
    fireEvent.pointerUp(window);

    handle.focus();
    await user.keyboard("{End}");

    expect(handle).toHaveAttribute("aria-valuenow", "200");
    expect(column).toHaveStyle({ width: "200px" });
    expect(handle).not.toHaveAttribute("aria-valuemax");
  });

  it("clamps a pointer drag to the min and max width", () => {
    render(<Resizable minWidth={120} maxWidth={260} />);

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 1000 });
    expect(column).toHaveStyle({ width: "260px" });

    fireEvent.pointerMove(window, { clientX: -1000 });
    expect(column).toHaveStyle({ width: "120px" });
  });

  it("throws when ResizeHandle is rendered outside Column", () => {
    expect(() =>
      render(
        <MillerColumns.Root>
          <MillerColumns.ResizeHandle />
        </MillerColumns.Root>,
      ),
    ).toThrow("<MillerColumns.Column>");
  });

  it("resizes its column on pointer drag", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 260 });
    fireEvent.pointerUp(window);

    expect(column).toHaveStyle({ width: "160px" });
  });

  it("continues a second drag from the already-resized width", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 260 });
    fireEvent.pointerUp(window);

    fireEvent.pointerDown(handle, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 40 });
    fireEvent.pointerUp(window);

    expect(column).toHaveStyle({ width: "200px" });
  });

  it("does not resize a column below zero width", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: -500 });

    expect(column).toHaveStyle({ width: "0px" });
  });

  it("exposes a data-dragging hook while a drag is in progress", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const handle = screen.getByRole("separator");

    expect(handle).not.toHaveAttribute("data-dragging");

    fireEvent.pointerDown(handle, { clientX: 0 });
    expect(handle).toHaveAttribute("data-dragging");

    fireEvent.pointerUp(window);
    expect(handle).not.toHaveAttribute("data-dragging");
  });

  it("composes a consumer onPointerDown with the drag", () => {
    const onPointerDown = vi.fn();

    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.ResizeHandle onPointerDown={onPointerDown} />
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const handle = screen.getByRole("separator");
    const column = screen.getByRole("group");

    fireEvent.pointerDown(handle, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 200 });

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(column).toHaveStyle({ width: "100px" });
  });
});
