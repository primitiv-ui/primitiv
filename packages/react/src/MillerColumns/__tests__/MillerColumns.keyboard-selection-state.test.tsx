import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MillerColumns } from "../MillerColumns";

function Tree() {
  return (
    <MillerColumns.Root>
      <MillerColumns.Column>
        <MillerColumns.Item value="documents">
          Documents
          <MillerColumns.Column>
            <MillerColumns.Item value="work">Work</MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Item>
        <MillerColumns.Item value="pictures">
          Pictures
          <MillerColumns.Column>
            <MillerColumns.Item value="holiday">
              Holiday
              <MillerColumns.Column>
                <MillerColumns.Item value="beach">beach.jpg</MillerColumns.Item>
                <MillerColumns.Item value="sunset">sunset.jpg</MillerColumns.Item>
              </MillerColumns.Column>
            </MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

const state = (name: string) =>
  screen.getByRole("treeitem", { name }).getAttribute("data-state");
const terminal = (name: string) =>
  screen.getByRole("treeitem", { name }).hasAttribute("data-terminal");

describe("MillerColumns — selection state under keyboard navigation", () => {
  it("deselects the previous branch when arrowing to a sibling and stepping in", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(screen.getByRole("treeitem", { name: "Documents" }));
    expect(state("Documents")).toBe("selected");

    // Down to Pictures, then right to open it — Documents must let go.
    await user.keyboard("{ArrowDown}{ArrowRight}");

    expect(state("Pictures")).toBe("selected");
    expect(state("Documents")).toBe("unselected");
  });

  it("keeps exactly one terminal item as focus moves deeper", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(screen.getByRole("treeitem", { name: "Pictures" }));
    await user.click(screen.getByRole("treeitem", { name: "Holiday" }));

    expect(state("Pictures")).toBe("selected");
    expect(terminal("Pictures")).toBe(false);
    expect(terminal("Holiday")).toBe(true);

    // Arrowing within the revealed column moves focus only — it must not
    // change which row is terminal.
    await user.keyboard("{ArrowRight}{ArrowDown}");

    expect(screen.getByRole("treeitem", { name: "sunset.jpg" })).toHaveFocus();
    expect(terminal("Holiday")).toBe(true);
    expect(terminal("sunset.jpg")).toBe(false);
    expect(state("Documents")).toBe("unselected");
  });
});
