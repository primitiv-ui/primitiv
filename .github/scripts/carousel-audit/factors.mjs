// The Carousel Builder's variant axes, mirrored from
// apps/kitchen-sink/src/pages/CarouselBuilder.tsx (BuilderConfig / DEFAULT_CONFIG /
// the RadioField/CheckField/RangeField controls). Numeric ranges (slideCount,
// slidesPerPage) are discretized to a few representative values rather than
// swept exhaustively — standard practice for combinatorial testing.
//
// Keep this in sync by hand when the builder's axes change; there is no
// generator wired to contract.json for the builder itself (it's a kitchen-sink
// page, not a registry component).

export const FACTORS = {
  placement: ["external", "overlay"],
  orientation: ["horizontal", "vertical"],
  side: ["after", "before"],
  distribution: ["group", "stretch"],
  align: ["start", "center", "end"],
  cluster: ["split", "joined"],
  rtl: ["false", "true"],
  allowMouseDrag: ["false", "true"],
  slideCount: ["2", "4", "8"],
  slidesPerPage: ["1", "2", "4"],
  ratio: ["square", "standard", "wide", "ultrawide"],
  slideWidth: ["equal", "content"],
  snapAlign: ["start", "center", "end"],
  radius: ["md", "none"],
  gap: ["none", "sm", "md", "lg"],
  peek: ["none", "sm", "md", "lg"],
  padding: ["none", "sm", "md", "lg"],
  surface: ["none", "subtle"],
  containerRadius: ["none", "md"],
  indicators: ["dots", "thumbnails"],
  content: ["gradient", "pictures"],
  transition: ["slide", "fade"],
  effect: ["none", "parallax"],
  loop: ["none", "wrap", "infinite"],
  glide: ["fast", "medium", "slow"],
};

export const DEFAULTS = {
  placement: "external",
  orientation: "horizontal",
  side: "after",
  distribution: "group",
  align: "center",
  cluster: "split",
  rtl: "false",
  allowMouseDrag: "false",
  slideCount: "4",
  slidesPerPage: "1",
  ratio: "wide",
  slideWidth: "equal",
  snapAlign: "center",
  radius: "md",
  gap: "md",
  peek: "none",
  padding: "none",
  surface: "none",
  containerRadius: "none",
  indicators: "dots",
  content: "gradient",
  transition: "slide",
  effect: "none",
  loop: "none",
  glide: "medium",
};

// Application order: the builder's accordion SECTIONS, top to bottom — a
// case's axes are applied in this order so the sequence mirrors realistic
// exploration (and, deliberately, puts `loop`/`glide` LAST, since every bug
// found so far in this investigation was triggered by switching loop mode
// *after* other settings were already in place, not by a fresh mount).
export const APPLICATION_ORDER = [
  "placement",
  "orientation",
  "side",
  "distribution",
  "align",
  "cluster",
  "rtl",
  "allowMouseDrag",
  "slideCount",
  "slidesPerPage",
  "ratio",
  "radius",
  "slideWidth",
  "snapAlign",
  "gap",
  "peek",
  "padding",
  "surface",
  "containerRadius",
  "indicators",
  "content",
  "transition",
  "effect",
  "loop",
  "glide",
];

// Each axis's control: how to find it (an accessible role + name, scoped by a
// legend/label) and how to drive it. RadioField axes share the "radio-group"
// kind; the two boolean toggles and the two numeric ranges are special-cased.
export const CONTROLS = {
  placement: { kind: "radio-group", legend: "placement" },
  orientation: { kind: "radio-group", legend: "orientation" },
  side: { kind: "radio-group", legend: "side" },
  distribution: { kind: "radio-group", legend: "distribution" },
  align: { kind: "radio-group", legend: "align" },
  cluster: { kind: "radio-group", legend: "cluster" },
  rtl: { kind: "checkbox", label: 'RTL (dir="rtl")' },
  allowMouseDrag: {
    kind: "checkbox",
    label: "allowMouseDrag (mouse click-and-drag scrolling)",
  },
  slideCount: { kind: "range", labelText: "slide count" },
  slidesPerPage: { kind: "range", labelText: "slidesPerPage" },
  ratio: { kind: "radio-group", legend: "ratio" },
  radius: { kind: "radio-group", legend: "radius" },
  slideWidth: { kind: "radio-group", legend: "slideWidth" },
  snapAlign: { kind: "radio-group", legend: "snapAlign" },
  gap: { kind: "radio-group", legend: "gap" },
  peek: { kind: "radio-group", legend: "peek" },
  padding: { kind: "radio-group", legend: "padding" },
  surface: { kind: "radio-group", legend: "surface" },
  containerRadius: { kind: "radio-group", legend: "radius (container)" },
  indicators: { kind: "radio-group", legend: "indicators" },
  content: { kind: "radio-group", legend: "content" },
  transition: { kind: "radio-group", legend: "transition" },
  effect: { kind: "radio-group", legend: "effect" },
  loop: { kind: "radio-group", legend: "loop" },
  glide: { kind: "radio-group", legend: "glide" },
};
