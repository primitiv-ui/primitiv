import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "../Combobox";

describe("Combobox asChild", () => {
  it("renders the consumer's element for each part", () => {
    render(
      <Combobox.Root asChild defaultOpen>
        <section data-testid="root">
          <Combobox.Input asChild aria-label="Framework">
            <input data-testid="input" />
          </Combobox.Input>
          <Combobox.Content asChild aria-label="Frameworks">
            <ul data-testid="content">
              <Combobox.Item asChild value="react">
                <li data-testid="item">React</li>
              </Combobox.Item>
              <Combobox.Empty asChild>
                <p data-testid="empty">Nothing</p>
              </Combobox.Empty>
            </ul>
          </Combobox.Content>
        </section>
      </Combobox.Root>,
    );

    expect(screen.getByTestId("root").tagName).toBe("SECTION");
    expect(screen.getByTestId("content").tagName).toBe("UL");
    expect(screen.getByTestId("item").tagName).toBe("LI");
    expect(screen.getByTestId("empty").tagName).toBe("P");

    // the behaviour-bearing props still land on the consumer's elements
    expect(screen.getByTestId("input")).toHaveAttribute("role", "combobox");
    expect(screen.getByTestId("content")).toHaveAttribute("role", "listbox");
    expect(screen.getByTestId("item")).toHaveAttribute("role", "option");
    expect(screen.getByTestId("empty")).toHaveAttribute("role", "presentation");
  });

  it("composes the consumer's handlers rather than replacing them", async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    const onValueChange = vi.fn();

    render(
      <Combobox.Root defaultOpen onValueChange={onValueChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item asChild value="react">
            <li onClick={onItemClick}>React</li>
          </Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole("option", { name: "React" }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("react");
  });
});
