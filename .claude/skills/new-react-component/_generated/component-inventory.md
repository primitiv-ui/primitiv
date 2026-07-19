# Component inventory

One row per component in `packages/react/src/`. Use this to find the
closest analogue to whatever you're scaffolding and mirror its shape.
Utility primitives (Accessible Icon, Direction Provider, Portal, Skip
Nav, Slot, Visually Hidden) are included — they're the models for a new
non-visual primitive.

"Tests" = number of test files (the taxonomy in
`test-file-taxonomy.md` splits behaviour across many small files).

| Component | Kind | Has hooks/ | Contexts | Tests | Notes |
|---|---|---|---|---|---|
| AccessibleIcon | Simple utility | no | none | 1 | Labels an icon (`aria-label`/title) or hides it decoratively. No state. |
| Accordion | Compound, roving tabindex | yes | AccordionContext, AccordionItemContext | 12 | Multi-mode (single / multiple), pre-filters disabled items, separate item context for nested heading/trigger/content. |
| Alert | Simple element | no | none | 1 | `role="alert"` live region. No JS behaviour — kept for ARIA semantics. |
| Avatar | Compound, controllable | yes | AvatarContext | 5 | Image with fallback to generated initials or a placeholder silhouette; load-state tracked via context. |
| Breadcrumb | Sub-component family | no | none | 2 | `<nav aria-label>` + `aria-current="page"`; Root/List/Item/Link/Separator, stateless. |
| Button | Simple element | no | none | 6 | Renders `<button type="button">` by default. Supports `asChild` via Slot. |
| Carousel | Compound, complex | yes | CarouselContext | 41 | Scroll-snap based; IntersectionObserver sync; loop animation, slides-per-page/move, reduced motion, autoplay, translations. The heaviest component. |
| Checkbox | Compound, controllable | yes | CheckboxContext | 8 | Supports indeterminate, custom indicator child. |
| CheckboxCard | Compound, controllable | yes | CheckboxCardContext | 8 | Card-surfaced checkbox — the whole card is the control; mirrors Checkbox's state model. |
| Collapsible | Compound, disclosure | yes | CollapsibleContext | 8 | Supports forceMount on Content, triggerIcon. |
| ContextMenu | Compound, very complex (menu) | no | ContextMenuContext + Content/Group/ItemIndicator/RadioGroup/Sub contexts | 15 | Right-click menu; sub-menus, checkbox/radio items, typeahead. Sibling of Dropdown — shares the menu machinery, differs on the trigger. |
| DirectionProvider | Simple utility | no | DirectionContext | 1 | Supplies LTR/RTL direction to descendants via context. |
| Divider | Simple element | no | none | 2 | Horizontal / vertical separator. |
| Drawer | Compound, disclosure | no | none (reuses Modal) | 3 | Thin composition over Modal — renders each `Modal.*` sub-component and inherits its native `<dialog>` behaviour (focus trap, portal, controlled/uncontrolled, imperative API); the only addition is a `side` axis on Content emitted as `data-side`. Copy this when a new component is behaviourally another component + a presentational axis. |
| Dropdown | Compound, very complex (menu) | yes | DropdownContext + Content/Group/ItemIndicator/RadioGroup/Sub contexts | 18 | Menu with sub-menus, checkbox/radio items, typeahead, item indicators. Has its own `constants.ts`. |
| EmptyState | Simple element | no | none | 5 | Placeholder for empty collections; composable icon/title/description/actions slots. |
| Field | Compound, controllable | yes | FieldContext | 5 | Label + control + helper/error wiring; distributes ids/aria to a nested control. |
| Fieldset | Simple element | no | none | 2 | `<fieldset>`/`<legend>` grouping for related controls. |
| Input | Simple element | no | none | 5 | Single-line text entry; neutral styling, no intent axis. |
| InputGroup | Simple element | no | none | 3 | Composes leading/trailing addons (icons, buttons, text) around an Input. |
| MillerColumns | Compound, roving tabindex | yes | MillerColumnsContext, MillerColumnsColumnContext, MillerColumnsItemContext | 16 | Miller columns / cascading lists. Recursive composition (no data prop); child columns portal-projected into the Root strip; single tree-wide roving tabstop; `partitionItemChildren` splits an Item's cell from its nested Column. |
| Modal | Compound, disclosure | yes | ModalContext | 14 | Uses native `<dialog>` with a polyfill (`dialog-polyfill.ts`); nested modals, click-outside, escape-hatches. |
| Popover | Compound, disclosure | yes | PopoverContext | 12 | Floating panel anchored to a trigger; open/close, outside-dismiss, focus management. Shares the anchored-overlay family with Tooltip. |
| Portal | Simple utility | no | none | 1 | Public DOM-escape primitive wrapping `createPortal`. No state or context; consumed by Modal.Portal. |
| Progress | Compound, controllable | yes | ProgressContext | 4 | `role="progressbar"` with aria-valuenow/min/max; determinate & indeterminate. |
| Radio | Compound, controllable | yes | RadioContext | 7 | Single radio control with an optional inline label. |
| RadioCard | Compound, controllable | yes | RadioCardContext, RadioCardItemContext | 10 | Card-surfaced radio group — the whole card is the control; item context per card. |
| RadioGroup | Compound, roving tabindex | yes | RadioGroupContext, RadioGroupItemContext | 13 | `orientation: "both"`, pre-filters disabled; arrow does nothing while focus is on a disabled radio. |
| Select | Simple element | no | none | 7 | Native `<select>` wrapper; no intent axis. Rich Select / Combobox tracked in `docs/select-future-work.md`. |
| SkipNav | Simple utility | no | none | 2 | Skip-to-content link revealed on focus. |
| Slider | Compound, complex | yes | SliderContext | 14 | Draggable thumb(s); keyboard steps, min/max/step, orientation, ARIA valuetext. |
| Slot | Internal utility | no | none | 2 | The asChild composition primitive. Also exports `composeEventHandlers`. Used by every component that supports asChild. |
| Status | Simple element | no | none | 1 | `role="status"` polite live region. No JS behaviour — kept for ARIA semantics. |
| Switch | Compound, controllable | yes | SwitchContext | 11 | On/off toggle; controllable, custom thumb. |
| Table | Sub-component family | no | none | 10 | Compound but stateless — Root, Header, Body, Footer, Caption, Row, Cell, Head, ScrollArea. |
| Tabs | Compound, roving tabindex | yes | TabsContext | 14 | Activation modes (automatic / manual), lazy-mount panels, imperative API via ref, change-event-callbacks split. Has its own `utils.ts`. |
| Textarea | Simple element | no | none | 4 | Multi-line text entry; optional auto-resize. |
| Toggle | Simple element | no | none | 6 | Two-state pressed button (`aria-pressed`). |
| ToggleGroup | Compound, roving tabindex | yes | ToggleGroupContext | 7 | Single / multiple pressed Toggles as a segmented control. |
| Tooltip | Compound, disclosure | yes | TooltipContext, TooltipProviderContext | 9 | Hover/focus floating label; provider-level delay coordination. Shares the anchored-overlay family with Popover. |
| Tree | Compound, roving tabindex | yes | TreeContext, TreeItemContext, TreeLevelContext | 17 | Tree view; expand/collapse, single tree-wide roving tabstop, level context for depth. |
| VisuallyHidden | Simple utility | no | none | 1 | Visually hides content while keeping it in the a11y tree. |

Patterns by inheritance:

- Closest to a new **roving-tabindex compound**: copy Tabs first, then look at Accordion and RadioGroup for variants on disabled-handling.
- Closest to a new **disclosure** (open/close, no roving): copy Collapsible.
- Closest to a new **portal + overlay** widget: copy Modal.
- Closest to a new **anchored overlay** (tooltip / popover / hover-card): copy Popover, or Tooltip when you need hover/focus + provider-level delay.
- Closest to a new **menu-like** widget: copy Dropdown — but it's the heaviest, only mirror what you actually need. For a right-click trigger, ContextMenu is the ready-made variant.
- Closest to a new **card-wrapped form control**: copy CheckboxCard or RadioCard.
- For a **simple element** wrapper: copy Button or Divider.
- For a **sub-component family without state**: copy Table.
- For a **non-visual utility primitive**: copy Portal (DOM escape) or VisuallyHidden / AccessibleIcon (a11y-only).

Total components: 42 (36 visual + interactive, 6 utility primitives). The
shared utilities they all build on are in `shared-hooks.md` and
`shared-utils.md`.
