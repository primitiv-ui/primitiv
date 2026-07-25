import type { ReactElement } from "react";

import { NavigationMenu } from "../NavigationMenu";
import type { NavigationMenuRootProps } from "../types";

/** The three-entry nav used across the interaction suites: two panelled
 * entries either side of a plain link entry, which is what exercises the
 * "an Item without a value is a link, not a disclosure" contract. */
export function ThreeEntryNav(props: NavigationMenuRootProps): ReactElement {
  return (
    <NavigationMenu.Root {...props}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="concepts">
          <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="concepts-panel">
            <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
            <NavigationMenu.Link href="/themes">Themes</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/changelog">Changelog</NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="registry">
          <NavigationMenu.Trigger>Registry &amp; CLI</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="registry-panel">
            <NavigationMenu.Link href="/cli">CLI</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

/** A nav whose two disclosure entries are both dead ends for keyboard focus:
 * `panelless` renders no `Content` at all, and `prose`'s panel holds nothing
 * focusable. Between them they cover the enter-panel arrow's two
 * nothing-to-focus cases — no panel element, and a panel with no target. */
export function DeadEndNav(props: NavigationMenuRootProps): ReactElement {
  return (
    <NavigationMenu.Root {...props}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="panelless">
          <NavigationMenu.Trigger>Panelless</NavigationMenu.Trigger>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="prose">
          <NavigationMenu.Trigger>Prose</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="prose-panel">
            Nothing in this panel can take focus.
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

/** Arrow-key cases for a horizontal LTR nav. `from` / `expected` are the
 * accessible names of the top-level entries in `ThreeEntryNav`. */
export const horizontalArrowCases = [
  { key: "{ArrowRight}", from: "Concepts", expected: "Changelog" },
  { key: "{ArrowRight}", from: "Registry & CLI", expected: "Concepts" },
  { key: "{ArrowLeft}", from: "Concepts", expected: "Registry & CLI" },
  { key: "{ArrowLeft}", from: "Changelog", expected: "Concepts" },
  { key: "{Home}", from: "Changelog", expected: "Concepts" },
  { key: "{End}", from: "Concepts", expected: "Registry & CLI" },
] as const;

/** The same movements under `dir="rtl"`: only the horizontal pair inverts,
 * Home/End stay anchored to the start/end of the list. */
export const rtlArrowCases = [
  { key: "{ArrowLeft}", from: "Concepts", expected: "Changelog" },
  { key: "{ArrowRight}", from: "Concepts", expected: "Registry & CLI" },
  { key: "{Home}", from: "Changelog", expected: "Concepts" },
] as const;

/** Vertical orientation binds the up/down pair instead. */
export const verticalArrowCases = [
  { key: "{ArrowDown}", from: "Concepts", expected: "Changelog" },
  { key: "{ArrowUp}", from: "Concepts", expected: "Registry & CLI" },
] as const;
