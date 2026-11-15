import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineTable, type ElementRegistry } from "../elements";
import { tableExpandHtml, type TableExpandHtml } from "./table.fixtures";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

async function mount(html: string | TableExpandHtml = {}) {
  defineTable();
  document.body.innerHTML = typeof html === "string" ? html : tableExpandHtml(html);
  await settle();
}

const element = (name: string) =>
  screen.getByRole("button", { name: `Show details for ${name}` }).parentElement as HTMLElement & { expanded: boolean };
const trigger = (name: string) => screen.getByRole("button", { name: `Show details for ${name}` });
const detail = (name: string) => document.getElementById(`${name.toLowerCase()}-details`)!;

describe("defineTable", () => {
  it("defines exactly the expand trigger's tag name on the registry it is given", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: () => undefined,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineTable(registry);

    // Assert
    expect(defined).toEqual(["primitiv-table-expand-trigger"]);
  });
});

describe("<primitiv-table-expand-trigger>", () => {
  it("reflects a user's toggle into expanded and the expanded property", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount();

    // Act
    await user.click(trigger("Ada"));

    // Assert
    expect(element("Ada").hasAttribute("expanded")).toBe(true);
    expect(element("Ada").expanded).toBe(true);
    expect(element("Ada").getAttribute("data-state")).toBe("open");
  });

  it("follows expanded set from outside, by attribute or property", async () => {
    // Arrange
    await mount();

    // Act
    element("Ada").expanded = true;
    element("Grace").setAttribute("expanded", "");
    await settle();

    // Assert
    expect(detail("Ada").hidden).toBe(false);
    expect(detail("Grace").hidden).toBe(false);

    // Act
    element("Ada").expanded = false;
    await settle();

    // Assert
    expect(detail("Ada").getAttribute("hidden")).toBe("");
  });

  it("announces a toggle as a cancelable primitiv-table-expand-change, which a listener can veto", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount();
    const seen: unknown[] = [];
    element("Ada").addEventListener("primitiv-table-expand-change", (event) => {
      seen.push((event as CustomEvent).detail);
      event.preventDefault();
    });

    // Act
    await user.click(trigger("Ada"));

    // Assert
    expect(seen).toEqual([{ expanded: true }]);
    expect(trigger("Ada").getAttribute("aria-expanded")).toBe("false");
  });

  it("announces a detail row as it opens, not on first render", async () => {
    // Arrange
    const user = userEvent.setup();
    const shown: string[] = [];
    document.addEventListener("primitiv-table-expand-show", (event) => shown.push((event.target as HTMLElement).id));
    await mount({ expanded: ["Grace"] });

    // Act
    await user.click(trigger("Ada"));
    await user.click(trigger("Ada"));
    await user.click(trigger("Ada"));

    // Assert
    expect(shown).toEqual(["ada-details", "ada-details"]);
  });

  it("hides a closed detail row from the accessibility tree as well, so a styled row cannot leak", async () => {
    // Arrange & Act
    await mount({ expanded: ["Grace"] });

    // Assert
    expect(detail("Ada").getAttribute("aria-hidden")).toBe("true");
    expect(detail("Grace").hasAttribute("aria-hidden")).toBe(false);
  });

  it("disables the toggle, marking its button, while disabled", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount({ attrs: " disabled" });

    // Act
    await user.click(trigger("Ada"));

    // Assert
    expect(trigger("Ada").getAttribute("aria-disabled")).toBe("true");
    expect(trigger("Ada").getAttribute("data-disabled")).toBe("");
    expect(detail("Ada").hidden).toBe(true);

    // Act
    element("Ada").removeAttribute("disabled");
    await settle();

    // Assert
    expect(trigger("Ada").hasAttribute("aria-disabled")).toBe(false);
    expect(trigger("Ada").hasAttribute("data-disabled")).toBe(false);
  });

  it("follows force-mount as it changes", async () => {
    // Arrange
    await mount();

    // Act
    element("Ada").setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(detail("Ada").hidden).toBe(false);
    expect(detail("Ada").getAttribute("aria-hidden")).toBe("true");
  });

  it("follows the detail row its button names as aria-controls changes, with nothing else changing", async () => {
    // Arrange
    await mount({ expanded: ["Ada"] });
    const extra = document.createElement("tr");
    extra.id = "extra-details";
    document.querySelector("tbody")!.append(extra);

    // Act
    trigger("Ada").setAttribute("aria-controls", "extra-details");
    await settle();

    // Assert
    expect(extra.getAttribute("data-state")).toBe("open");
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount({ expanded: ["Grace"] });
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    // Act
    document.body.innerHTML = rendered;
    await settle();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
  });

  it("reports a trigger without exactly one element child once, and leaves it alone", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const thrown: unknown[] = [];
    const onError = (event: ErrorEvent) => thrown.push(event.error);
    window.addEventListener("error", onError);
    const user = userEvent.setup();

    // Act
    await mount(`<primitiv-table-expand-trigger><button type="button">A</button><button type="button">B</button></primitiv-table-expand-trigger>`);
    document.querySelector("primitiv-table-expand-trigger")!.setAttribute("expanded", "");
    await settle();
    await user.click(screen.getAllByRole("button")[0]);
    window.removeEventListener("error", onError);

    // Assert — nothing is registered, so the press does nothing and throws nothing
    expect(thrown).toEqual([]);

    // Assert
    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0]![0])).toContain("<primitiv-table-expand-trigger> needs exactly one element child");
    expect(screen.getAllByRole("button")[0].hasAttribute("aria-expanded")).toBe(false);
  });

  it("still states its own state when its button names no detail row that exists", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      `<primitiv-table-expand-trigger><button type="button" aria-controls="nowhere">Show details for Ada</button></primitiv-table-expand-trigger>` +
        `<primitiv-table-expand-trigger><button type="button">Show details for Grace</button></primitiv-table-expand-trigger>`,
    );

    // Act
    await user.click(trigger("Ada"));
    await user.click(trigger("Grace"));

    // Assert
    expect(trigger("Ada").getAttribute("aria-expanded")).toBe("true");
    expect(trigger("Grace").getAttribute("aria-expanded")).toBe("true");
  });

  it("finds its detail row inside a shadow root", async () => {
    // Arrange
    const user = userEvent.setup();
    defineTable();
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = tableExpandHtml();
    await settle();

    // Act
    await user.click(shadow.querySelector("button")!);

    // Assert
    expect(shadow.getElementById("ada-details")!.hidden).toBe(false);
  });
});
