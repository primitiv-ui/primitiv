# Roadmap

Planning notes for the `@primitiv/react` headless component library.
Two lists:

1. **Components to build** — the master backlog.
2. **Workbench examples** — components that exist but still need an
   `apps/web` example page.

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
- [ ] Field
- [ ] Fieldset
- [ ] File Upload
- [ ] Form
- [ ] Input
- [ ] Label
- [ ] Number Input
- [ ] One-Time Password Field
- [ ] Password Input
- [ ] Pin Input
- [x] Radio Group
- [x] Radio Card
- [ ] Rating
- [ ] Segmented Control
- [ ] Select (Native)
- [x] Slider
- [x] Switch
- [ ] Tags Input
- [ ] Textarea

### Collections & Selection

- [ ] Combobox
- [ ] Listbox
- [ ] Select
- [ ] Tree
- [x] Miller Columns
- [ ] Date & Time
- [ ] Calendar
- [ ] Date Picker

### Overlays

- [x] Action Bar
- [ ] Alert Dialog
- [ ] Context Menu
- [ ] Drawer
- [x] Dropdown
- [ ] Hover Card
- [x] Modal
- [ ] Popover
- [x] Tooltip

### Disclosure

- [x] Accordion
- [ ] Breadcrumb
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

- [ ] Alert
- [ ] Empty State
- [ ] Progress
- [ ] Progress Circle
- [ ] Status

### Data Display

- [ ] Avatar
- [ ] Clipboard
- [ ] QR Code
- [ ] Scroll Area
- [ ] Splitter
- [x] Table

### Utilities

- [ ] Accessible Icon
- [ ] Direction Provider
- [ ] Environment Provider
- [x] Portal
- [ ] Presence
- [ ] Skip Nav
- [x] Slot
- [ ] Visually Hidden

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

`apps/web` carries one example page per component. These components
exist in `packages/react` but do not yet have a workbench example —
revisit to add them:

- [ ] Button
- [ ] Checkbox
- [ ] Divider
- [ ] Portal
- [ ] Radio Group
- [ ] Table
- [ ] Tabs

`Slot` is an internal composition utility, not a public component —
it does not need a workbench page.
