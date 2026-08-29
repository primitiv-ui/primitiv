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
  accordion: {
    displayName: "Accordion", kind: "registry", status: "stable", category: "Disclosure",
    propsFile: "packages/react/src/Accordion/types.ts",
    subComponents: [
      { name: "Accordion.Root", propsType: "AccordionRootProps", element: "div", component: "Root" },
      { name: "Accordion.Item", propsType: "AccordionItemProps", element: "div", component: "Item" },
      { name: "Accordion.Header", propsType: "AccordionHeaderProps", element: "h3", component: "Header" },
      { name: "Accordion.Trigger", propsType: "AccordionTriggerProps", element: "button", component: "Trigger" },
      { name: "Accordion.Content", propsType: "AccordionContentProps", element: "div", component: "Content" },
      { name: "Accordion.TriggerIcon", propsType: "AccordionTriggerIconProps", element: "span", component: "TriggerIcon" },
    ],
    contract: "registry/components/accordion/contract.json",
    /* The file has no single composed Accordion set — this is `Accordion/Item`,
       the trigger, which is the more useful of the two landing points. */
    figmaComponentSetKey: "416:6729", importPath: "@primitiv-ui/react",
  },
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
  checkbox: {
    displayName: "Checkbox", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/Checkbox/types.ts",
    subComponents: [
      /*
       * `element: "input"`, though the Root RENDERS a `<label>`.
       *
       * This field only picks the interface named in "Extends ... - every native
       * attribute of that element is accepted and forwarded", and the Root's
       * props are `Omit<ComponentProps<"input">, ...>`: everything but
       * `className`/`style` spreads onto the nested `<input>`, which is where
       * `name`, `required`, `form` and friends have to land. Naming the label
       * here would print an interface none of its props come from.
       */
      { name: "Checkbox.Root", propsType: "CheckboxRootProps", element: "input", component: "Root" },
      { name: "Checkbox.Indicator", propsType: "CheckboxIndicatorProps", element: "span", component: "Indicator" },
    ],
    contract: "registry/components/checkbox/contract.json",
    figmaComponentSetKey: "369:30652", importPath: "@primitiv-ui/react",
  },
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
  switch: {
    displayName: "Switch", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/Switch/types.ts",
    subComponents: [
      /*
       * `element: "input"` though the Root RENDERS a `<label>` — the same call
       * Checkbox documents above, for the same reason: the Root's props are
       * `Omit<ComponentProps<"input">, ...>` and everything but `className` /
       * `style` spreads onto the hidden `<input>`, which is where `name`,
       * `value`, `required` and `form` have to land.
       */
      { name: "Switch.Root", propsType: "SwitchRootProps", element: "input", component: "Root" },
      /*
       * Headless-only, and the INVERSE of Modal's styled-only regions: the
       * copied `switch.tsx` exports just `Switch` and renders the thumb itself,
       * so `SwitchThumb` exists nowhere in the styled surface. The extractor
       * derives that from the registry file's exports; the contract's `thumb`
       * part carries no `component` key, so the "no contract entry" warning on
       * extract is expected here rather than a typo.
       */
      { name: "Switch.Thumb", propsType: "SwitchThumbProps", element: "span", component: "Thumb" },
    ],
    contract: "registry/components/switch/contract.json",
    figmaComponentSetKey: "315:5884", importPath: "@primitiv-ui/react",
  },
  "checkbox-card": {
    displayName: "CheckboxCard", kind: "registry", status: "stable", category: "Forms",
    /*
     * The REGISTRY file, not packages/react — deliberately. The copied surface
     * takes `title` / `description` / `showDescription` INSTEAD of children (it
     * composes the card's anatomy itself), and those are its primary API. The
     * headless `CheckboxCardRootProps` knows nothing about them, so pointing at
     * it would leave the props a reader actually types undocumented. The
     * intersection still carries the headless state API through
     * `ComponentPropsWithRef<typeof CheckboxCard.Root>`.
     */
    propsFile: "registry/components/checkbox-card/checkbox-card.tsx",
    subComponents: [
      /* Dotted, and `component: "Root"`. `partName` only mode-switches a part
         whose name contains a dot, so a bare "CheckboxCard" printed as
         "CheckboxCard" under Headless too, where it should read
         "CheckboxCard.Root". `partNamer` special-cases "Root" and prints the
         bare component name back for Styled. */
      { name: "CheckboxCard.Root", propsType: "CheckboxCardProps", element: "button", component: "Root" },
      /*
       * Headless-only, and it needs its own propsFile because this entry's is
       * the registry file. The copied surface renders the mark itself, so
       * `CheckboxCardIndicator` exists nowhere in the styled path — a headless
       * consumer, who composes Root + Indicator + their own content, does need it.
       */
      { name: "CheckboxCard.Indicator", propsType: "CheckboxCardIndicatorProps", element: "span",
        component: "Indicator", propsFile: "packages/react/src/CheckboxCard/types.ts" },
    ],
    contract: "registry/components/checkbox-card/contract.json",
    figmaComponentSetKey: "1417:34712", importPath: "@primitiv-ui/react",
  },
  "radio-card": {
    displayName: "RadioCard", kind: "registry", status: "stable", category: "Forms",
    /* The registry file, for the reason checkbox-card gives above: `title` /
       `description` / `showDescription` are the Item's primary API and the
       headless type has never heard of them. */
    propsFile: "registry/components/radio-card/radio-card.tsx",
    subComponents: [
      /*
       * The group has NO contract entry, and that is correct rather than a typo:
       * `RadioCard.Root` is a plain `<div role="radiogroup">` with no styling of
       * its own — the copied wrapper is a pure pass-through, and the contract's
       * root describes the CARD (element button, class primitiv-radio-card),
       * which is the Item below.
       */
      { name: "RadioCard.Root", propsType: "RadioCardProps", element: "div", component: "Root" },
      { name: "RadioCard.Item", propsType: "RadioCardItemProps", element: "button", component: "Item" },
      { name: "RadioCard.Indicator", propsType: "RadioCardIndicatorProps", element: "span",
        component: "Indicator", propsFile: "packages/react/src/RadioCard/types.ts" },
    ],
    contract: "registry/components/radio-card/contract.json",
    figmaComponentSetKey: "1417:35178", importPath: "@primitiv-ui/react",
  },
  alert: {
    displayName: "Alert", kind: "registry", status: "stable", category: "Feedback & Status",
    /*
     * The REGISTRY file. The headless `Alert` is a bare `<div role="alert">`
     * taking only `asChild` + `children`; every prop worth documenting —
     * `tone`, `title`, `icon`, `onDismiss`, `dismissLabel` — belongs to the
     * copied surface. Same call as the cards'.
     */
    propsFile: "registry/components/alert/alert.tsx",
    subComponents: [
      /*
       * NOT dotted, and that is correct: both surfaces export a single `Alert`.
       * The headless one is not a compound, so there is no `Alert.Root` for
       * Headless mode to switch to.
       */
      { name: "Alert", propsType: "AlertProps", element: "div", component: "Alert" },
    ],
    contract: "registry/components/alert/contract.json",
    figmaComponentSetKey: "1114:40295", importPath: "@primitiv-ui/react",
  },
  progress: {
    displayName: "Progress", kind: "registry", status: "stable", category: "Feedback & Status",
    propsFile: "packages/react/src/Progress/types.ts",
    subComponents: [
      { name: "Progress.Root", propsType: "ProgressRootProps", element: "div", component: "Root" },
      { name: "Progress.Indicator", propsType: "ProgressIndicatorProps", element: "div", component: "Indicator" },
    ],
    contract: "registry/components/progress/contract.json",
    figmaComponentSetKey: "1219:45786", importPath: "@primitiv-ui/react",
  },
  "empty-state": {
    displayName: "EmptyState", kind: "registry", status: "stable", category: "Feedback & Status",
    propsFile: "packages/react/src/EmptyState/types.ts",
    subComponents: [
      /* Root's own propsFile is the registry file: `orientation` and `size` are
         the copied surface's, and the headless Root has neither. */
      { name: "EmptyState.Root", propsType: "EmptyStateProps", propsFile: "registry/components/empty-state/empty-state.tsx", element: "div", component: "Root" },
      { name: "EmptyState.Media", propsType: "EmptyStateMediaProps", element: "div", component: "Media" },
      { name: "EmptyState.Title", propsType: "EmptyStateTitleProps", element: "p", component: "Title" },
      { name: "EmptyState.Description", propsType: "EmptyStateDescriptionProps", element: "p", component: "Description" },
      { name: "EmptyState.Actions", propsType: "EmptyStateActionsProps", element: "div", component: "Actions" },
    ],
    contract: "registry/components/empty-state/contract.json",
    figmaComponentSetKey: "1502:47398", importPath: "@primitiv-ui/react",
  },
  field: {
    displayName: "Field", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/Field/types.ts",
    subComponents: [
      { name: "Field.Root", propsType: "FieldRootProps", element: "div", component: "Root" },
      { name: "Field.Label", propsType: "FieldLabelProps", element: "label", component: "Label" },
      { name: "Field.Description", propsType: "FieldDescriptionProps", element: "div", component: "Description" },
      { name: "Field.ErrorText", propsType: "FieldErrorTextProps", element: "div", component: "ErrorText" },
    ],
    contract: "registry/components/field/contract.json",
    figmaComponentSetKey: "394:7449", importPath: "@primitiv-ui/react",
  },
  "input-group": {
    displayName: "InputGroup", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/InputGroup/types.ts",
    subComponents: [
      { name: "InputGroup.Root", propsType: "InputGroupRootProps", element: "div", component: "Root" },
      /* Both slots share ONE props type — they differ only in which side they
         sit on, so the extractor prints the same table twice. That is honest
         rather than a mistake: there is genuinely no prop that distinguishes
         them. */
      { name: "InputGroup.LeadingAdornment", propsType: "InputGroupAdornmentProps", element: "span", component: "LeadingAdornment" },
      { name: "InputGroup.TrailingAdornment", propsType: "InputGroupAdornmentProps", element: "span", component: "TrailingAdornment" },
    ],
    contract: "registry/components/input-group/contract.json",
    /*
     * No `figmaComponentSetKey`: the Figma file has no InputGroup set. Its
     * adornment case is a note on Input's own entry ("pairs with InputGroup for
     * the leading colour-swatch slot"), not a component of its own. Pointing the
     * Design link at Input would land a designer on a different component, so
     * the header omits the link and the Installation panel says the component is
     * not in the Figma library yet.
     */
    importPath: "@primitiv-ui/react",
  },
  "toggle-group": {
    displayName: "ToggleGroup", kind: "registry", status: "stable", category: "Navigation",
    propsFile: "packages/react/src/ToggleGroup/types.ts",
    subComponents: [
      { name: "ToggleGroup.Root", propsType: "ToggleGroupRootProps", element: "div", component: "Root" },
      { name: "ToggleGroup.Item", propsType: "ToggleGroupItemProps", element: "button", component: "Item" },
    ],
    contract: "registry/components/toggle-group/contract.json",
    /* The composed track set, built 2026-08-26; `733:239` is the Item it
       composes. Both were redesigned onto the framed-control anatomy — see the
       page "Toggle Group — exploration". */
    figmaComponentSetKey: "2045:1395", importPath: "@primitiv-ui/react",
  },
  radio: {
    displayName: "Radio", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/Radio/types.ts",
    subComponents: [
      /* `element: "input"` though the Root renders a `<label>` — see Checkbox. */
      { name: "Radio.Root", propsType: "RadioRootProps", element: "input", component: "Root" },
      /* Headless-only, like Switch.Thumb: the copied `radio.tsx` exports one
         `Radio` and renders the dot itself, so the "no contract entry" warning
         on extract is expected rather than a typo. */
      { name: "Radio.Indicator", propsType: "RadioIndicatorProps", element: "span", component: "Indicator" },
    ],
    contract: "registry/components/radio/contract.json",
    figmaComponentSetKey: "401:17958", importPath: "@primitiv-ui/react",
  },
  "segmented-control": {
    displayName: "SegmentedControl", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/SegmentedControl/types.ts",
    subComponents: [
      { name: "SegmentedControl.Root", propsType: "SegmentedControlRootProps", element: "div", component: "Root" },
      { name: "SegmentedControl.Item", propsType: "SegmentedControlItemProps", element: "button", component: "Item" },
    ],
    contract: "registry/components/segmented-control/contract.json",
    /* The track set; `1216:43507` is the Item it composes. */
    figmaComponentSetKey: "1216:44224", importPath: "@primitiv-ui/react",
  },
  slider: {
    displayName: "Slider", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/Slider/types.ts",
    subComponents: [
      { name: "Slider.Root", propsType: "SliderRootProps", element: "span", component: "Root" },
      { name: "Slider.Track", propsType: "SliderTrackProps", element: "span", component: "Track" },
      { name: "Slider.Range", propsType: "SliderRangeProps", element: "span", component: "Range" },
      { name: "Slider.Thumb", propsType: "SliderThumbProps", element: "span", component: "Thumb" },
    ],
    contract: "registry/components/slider/contract.json",
    figmaComponentSetKey: "392:5196", importPath: "@primitiv-ui/react",
  },
  textarea: {
    displayName: "Textarea", kind: "registry", status: "stable", category: "Forms",
    propsFile: "packages/react/src/Textarea/types.ts",
    subComponents: [
      { name: "Textarea", propsType: "TextareaProps", element: "textarea", component: "Textarea" },
    ],
    contract: "registry/components/textarea/contract.json",
    figmaComponentSetKey: "439:14511", importPath: "@primitiv-ui/react",
  },
  box: {
    displayName: "Box", kind: "registry-only", status: "stable", category: "Layout",
    /* Hand-written and primitive-less (RFC 0022): the props live in the copied
       file, not packages/react. Its whole API is `asChild` + native div attrs —
       no modifiers, no custom properties, by design (it is the escape hatch). */
    propsFile: "registry/components/box/box.tsx",
    subComponents: [
      { name: "Box", propsType: "BoxProps", element: "div", component: "Box" },
    ],
    contract: "registry/components/box/contract.json",
    figmaComponentSetKey: "1815:59408", importPath: "@/components/ui/box",
  },
  stack: {
    displayName: "Stack", kind: "registry-only", status: "stable", category: "Layout",
    /* Registry-only, like Box — a hand-written flex layout primitive with no
       headless counterpart (it imports only `Slot`). Its five modifiers
       (direction/gap/align/justify/wrap) are the contract's, so the playground
       derives its controls from them with no spec-declared knobs. */
    propsFile: "registry/components/stack/stack.tsx",
    subComponents: [
      { name: "Stack", propsType: "StackProps", element: "div", component: "Stack" },
    ],
    contract: "registry/components/stack/contract.json",
    figmaComponentSetKey: "1815:59414", importPath: "@/components/ui/stack",
  },
  grid: {
    displayName: "Grid", kind: "registry-only", status: "stable", category: "Layout",
    propsFile: "registry/components/grid/grid.tsx",
    subComponents: [
      { name: "Grid", propsType: "GridProps", element: "div", component: "Grid" },
    ],
    contract: "registry/components/grid/contract.json",
    figmaComponentSetKey: "1815:59457", importPath: "@/components/ui/grid",
  },
  container: {
    displayName: "Container", kind: "registry-only", status: "stable", category: "Layout",
    propsFile: "registry/components/container/container.tsx",
    subComponents: [
      { name: "Container", propsType: "ContainerProps", element: "div", component: "Container" },
    ],
    contract: "registry/components/container/contract.json",
    figmaComponentSetKey: "1765:41081", importPath: "@/components/ui/container",
  },
  center: {
    displayName: "Center", kind: "registry-only", status: "stable", category: "Layout",
    propsFile: "registry/components/center/center.tsx",
    subComponents: [
      { name: "Center", propsType: "CenterProps", element: "div", component: "Center" },
    ],
    contract: "registry/components/center/contract.json",
    figmaComponentSetKey: "1815:59439", importPath: "@/components/ui/center",
  },
  spacer: {
    displayName: "Spacer", kind: "registry-only", status: "stable", category: "Layout",
    propsFile: "registry/components/spacer/spacer.tsx",
    subComponents: [
      { name: "Spacer", propsType: "SpacerProps", element: "div", component: "Spacer" },
    ],
    contract: "registry/components/spacer/contract.json",
    figmaComponentSetKey: "1815:59415", importPath: "@/components/ui/spacer",
  },
  "aspect-ratio": {
    displayName: "AspectRatio", kind: "registry-only", status: "stable", category: "Layout",
    propsFile: "registry/components/aspect-ratio/aspect-ratio.tsx",
    subComponents: [
      { name: "AspectRatio", propsType: "AspectRatioProps", element: "div", component: "AspectRatio" },
    ],
    contract: "registry/components/aspect-ratio/contract.json",
    figmaComponentSetKey: "1815:59456", importPath: "@/components/ui/aspect-ratio",
  },
  kbd: {
    displayName: "Kbd", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/kbd/kbd.tsx",
    subComponents: [
      { name: "Kbd", propsType: "KbdProps", element: "kbd", component: "Kbd" },
    ],
    contract: "registry/components/kbd/contract.json",
    figmaComponentSetKey: "612:35198", importPath: "@/components/ui/kbd",
  },
  "inline-code": {
    displayName: "InlineCode", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/inline-code/inline-code.tsx",
    subComponents: [
      { name: "InlineCode", propsType: "InlineCodeProps", element: "code", component: "InlineCode" },
    ],
    contract: "registry/components/inline-code/contract.json",
    figmaComponentSetKey: "601:9492", importPath: "@/components/ui/inline-code",
  },
  blockquote: {
    displayName: "Blockquote", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/blockquote/blockquote.tsx",
    subComponents: [
      { name: "Blockquote", propsType: "BlockquoteProps", element: "blockquote", component: "Blockquote" },
    ],
    contract: "registry/components/blockquote/contract.json",
    figmaComponentSetKey: "586:8579", importPath: "@/components/ui/blockquote",
  },
  "pull-quote": {
    displayName: "PullQuote", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/pull-quote/pull-quote.tsx",
    subComponents: [
      { name: "PullQuote", propsType: "PullQuoteProps", element: "blockquote", component: "PullQuote" },
    ],
    contract: "registry/components/pull-quote/contract.json",
    figmaComponentSetKey: "588:8752", importPath: "@/components/ui/pull-quote",
  },
  prose: {
    displayName: "Prose", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/prose/prose.tsx",
    subComponents: [
      { name: "Prose", propsType: "ProseProps", element: "div", component: "Prose" },
    ],
    contract: "registry/components/prose/contract.json",
    /* Prose is a flow-rhythm wrapper with no Figma component set of its own —
       like input-group, the header omits the Design link. */
    importPath: "@/components/ui/prose",
  },
  list: {
    displayName: "List", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/list/list.tsx",
    subComponents: [
      { name: "List", propsType: "ListProps", element: "ul", component: "List" },
      { name: "List.Item", propsType: "ListItemProps", element: "li", component: "Item" },
    ],
    contract: "registry/components/list/contract.json",
    figmaComponentSetKey: "586:7300", importPath: "@/components/ui/list",
  },
  "description-list": {
    displayName: "DescriptionList", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/description-list/description-list.tsx",
    subComponents: [
      { name: "DescriptionList", propsType: "DescriptionListProps", element: "dl", component: "Root" },
      { name: "DescriptionList.Term", propsType: "DescriptionListTermProps", element: "dt", component: "Term" },
      { name: "DescriptionList.Details", propsType: "DescriptionListDetailsProps", element: "dd", component: "Details" },
    ],
    contract: "registry/components/description-list/contract.json",
    figmaComponentSetKey: "585:6947", importPath: "@/components/ui/description-list",
  },
  figure: {
    displayName: "Figure", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/figure/figure.tsx",
    subComponents: [
      { name: "Figure", propsType: "FigureProps", element: "figure", component: "Root" },
      { name: "Figure.Media", propsType: "FigureMediaProps", element: "div", component: "Media" },
      { name: "Figure.Caption", propsType: "FigureCaptionProps", element: "figcaption", component: "Caption" },
    ],
    contract: "registry/components/figure/contract.json",
    figmaComponentSetKey: "607:32844", importPath: "@/components/ui/figure",
  },
  "code-block": {
    displayName: "CodeBlock", kind: "registry-only", status: "stable", category: "Typography",
    propsFile: "registry/components/code-block/code-block.tsx",
    subComponents: [
      { name: "CodeBlock", propsType: "CodeBlockProps", element: "div", component: "CodeBlock" },
      { name: "CodeBlock.Tabs", propsType: "CodeBlockTabsProps", element: "div", component: "Tabs" },
      { name: "CodeBlock.Header", propsType: "CodeBlockHeaderProps", element: "div", component: "Header" },
      { name: "CodeBlock.List", propsType: "CodeBlockListProps", element: "div", component: "List" },
      { name: "CodeBlock.Trigger", propsType: "CodeBlockTriggerProps", element: "button", component: "Trigger" },
      { name: "CodeBlock.Content", propsType: "CodeBlockContentProps", element: "div", component: "Content" },
      { name: "CodeBlock.Copy", propsType: "CodeBlockCopyProps", element: "button", component: "Copy" },
    ],
    contract: "registry/components/code-block/contract.json",
    figmaComponentSetKey: "601:9607", importPath: "@/components/ui/code-block",
  },
  tooltip: {
    displayName: "Tooltip", kind: "registry", status: "stable", category: "Overlays",
    propsFile: "packages/react/src/Tooltip/types.ts",
    subComponents: [
      { name: "Tooltip.Provider", propsType: "TooltipProviderProps", element: "div", component: "Provider" },
      { name: "Tooltip.Root", propsType: "TooltipRootProps", element: "div", component: "Root" },
      { name: "Tooltip.Trigger", propsType: "TooltipTriggerProps", element: "button", component: "Trigger" },
      { name: "Tooltip.Portal", propsType: "TooltipPortalProps", element: "div", component: "Portal" },
      { name: "Tooltip.Content", propsType: "TooltipContentProps", element: "div", component: "Content" },
      { name: "Tooltip.Arrow", propsType: "TooltipArrowProps", element: "div", component: "Arrow" },
    ],
    contract: "registry/components/tooltip/contract.json",
    figmaComponentSetKey: "1168:35600", importPath: "@primitiv-ui/react",
  },
  popover: {
    displayName: "Popover", kind: "registry", status: "stable", category: "Overlays",
    propsFile: "packages/react/src/Popover/types.ts",
    subComponents: [
      { name: "Popover.Root", propsType: "PopoverRootProps", element: "div", component: "Root" },
      { name: "Popover.Trigger", propsType: "PopoverTriggerProps", element: "button", component: "Trigger" },
      { name: "Popover.Anchor", propsType: "PopoverAnchorProps", element: "div", component: "Anchor" },
      { name: "Popover.Content", propsType: "PopoverContentProps", element: "div", component: "Content" },
      { name: "Popover.Title", propsType: "PopoverTitleProps", element: "h2", component: "Title" },
      { name: "Popover.Description", propsType: "PopoverDescriptionProps", element: "p", component: "Description" },
      { name: "Popover.Close", propsType: "PopoverCloseProps", element: "button", component: "Close" },
    ],
    contract: "registry/components/popover/contract.json",
    figmaComponentSetKey: "1168:36142", importPath: "@primitiv-ui/react",
  },
  drawer: {
    displayName: "Drawer", kind: "registry", status: "stable", category: "Overlays",
    propsFile: "packages/react/src/Drawer/types.ts",
    subComponents: [
      { name: "Drawer.Root", propsType: "DrawerRootProps", element: "div", component: "Root" },
      { name: "Drawer.Trigger", propsType: "DrawerTriggerProps", element: "button", component: "Trigger" },
      { name: "Drawer.Portal", propsType: "DrawerPortalProps", element: "div", component: "Portal" },
      { name: "Drawer.Overlay", propsType: "DrawerOverlayProps", element: "div", component: "Overlay" },
      { name: "Drawer.Content", propsType: "DrawerContentProps", element: "dialog", component: "Content" },
      { name: "Drawer.Header", propsType: "DrawerHeaderProps", propsFile: "registry/components/drawer/drawer.tsx", element: "div", component: "Header" },
      { name: "Drawer.Body", propsType: "DrawerBodyProps", propsFile: "registry/components/drawer/drawer.tsx", element: "div", component: "Body" },
      { name: "Drawer.Footer", propsType: "DrawerFooterProps", propsFile: "registry/components/drawer/drawer.tsx", element: "div", component: "Footer" },
      { name: "Drawer.Title", propsType: "DrawerTitleProps", element: "h2", component: "Title" },
      { name: "Drawer.Description", propsType: "DrawerDescriptionProps", element: "p", component: "Description" },
      { name: "Drawer.Close", propsType: "DrawerCloseProps", element: "button", component: "Close" },
    ],
    contract: "registry/components/drawer/contract.json",
    figmaComponentSetKey: "1142:26332", importPath: "@primitiv-ui/react",
  },
  dropdown: {
    displayName: "Dropdown", kind: "registry", status: "stable", category: "Overlays",
    propsFile: "packages/react/src/Dropdown/types.ts",
    subComponents: [
      { name: "Dropdown.Root", propsType: "DropdownRootProps", element: "div", component: "Root" },
      { name: "Dropdown.Trigger", propsType: "DropdownTriggerProps", element: "button", component: "Trigger" },
      { name: "Dropdown.Content", propsType: "DropdownContentProps", element: "div", component: "Content" },
      { name: "Dropdown.Item", propsType: "DropdownItemProps", element: "div", component: "Item" },
      { name: "Dropdown.ItemLeading", propsType: "DropdownItemLeadingProps", propsFile: "registry/components/dropdown/dropdown.tsx", element: "span", component: "ItemLeading" },
      { name: "Dropdown.ItemLabel", propsType: "DropdownItemLabelProps", propsFile: "registry/components/dropdown/dropdown.tsx", element: "span", component: "ItemLabel" },
      { name: "Dropdown.ItemTrailing", propsType: "DropdownItemTrailingProps", propsFile: "registry/components/dropdown/dropdown.tsx", element: "span", component: "ItemTrailing" },
      { name: "Dropdown.CheckboxItem", propsType: "DropdownCheckboxItemProps", element: "div", component: "CheckboxItem" },
      { name: "Dropdown.RadioGroup", propsType: "DropdownRadioGroupProps", element: "div", component: "RadioGroup" },
      { name: "Dropdown.RadioItem", propsType: "DropdownRadioItemProps", element: "div", component: "RadioItem" },
      { name: "Dropdown.ItemIndicator", propsType: "DropdownItemIndicatorProps", element: "span", component: "ItemIndicator" },
      { name: "Dropdown.Label", propsType: "DropdownLabelProps", element: "div", component: "Label" },
      { name: "Dropdown.Separator", propsType: "DropdownSeparatorProps", element: "div", component: "Separator" },
      { name: "Dropdown.Group", propsType: "DropdownGroupProps", element: "div", component: "Group" },
      { name: "Dropdown.Sub", propsType: "DropdownSubProps", element: "div", component: "Sub" },
      { name: "Dropdown.SubTrigger", propsType: "DropdownSubTriggerProps", element: "div", component: "SubTrigger" },
      { name: "Dropdown.SubContent", propsType: "DropdownSubContentProps", element: "div", component: "SubContent" },
    ],
    contract: "registry/components/dropdown/contract.json",
    figmaComponentSetKey: "669:43383", importPath: "@primitiv-ui/react",
  },
  divider: {
    displayName: "Divider", kind: "registry", status: "stable", category: "Layout",
    propsFile: "packages/react/src/Divider/types.ts",
    subComponents: [
      /* Single part. `orientation` is a headless prop (it sets `aria-orientation`
         and picks the axis), not a contract modifier, so the contract carries no
         modifiers and the playground's one knob is spec-declared. */
      { name: "Divider", propsType: "DividerProps", element: "span", component: "Divider" },
    ],
    contract: "registry/components/divider/contract.json",
    figmaComponentSetKey: "401:18380", importPath: "@primitiv-ui/react",
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
