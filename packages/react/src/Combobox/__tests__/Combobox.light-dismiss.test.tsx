import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "../Combobox";

/**
 * Light dismiss — clicking outside an open combobox closes it.
 *
 * The popup is a `popover="auto"` element, so the browser does the outside-click
 * detection itself and reports it back as a `toggle` event; there is deliberately
 * no hand-rolled pointerdown-outside listener. That is the same pattern
 * `useSelectContent` uses, and these tests drive it the same way Select's do: by
 * dispatching the `toggle` the browser would have sent, since jsdom implements
 * neither the top layer nor real light-dismiss.
 */
function renderCombobox(onOpenChange?: (open: boolean) => void) {
  return render(
    <Combobox.Root defaultOpen onOpenChange={onOpenChange}>
      <Combobox.Input aria-label="Framework" />
      <Combobox.Content aria-label="Frameworks">
        <Combobox.Item value="react">React</Combobox.Item>
        <Combobox.Item value="preact">Preact</Combobox.Item>
      </Combobox.Content>
    </Combobox.Root>,
  );
}

const listbox = () => screen.getByRole("listbox", { hidden: true });

const dismiss = (element: HTMLElement) => {
  const event = new Event("toggle");
  Object.defineProperty(event, "newState", { value: "closed" });
  fireEvent(element, event);
};

describe("Combobox light dismiss", () => {
  it("closes when the popup reports a browser light-dismiss", () => {
    renderCombobox();
    const input = screen.getByRole("combobox", { name: "Framework" });
    expect(input).toHaveAttribute("aria-expanded", "true");

    dismiss(listbox());

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument();
  });

  it("ignores a toggle to open, so an opening popup does not thrash state", () => {
    const onOpenChange = vi.fn();
    renderCombobox(onOpenChange);
    const input = screen.getByRole("combobox", { name: "Framework" });

    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "open" });
    fireEvent(listbox(), event);

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("still dismisses when the consumer attaches its own ref to the popup", () => {
    // The popup needs an internal ref to call showPopover() on. A consumer ref
    // must compose with it rather than replace it, or the whole popover
    // machinery — top layer and light dismiss alike — silently stops working.
    const consumerRef = { current: null as HTMLDivElement | null };
    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks" ref={consumerRef}>
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    expect(consumerRef.current).not.toBeNull();

    dismiss(listbox());

    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("restores the committed label, so a dismissed query never lingers", async () => {
    const user = userEvent.setup();
    renderCombobox();
    const input = screen.getByRole("combobox", { name: "Framework" });

    await user.click(screen.getByRole("option", { hidden: true, name: "React" }));
    await user.type(input, "zzz");
    expect(input).toHaveValue("Reactzzz");

    dismiss(listbox());

    // Same contract as Escape: dismissing abandons the query rather than leaving
    // the field showing text that is not the value.
    expect(input).toHaveValue("React");
  });
});
