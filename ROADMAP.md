# Roadmap

Planning notes for the `@primitiv/react` headless component library.
Two lists:

1. **Components to build** — the master backlog.
2. **Workbench examples** — components that exist but still need an
   `apps/workbench` example page.

## Harmoni plugin UI — minimum base components

The six base components required to build the Harmoni plugin wireframe screens.
Composite components (PaletteRamp, Swatch, etc.) are out of scope here.

| Component | `@primitiv/react` | Figma design | Notes |
|---|---|---|---|
| Button | ✓ built | in progress | Primary, secondary, ghost/link, and icon-only variants all appear |
| Slider | ✓ built | needed | Horizontal (Padding control) and vertical (curve editors) |
| Switch | ✓ built | needed | Step labels and A11y badges on/off toggles |
| Toggle Group | ✓ built | needed | Layout, Shape, Naming, and Modes pill selectors |
| Input | ✓ built | needed | Hex colour text inputs; pair with `InputGroup` for the leading colour-swatch slot |
| Select | ✓ built (native) | needed | Workspace picker and Collection dropdown; Rich Select / Combobox tracked in [`docs/select-future-work.md`](docs/select-future-work.md) |

Build priority: ~~Select (native)~~ → ~~Input~~ → ~~InputGroup~~ → ~~Field~~ → Figma design for the remaining four.

## Components to build

What remains is every component that carries genuine interaction
logic, ARIA behaviour, focus management, or non-trivial accessibility
semantics that CSS alone cannot provide.

### Layout

- [x] Divider

### Buttons

- [x] Button

### Forms

- [x] Checkbox
- [x] Checkbox Card
- [ ] Color Picker
- [ ] Editable
- [x] Field
- [x] Fieldset
- [ ] File Upload
- [ ] Form
- [x] Input
- [x] InputGroup
- [ ] Number Input
- [ ] One-Time Password Field
- [ ] Password Input
- [ ] Pin Input
- [x] Radio Group
- [x] Radio Card
- [ ] Rating
- [ ] Segmented Control
- [x] Select (Native)
- [x] Slider
- [x] Switch
- [ ] Tags Input
- [x] Textarea

### Collections & Selection

- [ ] Combobox — see [`docs/select-future-work.md`](docs/select-future-work.md)
- [ ] Listbox
- [ ] Select (Rich) — see [`docs/select-future-work.md`](docs/select-future-work.md)
- [x] Tree
- [x] Miller Columns
- [ ] Date & Time
- [ ] Calendar
- [ ] Date Picker

### Overlays

- [x] Action Bar
- [ ] Alert Dialog
- [x] Context Menu
- [ ] Drawer
- [x] Dropdown
- [ ] Hover Card
- [x] Modal
- [ ] Popover
- [x] Tooltip

### Disclosure

- [x] Accordion
- [x] Breadcrumb
- [x] Carousel
- [x] Collapsible
- [ ] Pagination
- [ ] Steps
- [x] Tabs

### Navigation

- [ ] Menubar
- [ ] Navigation Menu
- [x] Toggle
- [x] Toggle Group
- [ ] Toolbar

### Feedback & Status

- [x] Alert
- [x] Empty State
- [x] Progress
- [ ] Progress Circle
- [x] Status

### Data Display

- [x] Avatar
- [ ] Clipboard
- [ ] QR Code
- [ ] Scroll Area
- [ ] Splitter
- [x] Table

### Utilities

- [x] Accessible Icon
- [x] Direction Provider
- [ ] Environment Provider
- [x] Portal
- [ ] Presence
- [x] Skip Nav
- [x] Slot
- [x] Visually Hidden

### Borderline cases

A few entries are worth revisiting — they carry little or no JS
behaviour, but were kept for meaningful ARIA semantics:

- **Alert / Empty State / Status** — no JS behaviour, but meaningful
  ARIA role semantics (`role="alert"`, `role="status"`) that a plain
  `<div>` won't get right by default.
- **Breadcrumb** — minimal JS, but the
  `<nav aria-label="breadcrumb">` + `aria-current="page"` pattern is
  fiddly enough to warrant a primitive.
- **Carousel** — a genuinely complex interaction/a11y problem
  (`role="region"`, live regions, keyboard navigation). Worth keeping.
- **Progress / Progress Circle** — `role="progressbar"` with
  `aria-valuenow/min/max` management. Kept for the ARIA wiring.
- **QR Code** — generates a canvas/SVG from data. Functional logic,
  not styling-coupled.
- **Presence** — animation entry/exit lifecycle management
  (mount/unmount timing). Behavioural, not just styling.

## Workbench examples

`apps/workbench` carries one example page per component. Every public
component now has a workbench example:

- [x] Accessible Icon
- [x] Alert
- [x] Button
- [x] Checkbox
- [x] Direction Provider
- [x] Divider
- [x] Empty State
- [x] Field
- [x] Input
- [x] Input Group
- [x] Portal
- [x] Radio Group
- [x] Skip Nav
- [x] Status
- [x] Table
- [x] Tabs
- [x] Visually Hidden

`Slot` is an internal composition utility, not a public component —
it does not need a workbench page.
