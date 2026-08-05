import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

describe("Listbox asChild", () => {
  it("renders the Root as a consumer-supplied element", () => {
    render(
      <Listbox.Root type="single" asChild aria-label="Fruits">
        <ul>
          <Listbox.Option value="apple">Apple</Listbox.Option>
        </ul>
      </Listbox.Root>,
    );

    const listbox = screen.getByRole("listbox");
    expect(listbox.tagName).toBe("UL");
    expect(listbox).toHaveAttribute("tabindex", "0");
  });

  it("renders an Option as a consumer-supplied element and composes its handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple" asChild>
          <li onClick={onClick}>Apple</li>
        </Listbox.Option>
      </Listbox.Root>,
    );

    const apple = screen.getByRole("option", { name: "Apple" });
    expect(apple.tagName).toBe("LI");

    await user.click(apple);

    expect(onClick).toHaveBeenCalled();
    expect(apple).toHaveAttribute("aria-selected", "true");
  });

  it("renders a Group as a consumer-supplied element", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Group label="Citrus" asChild>
          <section>
            <Listbox.Option value="lemon">Lemon</Listbox.Option>
          </section>
        </Listbox.Group>
      </Listbox.Root>,
    );

    expect(screen.getByRole("group", { name: "Citrus" }).tagName).toBe(
      "SECTION",
    );
  });

  it("renders a GroupLabel as a consumer-supplied element", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Group>
          <Listbox.GroupLabel asChild>
            <h3>Citrus</h3>
          </Listbox.GroupLabel>
          <Listbox.Option value="lemon">Lemon</Listbox.Option>
        </Listbox.Group>
      </Listbox.Root>,
    );

    const heading = screen.getByText("Citrus");
    expect(heading.tagName).toBe("H3");
    expect(screen.getByRole("group", { name: "Citrus" })).toHaveAttribute(
      "aria-labelledby",
      heading.id,
    );
  });

  it("forwards a ref through an asChild Option", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple" asChild ref={ref}>
          <li>Apple</li>
        </Listbox.Option>
      </Listbox.Root>,
    );

    expect(ref.current).toBe(screen.getByRole("option", { name: "Apple" }));
  });
});
