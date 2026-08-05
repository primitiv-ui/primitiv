import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

const cursorIsOn = (name: string) =>
  expect(screen.getByRole("listbox")).toHaveAttribute(
    "aria-activedescendant",
    screen.getByRole("option", { name }).id,
  );

const selectionIs = (...names: string[]) =>
  expect(
    screen
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true")
      .map((o) => o.textContent),
  ).toEqual(names);

/**
 * Cases that exist to discriminate behaviour the broader suite happens to
 * agree on by coincidence — each one fails against a specific mutant that
 * every other test survives.
 */
describe("Listbox selection identity", () => {
  // A raw string selection would make `includes` a substring test, so "app"
  // would light up whenever "apple" is selected.
  it("compares option values whole, not as substrings", () => {
    render(
      <Listbox.Root type="single" defaultValue="apple" aria-label="Fruits">
        <Listbox.Option value="app">App</Listbox.Option>
        <Listbox.Option value="apple">Apple</Listbox.Option>
      </Listbox.Root>,
    );

    expect(screen.getByRole("option", { name: "App" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps the other selections when one is toggled off", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="multiple"
        defaultValue={["apple", "banana", "cherry"]}
        onValueChange={onValueChange}
        aria-label="Fruits"
      >
        {fruits.map((f) => (
          <Listbox.Option key={f.value} value={f.value}>
            {f.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.click(screen.getByRole("option", { name: "Banana" }));

    selectionIs("Apple", "Cherry");
    expect(onValueChange).toHaveBeenCalledWith(["apple", "cherry"]);
  });

  it("selects without an onValueChange listener", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="multiple" aria-label="Fruits">
        {fruits.map((f) => (
          <Listbox.Option key={f.value} value={f.value}>
            {f.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.click(screen.getByRole("option", { name: "Banana" }));

    selectionIs("Banana");
  });
});

describe("Listbox unmounted options", () => {
  it("drops an unmounted option out of navigation", async () => {
    const user = userEvent.setup();

    function Removable() {
      const [visible, setVisible] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setVisible(false)}>
            Drop
          </button>
          <Listbox.Root type="single" aria-label="Fruits">
            <Listbox.Option value="apple">Apple</Listbox.Option>
            {visible ? (
              <Listbox.Option value="banana">Banana</Listbox.Option>
            ) : null}
            <Listbox.Option value="cherry">Cherry</Listbox.Option>
          </Listbox.Root>
        </>
      );
    }

    render(<Removable />);
    await user.click(screen.getByRole("button", { name: "Drop" }));
    await user.tab();
    await user.keyboard("{ArrowDown}");

    cursorIsOn("Cherry");
  });
});

describe("Listbox range-selection edges", () => {
  it("does not extend past the first option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="multiple"
        defaultValue={["apple"]}
        onValueChange={onValueChange}
        aria-label="Fruits"
      >
        {fruits.map((f) => (
          <Listbox.Option key={f.value} value={f.value}>
            {f.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");

    cursorIsOn("Apple");
    selectionIs("Apple");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("extends onto the very first option rather than skipping it", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="multiple" defaultValue={["banana"]} aria-label="Fruits">
        {fruits.map((f) => (
          <Listbox.Option key={f.value} value={f.value}>
            {f.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");

    cursorIsOn("Apple");
    selectionIs("Apple", "Banana");
  });

  it("sweeps without duplicating an already-selected option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="multiple"
        defaultValue={["apple", "cherry"]}
        onValueChange={onValueChange}
        aria-label="Fruits"
      >
        {fruits.map((f) => (
          <Listbox.Option key={f.value} value={f.value}>
            {f.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

    expect(onValueChange).toHaveBeenCalledWith(["apple", "cherry", "banana"]);
  });
});

describe("Listbox End from a middle option", () => {
  it("jumps to the last option, not the previous one", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" defaultValue="two" aria-label="Numbers">
        <Listbox.Option value="one">One</Listbox.Option>
        <Listbox.Option value="two">Two</Listbox.Option>
        <Listbox.Option value="three">Three</Listbox.Option>
        <Listbox.Option value="four">Four</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{End}");

    cursorIsOn("Four");
  });
});

describe("Listbox typeahead discrimination", () => {
  beforeEach(() => {
    render(
      <Listbox.Root type="single" aria-label="Words">
        <Listbox.Option value="zebra">Zebra</Listbox.Option>
        <Listbox.Option value="apricot">Apricot</Listbox.Option>
        <Listbox.Option value="apple">Apple</Listbox.Option>
      </Listbox.Root>,
    );
  });

  // "ap" is a genuine two-character prefix, so it narrows in place onto the
  // match the cursor is already on. Treating it as a repeat would collapse the
  // query to "a" and skip forward to Apple.
  it("narrows in place instead of advancing on a real prefix", async () => {
    const user = userEvent.setup();

    await user.tab();
    await user.keyboard("a");
    cursorIsOn("Apricot");

    await user.keyboard("p");
    cursorIsOn("Apricot");
  });

  it("leaves the cursor alone when nothing matches", async () => {
    const user = userEvent.setup();

    await user.tab();
    cursorIsOn("Zebra");

    await user.keyboard("q");

    cursorIsOn("Zebra");
  });

  it("does not fold a non-printable key into the query", async () => {
    const user = userEvent.setup();

    await user.tab();
    await user.keyboard("{Escape}");
    await user.keyboard("a");

    cursorIsOn("Apricot");
  });
});

describe("Listbox typeahead with no cursor", () => {
  it("matches from the very top, including the first option", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Listbox.Root type="single" aria-label="Fruits" />,
    );

    await user.tab();
    rerender(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="apricot">Apricot</Listbox.Option>
        <Listbox.Option value="avocado">Avocado</Listbox.Option>
      </Listbox.Root>,
    );

    // Every option matches, so a scan that starts anywhere but index 0 lands
    // somewhere visibly different rather than wrapping back onto Apple.
    await user.keyboard("a");

    cursorIsOn("Apple");
  });
});

describe("Listbox activation and typeahead do not collide", () => {
  // Space activates, so it must not also land in the typeahead buffer — a
  // stray leading space would make every following search miss.
  it("still runs typeahead after Space has activated an option", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        {fruits.map((f) => (
          <Listbox.Option key={f.value} value={f.value}>
            {f.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard(" ");
    await user.keyboard("b");

    cursorIsOn("Banana");
  });
});

describe("Listbox GroupLabel strict context", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("names <Listbox.Group> when a GroupLabel is rendered outside one", () => {
    expect(() =>
      render(
        <Listbox.Root type="single" aria-label="Fruits">
          <Listbox.GroupLabel>Citrus</Listbox.GroupLabel>
        </Listbox.Root>,
      ),
    ).toThrow("Listbox.GroupLabel must be rendered as a child of Listbox.Group");
  });
});

describe("Listbox reactive option props", () => {
  it("picks up an option becoming disabled after mount", async () => {
    const user = userEvent.setup();

    function Toggleable() {
      const [locked, setLocked] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setLocked(true)}>
            Lock
          </button>
          <Listbox.Root type="single" aria-label="Fruits">
            <Listbox.Option value="apple">Apple</Listbox.Option>
            <Listbox.Option value="banana" disabled={locked}>
              Banana
            </Listbox.Option>
            <Listbox.Option value="cherry">Cherry</Listbox.Option>
          </Listbox.Root>
        </>
      );
    }

    render(<Toggleable />);
    await user.click(screen.getByRole("button", { name: "Lock" }));
    await user.tab();
    await user.keyboard("{ArrowDown}");

    cursorIsOn("Cherry");
  });

  it("leaves aria-disabled off an enabled option", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
      </Listbox.Root>,
    );

    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

describe("Listbox GroupLabel lifecycle", () => {
  it("falls back to the label prop when the heading unmounts", async () => {
    const user = userEvent.setup();

    function Swappable() {
      const [heading, setHeading] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setHeading(false)}>
            Hide
          </button>
          <Listbox.Root type="single" aria-label="Fruits">
            <Listbox.Group label="Fallback">
              {heading ? (
                <Listbox.GroupLabel>Citrus</Listbox.GroupLabel>
              ) : null}
              <Listbox.Option value="lemon">Lemon</Listbox.Option>
            </Listbox.Group>
          </Listbox.Root>
        </>
      );
    }

    render(<Swappable />);
    expect(screen.getByRole("group", { name: "Citrus" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide" }));

    const group = screen.getByRole("group", { name: "Fallback" });
    expect(group).toHaveAttribute("aria-label", "Fallback");
    expect(group).not.toHaveAttribute("aria-labelledby");
  });
});

describe("Listbox chord requirements", () => {
  // The range sweep needs Ctrl/Cmd AND Shift. Shift+Home alone is a plain
  // cursor move, so requiring only one of the two would sweep unbidden.
  it.each([
    ["Shift+Home", "{Shift>}{Home}{/Shift}", "Apple"],
    ["Shift+End", "{Shift>}{End}{/Shift}", "Cherry"],
  ])("%s moves the cursor without sweeping a selection", async (_n, keys, landing) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="multiple"
        defaultValue={["banana"]}
        onValueChange={onValueChange}
        aria-label="Fruits"
      >
        {fruits.map((f) => (
          <Listbox.Option key={f.value} value={f.value}>
            {f.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard(keys);

    cursorIsOn(landing);
    selectionIs("Banana");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("Listbox typeahead entry point", () => {
  // With no cursor the scan must start at index 0. A sentinel of +1 instead of
  // -1 would silently enter the list one option in.
  it("starts a multi-character search at the very first option", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Listbox.Root type="single" aria-label="Fruits" />,
    );

    await user.tab();
    rerender(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="apricot">Apricot</Listbox.Option>
        <Listbox.Option value="banana">Banana</Listbox.Option>
      </Listbox.Root>,
    );

    await user.keyboard("ap");

    cursorIsOn("Apple");
  });

  it("matches an option whose text is padded with whitespace", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana">{"  Banana  "}</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("b");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });
});
