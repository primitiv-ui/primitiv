import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MillerColumns } from "../MillerColumns";

function Tree({ defaultValue }: { defaultValue?: string[] }) {
  return (
    <MillerColumns.Root defaultValue={defaultValue}>
      <MillerColumns.Column>
        <MillerColumns.Item value="fruit">
          Fruit
          <MillerColumns.Column>
            <MillerColumns.Item value="apple">
              Apple
              <MillerColumns.Column>
                <MillerColumns.Item value="gala">Gala</MillerColumns.Item>
              </MillerColumns.Column>
            </MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Item>
        <MillerColumns.Item value="veg">Veg</MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

describe("MillerColumns — auto-scroll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls the strip to reveal a newly opened column", async () => {
    const user = userEvent.setup();

    const { container } = render(<Tree />);

    const strip = container.querySelector<HTMLElement>(
      "[data-miller-columns-strip]",
    )!;
    const scrollTo = vi.spyOn(strip, "scrollTo");

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    expect(scrollTo).toHaveBeenCalled();
  });

  it("does not scroll on the initial render", () => {
    const scrollTo = vi.spyOn(Element.prototype, "scrollTo");

    render(<Tree defaultValue={["fruit", "apple"]} />);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does not scroll when a column is closed", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));
    await user.click(screen.getByRole("treeitem", { name: "Apple" }));

    const strip = screen.getByRole("tree");
    const scrollTo = vi.spyOn(strip, "scrollTo");

    await user.click(screen.getByRole("treeitem", { name: "Veg" }));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
