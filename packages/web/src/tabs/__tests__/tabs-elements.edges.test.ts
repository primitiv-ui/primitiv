import { screen } from "@testing-library/dom";

import { defineTabs } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineTabs();
  document.body.innerHTML = html;
  await Promise.resolve();
}

describe("<primitiv-tabs> edge cases", () => {
  it("leaves a list named by aria-labelledby alone", async () => {
    // Arrange & Act
    await mount(
      '<h2 id="heading">Sections</h2><primitiv-tabs value="one">' +
        '<primitiv-tabs-list aria-labelledby="heading">' +
        '<primitiv-tabs-trigger value="one"><button type="button">One</button></primitiv-tabs-trigger>' +
        "</primitiv-tabs-list></primitiv-tabs>",
    );

    // Assert
    const list = screen.getByRole("tablist", { name: "Sections" });
    expect(list.hasAttribute("aria-label")).toBe(false);
  });

  it("gives a tab with no panel no aria-controls", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-tabs value="one"><primitiv-tabs-list label="Sections">' +
        '<primitiv-tabs-trigger value="one"><button type="button">One</button></primitiv-tabs-trigger>' +
        "</primitiv-tabs-list></primitiv-tabs>",
    );

    // Assert
    expect(screen.getByRole("tab", { name: "One" }).hasAttribute("aria-controls")).toBe(false);
  });

  it("leaves a panel with no value untouched", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-tabs value="one"><primitiv-tabs-list label="Sections">' +
        '<primitiv-tabs-trigger value="one"><button type="button">One</button></primitiv-tabs-trigger>' +
        "</primitiv-tabs-list><primitiv-tabs-content>Loose</primitiv-tabs-content></primitiv-tabs>",
    );

    // Assert
    const loose = document.querySelector("primitiv-tabs-content");
    expect(loose?.hasAttribute("role")).toBe(false);
    expect(loose?.hasAttribute("hidden")).toBe(false);
  });

  it.each([
    ["no element child", '<primitiv-tabs-trigger value="two">Two</primitiv-tabs-trigger>'],
    [
      "two element children",
      '<primitiv-tabs-trigger value="two"><button type="button">A</button><button type="button">B</button></primitiv-tabs-trigger>',
    ],
    ["no value", '<primitiv-tabs-trigger><button type="button">Two</button></primitiv-tabs-trigger>'],
  ])("reports a trigger with %s once, and leaves it undecorated", async (_case, trigger) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      '<primitiv-tabs value="one"><primitiv-tabs-list label="Sections">' +
        '<primitiv-tabs-trigger value="one"><button type="button">One</button></primitiv-tabs-trigger>' +
        `${trigger}</primitiv-tabs-list></primitiv-tabs>`,
    );
    document.querySelector("primitiv-tabs")?.setAttribute("value", "one ");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-tabs-trigger>");
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  });
});
