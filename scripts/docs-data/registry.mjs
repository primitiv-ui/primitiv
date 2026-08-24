/*
 * Which components have a docs page, and where each one's source lives.
 *
 * Its own module because two scripts need the same list: `extract-docs-data.mjs`
 * builds ONE component's JSON from it, and `sync-docs-data.mjs` iterates every
 * key to regenerate the set and to check the committed files are current. A
 * second copy of this list would drift the moment a component was added — which
 * is the whole failure mode the sync script exists to catch.
 *
 * `category` groups the component on the /components index. The names and their
 * order are the canonical set the rest of the repo already uses — the
 * kitchen-sink's own `PAGE_TOC` and the Figma file's page-section dividers — so
 * this is a fourth copy of that list only in the sense that it is the one the
 * docs site can read. The index's `CATEGORY_ORDER` types these as a union, so a
 * typo here fails the docs-site typecheck rather than silently dropping a card.
 *
 * Adding a component page starts here: add an entry, then run
 * `node scripts/docs-data/sync-docs-data.mjs`.
 */
export const REGISTRY = {
  badge: {
    displayName: "Badge", kind: "registry-only", status: "stable", category: "Data Display",
    /* Primitive-less: the props live in the copied file, not packages/react. */
    propsFile: "registry/components/badge/badge.tsx",
    subComponents: [
      { name: "Badge", propsType: "BadgeProps", element: "span", component: "Badge" },
    ],
    contract: "registry/components/badge/contract.json",
    figmaComponentSetKey: "1387:32589", importPath: "@/components/ui/badge",
  },
  button: {
    displayName: "Button", kind: "registry", status: "stable", category: "Buttons",
    propsFile: "packages/react/src/Button/types.ts",
    subComponents: [{ name: "Button", propsType: "ButtonProps", element: "button" }],
    contract: "registry/components/button/contract.json",
    figmaComponentSetKey: "347:14161", importPath: "@primitiv-ui/react",
  },
  input: {
    displayName: "Input", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/Input/types.ts",
    subComponents: [
      { name: "Input", propsType: "InputProps", element: "input", component: "Input" },
    ],
    contract: "registry/components/input/contract.json",
    figmaComponentSetKey: "393:6159", importPath: "@primitiv-ui/react",
  },
  tabs: {
    displayName: "Tabs", kind: "registry", status: "stable", category: "Disclosure",
    propsFile: "packages/react/src/Tabs/types.ts",
    subComponents: [
      { name: "Tabs.Root", propsType: "TabsRootProps", element: "div", component: "Root" },
      { name: "Tabs.List", propsType: "TabsListProps", element: "div", component: "List" },
      { name: "Tabs.Trigger", propsType: "TabsTriggerProps", element: "button", component: "Trigger" },
      { name: "Tabs.Content", propsType: "TabsContentProps", element: "div", component: "Content" },
    ],
    contract: "registry/components/tabs/contract.json",
    figmaComponentSetKey: "425:5528", importPath: "@primitiv-ui/react",
  },
  // Select is the compound stress case for the docs layout: 9 documented parts,
  // so the "Props" section fans out into 9 tables and the page needs a nested
  // TOC (§1.20). `Select.Root`'s controlled/uncontrolled discriminated union
  // flattens here — the extractor drops the `never` branches, so the
  // mutual exclusivity of value/onValueChange XOR defaultValue is NOT
  // recoverable from this data and has to be prose on the page (§1.20.2).
  modal: {
    displayName: "Modal", kind: "registry", status: "stable", category: "Overlays",
    propsFile: "packages/react/src/Modal/types.ts",
    subComponents: [
      { name: "Modal.Root", propsType: "ModalRootProps", element: "div", component: "Root" },
      { name: "Modal.Trigger", propsType: "ModalTriggerProps", element: "button", component: "Trigger" },
      { name: "Modal.Portal", propsType: "ModalPortalProps", element: "div", component: "Portal" },
      { name: "Modal.Overlay", propsType: "ModalOverlayProps", element: "div", component: "Overlay" },
      { name: "Modal.Content", propsType: "ModalContentProps", element: "dialog", component: "Content" },
      { name: "Modal.Header", propsType: "ModalHeaderProps", propsFile: "registry/components/modal/modal.tsx", element: "div", component: "Header" },
      { name: "Modal.Body", propsType: "ModalBodyProps", propsFile: "registry/components/modal/modal.tsx", element: "div", component: "Body" },
      { name: "Modal.Footer", propsType: "ModalFooterProps", propsFile: "registry/components/modal/modal.tsx", element: "div", component: "Footer" },
      { name: "Modal.Title", propsType: "ModalTitleProps", element: "h2", component: "Title" },
      { name: "Modal.Description", propsType: "ModalDescriptionProps", element: "p", component: "Description" },
      { name: "Modal.Close", propsType: "ModalCloseProps", element: "button", component: "Close" },
    ],
    contract: "registry/components/modal/contract.json",
    figmaComponentSetKey: "435:10250", importPath: "@primitiv-ui/react",
  },
  select: {
    displayName: "Select", kind: "registry", status: "stable", category: "Collections & Selection",
    propsFile: "packages/react/src/Select/types.ts",
    subComponents: [
      { name: "Select.Root", propsType: "SelectRootProps", element: "div", component: "Root" },
      { name: "Select.Trigger", propsType: "SelectTriggerProps", element: "button", component: "Trigger" },
      { name: "Select.Value", propsType: "SelectValueProps", element: "span", component: "Value" },
      { name: "Select.Placeholder", propsType: "SelectPlaceholderProps", element: "span", component: "placeholder" },
      { name: "Select.Content", propsType: "SelectContentProps", element: "div", component: "Content" },
      { name: "Select.Item", propsType: "SelectItemProps", element: "div", component: "Item" },
      { name: "Select.ItemIndicator", propsType: "SelectItemIndicatorProps", element: "span", component: "ItemIndicator" },
      { name: "Select.Group", propsType: "SelectGroupProps", element: "div", component: "Group" },
      { name: "Select.Separator", propsType: "SelectSeparatorProps", element: "div", component: "Separator" },
    ],
    contract: "registry/components/select/contract.json",
    figmaComponentSetKey: "1816:61259", importPath: "@primitiv-ui/react",
  },
};

