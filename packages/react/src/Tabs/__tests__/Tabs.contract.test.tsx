import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render, screen } from "@testing-library/react";

import { Tabs } from "../Tabs";

/**
 * Auto-verification of the Tabs styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/tabs/contract.json` is *derived from and
 * asserted against the rendered headless component* so it can never drift from
 * what the component actually emits. Tabs is the first **structural** compound:
 * its data-* surface is spread across the root container and the `list` /
 * `trigger` / `content` subcomponents, so the guard walks each part by its ARIA
 * role. The authored half (BEM classes, modifiers, custom properties) is a
 * styling convention the headless layer does not emit and is checked by the
 * generator drift-guards instead.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/tabs/contract.json",
);
const contract = JSON.parse(readFileSync(contractPath, "utf8"));

type DataAttribute = { name: string; value: string; when: string; source: string };

/** Every `data-*` attribute name present on an element, sorted and de-duped. */
function dataAttributeNames(element: Element): string[] {
  return [
    ...new Set(
      [...element.attributes]
        .map((attribute) => attribute.name)
        .filter((name) => name.startsWith("data-")),
    ),
  ].sort();
}

/** The distinct auto-verified data-* names a part's contract declares. */
function contractedNames(dataAttributes: DataAttribute[]): string[] {
  return [
    ...new Set(
      dataAttributes
        .filter((attribute) => attribute.source === "auto")
        .map((attribute) => attribute.name),
    ),
  ].sort();
}

const subcontract = (name: string): { dataAttributes: DataAttribute[] } =>
  contract.subcomponents.find((sub: { name: string }) => sub.name === name);

function renderTabs(orientation: "horizontal" | "vertical" = "horizontal") {
  return render(
    <Tabs.Root defaultValue="a" orientation={orientation}>
      <Tabs.List label="Sections">
        <Tabs.Trigger value="a">A</Tabs.Trigger>
        <Tabs.Trigger value="b" disabled>
          B
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">Panel A</Tabs.Content>
      <Tabs.Content value="b">Panel B</Tabs.Content>
    </Tabs.Root>,
  );
}

describe("Tabs styling contract", () => {
  it("declares every data-* attribute on every part as auto-verified", () => {
    const all: DataAttribute[] = [
      ...contract.dataAttributes,
      ...contract.subcomponents.flatMap(
        (sub: { dataAttributes: DataAttribute[] }) => sub.dataAttributes,
      ),
    ];
    expect(all.every((attribute) => attribute.source === "auto")).toBe(true);
  });

  it("root emits exactly its contracted data-* names", () => {
    const { container } = renderTabs();
    const root = container.firstElementChild as HTMLElement;
    expect(dataAttributeNames(root)).toEqual(contractedNames(contract.dataAttributes));
  });

  it("list emits exactly its contracted data-* names", () => {
    renderTabs();
    expect(dataAttributeNames(screen.getByRole("tablist"))).toEqual(
      contractedNames(subcontract("list").dataAttributes),
    );
  });

  it("trigger emits exactly its contracted data-* names across its states", () => {
    renderTabs();
    const emitted = new Set<string>();
    for (const trigger of screen.getAllByRole("tab")) {
      for (const name of dataAttributeNames(trigger)) emitted.add(name);
    }
    expect([...emitted].sort()).toEqual(
      contractedNames(subcontract("trigger").dataAttributes),
    );
  });

  it("content emits exactly its contracted data-* names across its states", () => {
    renderTabs();
    const emitted = new Set<string>();
    for (const panel of screen.getAllByRole("tabpanel", { hidden: true })) {
      for (const name of dataAttributeNames(panel)) emitted.add(name);
    }
    expect([...emitted].sort()).toEqual(
      contractedNames(subcontract("content").dataAttributes),
    );
  });

  it("emits data-state with the documented value on trigger and content", () => {
    renderTabs();
    const [activeTrigger, inactiveTrigger] = screen.getAllByRole("tab");
    expect(activeTrigger).toHaveAttribute("data-state", "active");
    expect(inactiveTrigger).toHaveAttribute("data-state", "inactive");

    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels[0]).toHaveAttribute("data-state", "active");
    expect(panels[1]).toHaveAttribute("data-state", "inactive");
  });

  it("emits data-orientation with the documented value on every part", () => {
    const { container, unmount } = renderTabs("vertical");
    expect(container.firstElementChild).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByRole("tablist")).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getAllByRole("tabpanel", { hidden: true })[0]).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
    unmount();

    renderTabs("horizontal");
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute(
      "data-orientation",
      "horizontal",
    );
  });

  it("emits data-disabled on the trigger exactly as the contract documents it", () => {
    const entry = subcontract("trigger").dataAttributes.find(
      (attribute) => attribute.name === "data-disabled",
    )!;
    renderTabs();
    const [enabledTrigger, disabledTrigger] = screen.getAllByRole("tab");
    // Button/Switch convention: present as "" when disabled, omitted otherwise.
    expect(disabledTrigger).toHaveAttribute("data-disabled", entry.value);
    expect(enabledTrigger).not.toHaveAttribute("data-disabled");
  });
});
