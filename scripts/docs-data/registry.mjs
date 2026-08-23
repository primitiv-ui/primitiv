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
  button: {
    displayName: "Button", kind: "registry", status: "stable", category: "Buttons",
    propsFile: "packages/react/src/Button/types.ts",
    subComponents: [{ name: "Button", propsType: "ButtonProps", element: "button" }],
    contract: "registry/components/button/contract.json",
    figmaComponentSetKey: "347:14161", importPath: "@primitiv-ui/react",
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
  select: {
    displayName: "Select", kind: "registry", status: "stable", category: "Collections & Selection",
    propsFile: "packages/react/src/Select/types.ts",
    subComponents: [
      { name: "Select.Root", propsType: "SelectRootProps", element: "div", component: "Root" },
      { name: "Select.Trigger", propsType: "SelectTriggerProps", element: "button", component: "Trigger" },
      { name: "Select.Value", propsType: "SelectValueProps", element: "span", component: "value" },
      { name: "Select.Placeholder", propsType: "SelectPlaceholderProps", element: "span", component: "value" },
      { name: "Select.Content", propsType: "SelectContentProps", element: "div", component: "content" },
      { name: "Select.Item", propsType: "SelectItemProps", element: "div", component: "item" },
      { name: "Select.ItemIndicator", propsType: "SelectItemIndicatorProps", element: "span", component: "item-indicator" },
      { name: "Select.Group", propsType: "SelectGroupProps", element: "div", component: "group" },
      { name: "Select.Separator", propsType: "SelectSeparatorProps", element: "div", component: "separator" },
    ],
    contract: "registry/components/select/contract.json",
    figmaComponentSetKey: "1816:61259", importPath: "@primitiv-ui/react",
  },
};
