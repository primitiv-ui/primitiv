// Single source of truth for the React component docs.
//
// Each entry maps a `@primitiv-ui/react` component to:
//   - the README included verbatim on its page
//     (packages/react/src/<name>/README.md)
//   - the workbench example whose source is embedded as a runnable sample
//     (apps/workbench/src/pages/<name>Example/<name>Example.tsx)
//
// `scripts/gen-react-pages.mjs` reads this list to (re)generate the thin
// per-component pages under `react/`; `.vitepress/config.ts` reads it to build
// the React sidebar. Keep it in sync with packages/react/src.

/** PascalCase component name -> kebab-case page slug (Button -> button). */
export function slugFor(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/** @typedef {{ name: string, group: string }} ReactComponent */

/** @type {ReactComponent[]} */
export const reactComponents = [
  { name: "Divider", group: "Layout" },
  { name: "Button", group: "Buttons" },
  { name: "Checkbox", group: "Forms" },
  { name: "CheckboxCard", group: "Forms" },
  { name: "Field", group: "Forms" },
  { name: "Fieldset", group: "Forms" },
  { name: "Input", group: "Forms" },
  { name: "InputGroup", group: "Forms" },
  { name: "RadioGroup", group: "Forms" },
  { name: "RadioCard", group: "Forms" },
  { name: "Select", group: "Forms" },
  { name: "Slider", group: "Forms" },
  { name: "Switch", group: "Forms" },
  { name: "Textarea", group: "Forms" },
  { name: "MillerColumns", group: "Collections & Selection" },
  { name: "Tree", group: "Collections & Selection" },
  { name: "ContextMenu", group: "Overlays" },
  { name: "Dropdown", group: "Overlays" },
  { name: "Modal", group: "Overlays" },
  { name: "Tooltip", group: "Overlays" },
  { name: "Accordion", group: "Disclosure" },
  { name: "Breadcrumb", group: "Disclosure" },
  { name: "Carousel", group: "Disclosure" },
  { name: "Collapsible", group: "Disclosure" },
  { name: "Tabs", group: "Disclosure" },
  { name: "Toggle", group: "Navigation" },
  { name: "ToggleGroup", group: "Navigation" },
  { name: "Alert", group: "Feedback & Status" },
  { name: "EmptyState", group: "Feedback & Status" },
  { name: "Progress", group: "Feedback & Status" },
  { name: "Status", group: "Feedback & Status" },
  { name: "Avatar", group: "Data Display" },
  { name: "Table", group: "Data Display" },
  { name: "AccessibleIcon", group: "Utilities" },
  { name: "DirectionProvider", group: "Utilities" },
  { name: "Portal", group: "Utilities" },
  { name: "SkipNav", group: "Utilities" },
  { name: "VisuallyHidden", group: "Utilities" },
];
