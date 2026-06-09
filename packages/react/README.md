# @primitiv-ui/react

Headless, accessible React components built on the
[WAI-ARIA authoring patterns](https://www.w3.org/WAI/ARIA/apg/patterns/).
Zero styles ship with this package — style them with whatever system you use
(CSS, Tailwind, CSS-in-JS, design tokens, etc.).

## Installation

The package is part of the Primitiv monorepo. Within the workspace, import
directly:

```tsx
import { Tabs } from "@primitiv-ui/react";
```

## Components

| Component                                | Description                                                                                                                                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [AccessibleIcon](src/AccessibleIcon/README.md) | Accessible name for an icon-only control — clones a single decorative icon with `aria-hidden`/`focusable="false"` and pairs it with a `VisuallyHidden` text label |
| [Accordion](src/Accordion/README.md)     | WAI-ARIA Accordion pattern — collapsible sections with keyboard navigation, controlled/uncontrolled state, multiple mode, and `asChild` composition                                                                                                                                     |
| [Alert](src/Alert/README.md)             | WAI-ARIA `alert` role — an assertive live region for high-priority, time-sensitive messages, rendered conditionally so it announces on appearance, with `asChild` composition |
| [Avatar](src/Avatar/README.md)           | User image with a graceful fallback — a compound component tracking the image load lifecycle (including browser cache hits), an optional `delayMs` to avoid a flash of fallback content, `data-status` styling hooks, and `asChild` composition                                          |
| [Breadcrumb](src/Breadcrumb/README.md)   | WAI-ARIA Breadcrumb pattern — stateless compound component: a `<nav>` landmark wrapping an ordered list of ancestor-page links, decorative separators with a configurable glyph, an `aria-current` current page, and `asChild` composition on the link                                  |
| [Button](src/Button/README.md)           | Headless semantic `<button>` with `type="button"` default, ref forwarding, `disabled` with `data-disabled` styling hook, and `asChild` composition                                                                                                                                     |
| [Carousel](src/Carousel/README.md)       | WAI-ARIA Carousel pattern — compound component built on native CSS scroll-snap with swipe support, keyboard navigation, slide indicators, optional auto-rotation with WCAG 2.2.2 pause behaviour, and `asChild` composition                                                             |
| [Checkbox](src/Checkbox/README.md)       | WAI-ARIA Checkbox pattern — native `<button role="checkbox">` with tri-state (`"indeterminate"` / `aria-checked="mixed"`), controlled/uncontrolled state, `Indicator` slot, and `asChild` composition                                                                                   |
| [CheckboxCard](src/CheckboxCard/README.md) | WAI-ARIA Checkbox pattern in a card/tile layout — the entire card surface is the interactive element, with tri-state support, controlled/uncontrolled state, `Indicator` slot, `disabled` with `data-disabled` styling hook, and `asChild` composition                                |
| [Collapsible](src/Collapsible/README.md) | Single-panel show/hide — boolean controlled/uncontrolled state, `disabled`, `asChild` composition with explicit Enter/Space handling, `forceMount` for CSS-Grid-driven animation, and `TriggerIcon` slot                                                                                |
| [ContextMenu](src/ContextMenu/README.md) | WAI-ARIA Menu pattern for right-click / long-press / context-key menus — native HTML `popover` compound component positioned at the cursor, with nested submenus, checkbox and radio items, `ItemIndicator` icon slot, groups and labels, keyboard navigation, typeahead, disabled-item skipping, `onSelect` escape hatch, and `asChild` composition |
| [DirectionProvider](src/DirectionProvider/README.md) | Reading-direction context — broadcasts `ltr`/`rtl` to descendants and exposes the `useDirection` hook so direction-aware components inherit `dir` instead of each being passed it explicitly; renders no DOM |
| [Divider](src/Divider/README.md)         | WAI-ARIA separator role — horizontal or vertical content separator, with semantic and decorative use                                                                                                                                                                                    |
| [Dropdown](src/Dropdown/README.md)       | WAI-ARIA Menu Button / Menu pattern — native HTML `popover` compound component with nested submenus, checkbox and radio items, `ItemIndicator` icon slot, groups and labels, keyboard navigation, typeahead, disabled-item skipping, `onSelect` escape hatch, and `asChild` composition |
| [EmptyState](src/EmptyState/README.md)   | Placeholder for empty collections, searches, and views — stateless compound component: a `role="status"` live region announcing on appearance, an `aria-hidden` `Media` illustration slot, `Title` and `Description` copy, an `Actions` recovery slot, and `asChild` composition on every part |
| [Field](src/Field/README.md)             | Headless form-field coordinator — provides `FieldContext` with auto-generated `id` (via `useId`) and derived `descriptionId` / `errorId`, plus `invalid` / `disabled` / `required` cascade; sub-components for `Label` (`htmlFor`-wired), `Description`, and `ErrorText` (auto-gated by invalid state, `role="alert"`); `Input` opts in automatically when nested |
| [Fieldset](src/Fieldset/README.md)       | Headless form-control grouping — a stateless `<fieldset>` / `<legend>` compound with an implicit `group` role, a legend-supplied accessible name, and `disabled` (cascading to every nested control) with a `data-disabled` styling hook |
| [Input](src/Input/README.md)             | Headless single-line text input — native `<input>` with `type="text"` default, full attribute pass-through (works directly with `react-hook-form`'s `register` spread), ref forwarding, native constraint validation, `disabled` with `data-disabled` styling hook, and `asChild` composition |
| [InputGroup](src/InputGroup/README.md)   | Stateless frame for `Input` (or any framed control) with named leading and trailing adornment slots — decorative icons, currency symbols, clear buttons, password-reveal toggles; `data-input-group` / `data-input-group-adornment` styling hooks, CSS-driven disabled / invalid / focus-within state via `:has()`, and `asChild` composition on every part |
| [MillerColumns](src/MillerColumns/README.md) | Miller columns / cascading-lists pattern — a horizontal strip of `role="group"` columns of `role="treeitem"` items, authored by recursive composition with portal-projected child columns, controlled/uncontrolled active path, single-tabstop roving keyboard navigation, disabled items, and `asChild` composition |
| [Modal](src/Modal/README.md)             | WAI-ARIA Modal Dialog pattern — native `<dialog>`-based compound component with Portal, bounding-rect click-outside, controlled/uncontrolled state, escape hatches, imperative API, `asChild`, and `forceMount` animation hooks                                                         |
| [Portal](src/Portal/README.md)           | DOM-escape utility — renders children into `document.body` (or a consumer-supplied container) via `createPortal`; compose with any component that needs to break out of the current stacking context                                                                                    |
| [Progress](src/Progress/README.md)       | WAI-ARIA progressbar pattern — display-only compound component reflecting a consumer-supplied `value`, with determinate/indeterminate states, configurable `max`, `getValueLabel` for `aria-valuetext`, `data-*` styling hooks on the fill `Indicator`, and `asChild` composition          |
| [RadioCard](src/RadioCard/README.md)     | WAI-ARIA Radio Group pattern in a card/tile layout — the entire card surface is the interactive element, with single-selection state, roving tabindex, arrow-key navigation, disabled-item skipping, `Indicator` slot, and `asChild` composition                                        |
| [RadioGroup](src/RadioGroup/README.md)   | WAI-ARIA Radio Group pattern — native `<button role="radio">` items with single-selection state, roving tabindex, arrow-key navigation, disabled-item skipping, `Indicator` slot, and `asChild` composition                                                                             |
| [Select](src/Select/README.md)           | Headless wrapper over native `<select>` / `<option>` / `<optgroup>` — controlled/uncontrolled state via `onValueChange`, `Select.Placeholder` with auto-`defaultValue` inference, `Select.Group` for optgroup labelling, `data-disabled` styling hook, `asChild` composition, and Field-aware (opts into `FieldContext` for auto-wired `id` / `aria-describedby` / `aria-invalid` / `disabled` / `required`) |
| [SkipNav](src/SkipNav/README.md)         | WCAG 2.4.1 Bypass Blocks technique — a stateless "skip to main content" link and its `tabIndex=-1` focus target, connected by a shared content id, working with no JavaScript at runtime |
| [Slider](src/Slider/README.md)           | WAI-ARIA Slider & Multi-Thumb Slider pattern — an array-valued range input with any number of independently focusable thumbs, keyboard and pointer dragging, `min`/`max`/`step`, `minStepsBetweenThumbs`, horizontal/vertical orientation, RTL and `inverted` direction, `onValueCommit`, hidden inputs for form submission, `disabled` with `data-disabled` styling hook, and `asChild` composition                                              |
| [Status](src/Status/README.md)           | WAI-ARIA `status` role — a polite live region for low-priority, non-urgent status messages, announced once the user is idle, with `asChild` composition |
| [Switch](src/Switch/README.md)           | WAI-ARIA Switch pattern — `<button role="switch">` with binary on/off state, always-mounted `Thumb` sub-component for CSS-driven sliding animation, controlled/uncontrolled state, `data-disabled` styling hook, and `asChild` composition                                              |
| [Table](src/Table/README.md)             | WAI-ARIA Table pattern — compound component wrapping standard HTML table elements with accessible headers, captions, and a responsive scroll wrapper                                                                                                                                    |
| [Tabs](src/Tabs/README.md)               | WAI-ARIA Tabs pattern — compound component with keyboard navigation, controlled/uncontrolled state, and `asChild` composition                                                                                                                                                           |
| [Textarea](src/Textarea/README.md)       | Headless multi-line text input — native `<textarea>` with full attribute pass-through, ref forwarding, `disabled` with `data-disabled` styling hook, `asChild` composition for wrapping autosizing implementations, and Field-aware (opts into `FieldContext` for auto-wired `id` / `aria-describedby` / `aria-invalid` / `disabled` / `required`) |
| [Toggle](src/Toggle/README.md)           | WAI-ARIA Button pattern with `aria-pressed` — single stateful toggle button with controlled/uncontrolled state, `data-state` styling hook, and `asChild` composition                                                                                                                   |
| [ToggleGroup](src/ToggleGroup/README.md) | Grouped toggle buttons with roving-tabindex keyboard navigation — `type="single"` (at most one pressed, re-press deselects) or `type="multiple"` (items toggle independently), controlled/uncontrolled state, disabled-item skipping, and `asChild` composition                        |
| [Tooltip](src/Tooltip/README.md)         | WAI-ARIA Tooltip pattern — hover/focus-triggered description panel with configurable delay, skip-delay across multiple tooltips, grace period for hoverable content, CSS-anchor-positioning placement (no JS measurement), Portal, controlled/uncontrolled state, and `asChild` composition |
| [Tree](src/Tree/README.md)               | WAI-ARIA Tree pattern — hierarchical tree view authored by recursive composition with `Branch`/`BranchControl`/`BranchContent`, controlled/uncontrolled expansion, single or multiple selection with Ctrl/Cmd and Shift+click range, `forceMount` for branch animation, single-tabstop roving keyboard navigation, disabled items, and `asChild` composition |
| [VisuallyHidden](src/VisuallyHidden/README.md) | Screen-reader-only primitive — visually hides its children with the canonical clip styles while keeping them in the accessibility tree, with consumer `style` merging and `asChild` composition |

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
