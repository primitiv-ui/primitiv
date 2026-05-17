# @primitiv/react

Headless, accessible React components built on the
[WAI-ARIA authoring patterns](https://www.w3.org/WAI/ARIA/apg/patterns/).
Zero styles ship with this package — style them with whatever system you use
(CSS, Tailwind, CSS-in-JS, design tokens, etc.).

## Installation

The package is part of the Primitiv monorepo. Within the workspace, import
directly:

```tsx
import { Tabs } from "@primitiv/react";
```

## Components

| Component                                | Description                                                                                                                                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Accordion](src/Accordion/README.md)     | WAI-ARIA Accordion pattern — collapsible sections with keyboard navigation, controlled/uncontrolled state, multiple mode, and `asChild` composition                                                                                                                                     |
| [Button](src/Button/README.md)           | Headless semantic `<button>` with `type="button"` default, ref forwarding, `disabled` with `data-disabled` styling hook, and `asChild` composition                                                                                                                                     |
| [Carousel](src/Carousel/README.md)       | WAI-ARIA Carousel pattern — compound component built on native CSS scroll-snap with swipe support, keyboard navigation, slide indicators, optional auto-rotation with WCAG 2.2.2 pause behaviour, and `asChild` composition                                                             |
| [Checkbox](src/Checkbox/README.md)       | WAI-ARIA Checkbox pattern — native `<button role="checkbox">` with tri-state (`"indeterminate"` / `aria-checked="mixed"`), controlled/uncontrolled state, `Indicator` slot, and `asChild` composition                                                                                   |
| [CheckboxCard](src/CheckboxCard/README.md) | WAI-ARIA Checkbox pattern in a card/tile layout — the entire card surface is the interactive element, with tri-state support, controlled/uncontrolled state, `Indicator` slot, `disabled` with `data-disabled` styling hook, and `asChild` composition                                |
| [Collapsible](src/Collapsible/README.md) | Single-panel show/hide — boolean controlled/uncontrolled state, `disabled`, `asChild` composition with explicit Enter/Space handling, `forceMount` for CSS-Grid-driven animation, and `TriggerIcon` slot                                                                                |
| [Divider](src/Divider/README.md)         | WAI-ARIA separator role — horizontal or vertical content separator, with semantic and decorative use                                                                                                                                                                                    |
| [Dropdown](src/Dropdown/README.md)       | WAI-ARIA Menu Button / Menu pattern — native HTML `popover` compound component with nested submenus, checkbox and radio items, `ItemIndicator` icon slot, groups and labels, keyboard navigation, typeahead, disabled-item skipping, `onSelect` escape hatch, and `asChild` composition |
| [MillerColumns](src/MillerColumns/README.md) | Miller columns / cascading-lists pattern — a horizontal strip of `role="group"` columns of `role="treeitem"` items, authored by recursive composition with portal-projected child columns, controlled/uncontrolled active path, single-tabstop roving keyboard navigation, disabled items, and `asChild` composition |
| [Modal](src/Modal/README.md)             | WAI-ARIA Modal Dialog pattern — native `<dialog>`-based compound component with Portal, bounding-rect click-outside, controlled/uncontrolled state, escape hatches, imperative API, `asChild`, and `forceMount` animation hooks                                                         |
| [Portal](src/Portal/README.md)           | DOM-escape utility — renders children into `document.body` (or a consumer-supplied container) via `createPortal`; compose with any component that needs to break out of the current stacking context                                                                                    |
| [RadioCard](src/RadioCard/README.md)     | WAI-ARIA Radio Group pattern in a card/tile layout — the entire card surface is the interactive element, with single-selection state, roving tabindex, arrow-key navigation, disabled-item skipping, `Indicator` slot, and `asChild` composition                                        |
| [RadioGroup](src/RadioGroup/README.md)   | WAI-ARIA Radio Group pattern — native `<button role="radio">` items with single-selection state, roving tabindex, arrow-key navigation, disabled-item skipping, `Indicator` slot, and `asChild` composition                                                                             |
| [Slider](src/Slider/README.md)           | WAI-ARIA Slider & Multi-Thumb Slider pattern — an array-valued range input with any number of independently focusable thumbs, keyboard and pointer dragging, `min`/`max`/`step`, `minStepsBetweenThumbs`, horizontal/vertical orientation, RTL and `inverted` direction, `onValueCommit`, hidden inputs for form submission, `disabled` with `data-disabled` styling hook, and `asChild` composition                                              |
| [Switch](src/Switch/README.md)           | WAI-ARIA Switch pattern — `<button role="switch">` with binary on/off state, always-mounted `Thumb` sub-component for CSS-driven sliding animation, controlled/uncontrolled state, `data-disabled` styling hook, and `asChild` composition                                              |
| [Table](src/Table/README.md)             | WAI-ARIA Table pattern — compound component wrapping standard HTML table elements with accessible headers, captions, and a responsive scroll wrapper                                                                                                                                    |
| [Tabs](src/Tabs/README.md)               | WAI-ARIA Tabs pattern — compound component with keyboard navigation, controlled/uncontrolled state, and `asChild` composition                                                                                                                                                           |
| [Toggle](src/Toggle/README.md)           | WAI-ARIA Button pattern with `aria-pressed` — single stateful toggle button with controlled/uncontrolled state, `data-state` styling hook, and `asChild` composition                                                                                                                   |
| [ToggleGroup](src/ToggleGroup/README.md) | Grouped toggle buttons with roving-tabindex keyboard navigation — `type="single"` (at most one pressed, re-press deselects) or `type="multiple"` (items toggle independently), controlled/uncontrolled state, disabled-item skipping, and `asChild` composition                        |
| [Tooltip](src/Tooltip/README.md)         | WAI-ARIA Tooltip pattern — hover/focus-triggered description panel with configurable delay, skip-delay across multiple tooltips, grace period for hoverable content, CSS-anchor-positioning placement (no JS measurement), Portal, controlled/uncontrolled state, and `asChild` composition |

## Internal utilities

**`Slot`** is the `asChild` composition utility used internally by components
such as `Tabs.Trigger`. It is not a public component API.

## Testing

Tests use [Vitest](https://vitest.dev/) and
[Testing Library](https://testing-library.com/).

```sh
# Run all component tests once
npx vitest run

# Watch mode
npx vitest

# With coverage
npx vitest run --coverage
```
