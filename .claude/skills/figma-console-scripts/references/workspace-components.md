# Workspace components and icons available to wireframes

The `harmoni-figma-plugin` already depends on **`@primitiv-ui/react`** and
**`@primitiv-ui/icons`** as workspace packages
(see `apps/harmoni-figma-plugin/package.json`). When wireframing, prefer
to show behaviour using components that already exist in the workspace —
the eventual implementation will use them, so wireframes that anticipate
that vocabulary are more honest.

The `@primitiv-ui/react` headless component inventory currently includes:

`AccessibleIcon`, `Accordion`, `Alert`, `Avatar`, `Breadcrumb`, `Button`,
`Carousel`, `Checkbox`, `CheckboxCard`, `Collapsible`, `ContextMenu`,
`DirectionProvider`, `Divider`, `Dropdown`, `EmptyState`, `Fieldset`,
`MillerColumns`, `Modal`, `Portal`, `Progress`, `RadioCard`, `RadioGroup`,
`SkipNav`, `Slider`, `Slot`, `Status`, `Switch`, `Table`, `Tabs`,
`Textarea`, `Toggle`, `ToggleGroup`, `Tooltip`, `Tree`, `VisuallyHidden`.

Concretely useful in plugin wireframes:

- **`Tree` / `MillerColumns`** — variable collection picker, project lists, any nested selector.
- **`Tabs` / `ToggleGroup` / `Switch`** — segmented controls, on/off toggles.
- **`Breadcrumb`** — the output-zone breadcrumb-style header (`‹ Apply ▸ Canvas swatches`).
- **`Dropdown` / `Modal` / `Tooltip`** — collection pickers, popovers, helper hints.
- **`Slider`** — padding sliders, tint strength, any continuous control.
- **`Alert` / `Status` / `EmptyState`** — post-apply feedback, no-project state.

`@primitiv-ui/icons` exposes a generated set of common UI icons
(`ArrowLeft`, `ArrowRight`, `Check`, `ChevronDown`, `ChevronLeft`,
`ChevronRight`, `ChevronUp`, `Close`, `Copy`, `Delete`, `Download`,
`Edit`, `Eye`, `Folder`, `Info`, `Menu`, `Plus`, etc. — see
`packages/icons/src/icons/`). Wireframes can use Unicode glyphs (`‹`,
`▾`, `✓`) for speed; the implementation should pull the corresponding
icon from `@primitiv-ui/icons`. Call this out in the wireframe comments
when the choice matters (e.g. "the ‹ will be `<ChevronLeft />` in
implementation").

**Don't reinvent these in wireframes.** If a wireframe needs a tree, a
miller-columns picker, or a breadcrumb, draft it using the visual
vocabulary of the existing component — that way the wireframe doubles
as guidance for the implementer.