/*
 * Every registry component's group on the /components index.
 *
 * The categories and their order are the kitchen-sink's `PAGE_TOC`; anything its
 * TOC does not list (the prose components, Carousel) is placed by the Figma
 * file's page-section dividers, which use the same names. One deliberate
 * disagreement: Figma files `Table` under PROSE, the kitchen-sink under Data
 * Display — the kitchen-sink wins, since that is the grouping a reader of this
 * repo meets first.
 *
 * Hand-authored because it genuinely cannot be derived: `registry.json` carries
 * no category, and neither does any contract. It is checked for completeness at
 * generation time — `sync-docs-data.mjs` throws if a registry component is
 * missing here or if an id here no longer exists, so the list cannot rot
 * quietly while the page silently drops a card.
 */
export const CATEGORIES = {
  // Layout
  "aspect-ratio": "Layout", box: "Layout", center: "Layout",
  container: "Layout", divider: "Layout", grid: "Layout",
  stack: "Layout", spacer: "Layout",
  // Buttons
  button: "Buttons", "split-button": "Buttons",
  // Forms
  checkbox: "Forms", "checkbox-card": "Forms", field: "Forms",
  input: "Forms", "input-group": "Forms", radio: "Forms",
  "radio-card": "Forms", "segmented-control": "Forms", slider: "Forms",
  switch: "Forms", textarea: "Forms",
  // Collections & Selection
  combobox: "Collections & Selection", listbox: "Collections & Selection",
  "miller-columns": "Collections & Selection", select: "Collections & Selection",
  tree: "Collections & Selection",
  // Typography — the prose family
  blockquote: "Typography", "code-block": "Typography",
  "description-list": "Typography", figure: "Typography",
  "inline-code": "Typography", kbd: "Typography", list: "Typography",
  prose: "Typography", "pull-quote": "Typography",
  // Overlays
  "confirm-dialog": "Overlays", "context-menu": "Overlays", drawer: "Overlays",
  dropdown: "Overlays", modal: "Overlays", popover: "Overlays",
  tooltip: "Overlays",
  // Feedback & Status
  alert: "Feedback & Status", "empty-state": "Feedback & Status",
  progress: "Feedback & Status",
  // Disclosure
  accordion: "Disclosure", breadcrumb: "Disclosure",
  "breadcrumb-overflow": "Disclosure", carousel: "Disclosure",
  collapsible: "Disclosure", pagination: "Disclosure", stepper: "Disclosure",
  tabs: "Disclosure",
  // Navigation
  "navigation-menu": "Navigation", "toggle-group": "Navigation",
  // Data Display
  avatar: "Data Display", "avatar-group": "Data Display", badge: "Data Display",
  card: "Data Display", chip: "Data Display", "data-table": "Data Display",
  table: "Data Display", tag: "Data Display",
};

/*
 * Where kebab-to-Title-Case gets the name wrong. Each of these is one word as
 * the component exports it (`CheckboxCard`, not `Checkbox Card`), and the page
 * should call it what you would type.
 */
export const DISPLAY_NAME_OVERRIDES = {
  "checkbox-card": "CheckboxCard",
  "radio-card": "RadioCard",
  "empty-state": "EmptyState",
  kbd: "Kbd",
};
