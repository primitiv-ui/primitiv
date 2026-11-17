"use client";

import { useState } from "react";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pause,
  Play,
} from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import {
  Carousel,
  CarouselControls,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselIndicators,
  CarouselNextTrigger,
  CarouselPreviousTrigger,
  CarouselSlide,
  CarouselSlideContent,
  CarouselViewport,
} from "@/components/carousel";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Ratio = "square" | "standard" | "wide" | "ultrawide";
type Peek = "none" | "sm" | "md" | "lg";
type Gap = "none" | "sm" | "md" | "lg";

/** Gradient stand-ins for slide imagery — no image assets, works offline. */
const GRADIENTS = [
  "linear-gradient(135deg, #1e3a8a, #14b8a6)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #ea580c, #16a34a)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "linear-gradient(135deg, #db2777, #f59e0b)",
  "linear-gradient(135deg, #0d9488, #4f46e5)",
];

/** A demo photo, inline so the fit example needs no asset. 4:3, clearly an image. */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#38bdf8'/><stop offset='1' stop-color='#bae6fd'/></linearGradient></defs><rect width='400' height='300' fill='url(#s)'/><circle cx='320' cy='70' r='40' fill='#fde68a'/><path d='M0 300 L120 170 L210 240 L300 150 L400 250 L400 300 Z' fill='#166534'/><path d='M0 300 L90 230 L180 280 L280 210 L400 280 L400 300 Z' fill='#15803d'/></svg>`,
)}`;

const PARTS = [
  "Viewport",
  "Slide",
  "PreviousTrigger",
  "NextTrigger",
  "Indicators",
] as const;

const imports = (
  mode: Mode,
  parts: readonly string[] = PARTS,
  icons: readonly string[] = ["ChevronLeft", "ChevronRight"],
) =>
  importBlock({ mode, component: "Carousel", componentId: "carousel", parts, icons });

/* ---- Elements (RFC 0033) --------------------------------------------------- */

/**
 * The root's contract modifiers at their defaults, in the recipe's order. The
 * styled React wrapper writes every one of them, and the layout reads them —
 * the split cluster's grid keys off `placement`, `cluster` and `distribution` —
 * so the Elements markup carries them all, as `primitiv add carousel --surface
 * elements` prints.
 */
const ROOT_DEFAULTS = {
  peek: "none",
  gap: "md",
  padding: "none",
  surface: "none",
  radius: "none",
  placement: "external",
  side: "after",
  distribution: "group",
  align: "center",
  cluster: "split",
  indicators: "dots",
  size: "md",
  ratio: "wide",
  slideWidth: "equal",
  effect: "none",
  glide: "medium",
} as const;

/** The slide's contract modifiers at their defaults. */
const SLIDE_DEFAULTS = { radius: "md", fit: "cover", surface: "none" } as const;

type Modifiers<T> = { readonly [K in keyof T]?: string };
type GlyphName = Parameters<typeof glyph>[0];

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** `base` plus one modifier class per axis, `mods` over the defaults. */
const classes = (
  base: string,
  defaults: Readonly<Record<string, string>>,
  mods: Readonly<Record<string, string | undefined>> = {},
) =>
  [base, ...Object.keys(defaults).map((axis) => `${base}--${kebab(axis)}-${mods[axis] ?? defaults[axis]}`)].join(" ");

const pad = (lines: readonly string[], by = "  ") => lines.map((line) => (line ? by + line : line));

/** One slide holding `content` — a comment where the demo paints its own. */
const elSlide = (content: string, mods: Modifiers<typeof SLIDE_DEFAULTS> = {}) =>
  `<primitiv-carousel-slide class="${classes("primitiv-carousel__slide", SLIDE_DEFAULTS, mods)}">${content}</primitiv-carousel-slide>`;

const elSlides = (count = 4) =>
  Array.from({ length: count }, (_, i) => elSlide(`<!-- slide ${i + 1} -->`));

/** A previous / next control: the element wraps the `<button>` it decorates. */
const elTrigger = (which: "previous" | "next", label: string, icon: GlyphName) => [
  `<primitiv-carousel-${which}-trigger>`,
  `  <button type="button" class="primitiv-carousel__${which === "previous" ? "prev" : "next"}" aria-label="${label}">${glyph(icon)}</button>`,
  `</primitiv-carousel-${which}-trigger>`,
];

/** The auto indicators: one button per page, stamped from the `<template>`. */
const elIndicators = (label = "Choose slide") => [
  `<primitiv-carousel-indicators label="${label}" class="primitiv-carousel__indicator-group">`,
  `  <template><button type="button" class="primitiv-carousel__indicator"></button></template>`,
  `</primitiv-carousel-indicators>`,
];

/** Hand-written indicators, one per slide, each showing its slide's thumbnail. */
const elThumbnails = (count = 4) => [
  `<primitiv-carousel-indicator-group label="Choose slide" class="primitiv-carousel__indicator-group">`,
  ...pad(
    Array.from({ length: count }, (_, i) => [
      `<primitiv-carousel-indicator index="${i}">`,
      `  <button type="button" class="primitiv-carousel__indicator"><img src="/thumbs/${i + 1}.jpg" alt=""></button>`,
      `</primitiv-carousel-indicator>`,
    ]).flat(),
  ),
  `</primitiv-carousel-indicator-group>`,
];

/**
 * The play / pause control. Its `<button>` borrows the Button component's
 * classes, and shows whichever span's `data-play-state` matches — a span, not
 * the `<svg>`, because the element hides the other with `hidden`, which an
 * `<svg>` ignores. The paused glyph is the one visible before the script runs.
 */
const elPlayPause = [
  `<primitiv-carousel-play-pause-trigger>`,
  `  <button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--md">`,
  `    <span data-play-state="paused">${glyph("play")}</span>`,
  `    <span data-play-state="playing" hidden>${glyph("pause")}</span>`,
  `  </button>`,
  `</primitiv-carousel-play-pause-trigger>`,
];

type ElementsControls = {
  previous?: string;
  next?: string;
  icons?: readonly [GlyphName, GlyphName];
  indicators?: readonly string[];
  /** Controls after the indicators, e.g. the play / pause control. */
  extra?: readonly string[];
};

/**
 * The controls. Split, they are direct children of the root, which places
 * each by grid area; joined, they share a `primitiv-carousel__controls` bar —
 * a styling-only `<span>`, so the headless markup drops it.
 */
const elControls = (
  cluster: string,
  {
    previous = "Previous slide",
    next = "Next slide",
    icons = ["chevron-left", "chevron-right"],
    indicators = elIndicators(),
    extra = [],
  }: ElementsControls = {},
) => {
  const prev = elTrigger("previous", previous, icons[0]);
  const nxt = elTrigger("next", next, icons[1]);
  return cluster === "joined"
    ? [`<span class="primitiv-carousel__controls">`, ...pad([...prev, ...indicators, ...nxt, ...extra]), `</span>`]
    : [...prev, ...nxt, ...indicators, ...extra];
};

/**
 * A carousel as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * elements, in the shape `primitiv add carousel --surface elements` prints.
 * The root writes its roles, the slides' names and states and the controls'
 * `disabled` itself, so the markup carries none of them.
 */
const elementsTree = ({
  label = "Featured products",
  attrs = "",
  mods = {},
  style,
  slides = elSlides(),
  track = false,
  controls,
}: {
  label?: string;
  /** Behaviour attributes, each with its leading space: ` loop="infinite"`. */
  attrs?: string;
  mods?: Modifiers<typeof ROOT_DEFAULTS>;
  /** The root's `style`, for what the styled layer reads from a custom property. */
  style?: string;
  slides?: readonly string[];
  /** Wrap the slides in the track `loop="infinite"` translates. */
  track?: boolean;
  controls?: ElementsControls;
} = {}) => {
  const items = track
    ? [`<primitiv-carousel-track class="primitiv-carousel__track">`, ...pad(slides), `</primitiv-carousel-track>`]
    : slides;
  return [
    `<primitiv-carousel aria-label="${label}"${attrs} class="${classes("primitiv-carousel", ROOT_DEFAULTS, mods)}"${style ? ` style="${style}"` : ""}>`,
    `  <primitiv-carousel-viewport class="primitiv-carousel__viewport">`,
    ...pad(items, "    "),
    `  </primitiv-carousel-viewport>`,
    ...pad(elControls(mods.cluster ?? ROOT_DEFAULTS.cluster, controls)),
    `</primitiv-carousel>`,
  ].join("\n");
};

/** The previews' glyphs, with each slide painted a demo gradient in order, as the React demos are. */
const painted = (code: string) => {
  let index = 0;
  return withGlyphs(code).replace(
    /<primitiv-carousel-slide /g,
    (tag) => `${tag}style="background: ${GRADIENTS[index++ % GRADIENTS.length]}" `,
  );
};

/** Each thumbnail `<img>` becomes its slide's gradient, as the React demo draws it. */
const paintedThumbnails = (code: string) =>
  painted(code).replace(
    /<img src="\/thumbs\/(\d)\.jpg" alt="">/g,
    (_, n: string) => `<span style="background: ${GRADIENTS[Number(n) - 1]}"></span>`,
  );

/**
 * The live slides — gradient boxes. A component so every example maps the same
 * array without repeating it.
 */
const Slides = ({ count = 4 }: { count?: number }) => (
  <>
    {GRADIENTS.slice(0, count).map((bg, i) => (
      <CarouselSlide key={i} style={{ background: bg }} />
    ))}
  </>
);

/** The controls a plain split carousel composes as direct children of the root. */
const SplitControls = () => (
  <>
    <CarouselPreviousTrigger aria-label="Previous slide">
      <ChevronLeft />
    </CarouselPreviousTrigger>
    <CarouselNextTrigger aria-label="Next slide">
      <ChevronRight />
    </CarouselNextTrigger>
    <CarouselIndicators label="Choose slide" />
  </>
);

/**
 * Loop + autoplay, controlled. The styled surface has no play/pause part —
 * `Carousel.PlayPauseTrigger` lives in the headless primitive only — so a styled
 * consumer wires their own control to the `playing` / `onPlayingChange` state.
 * Starts paused so no motion runs until the reader opts in.
 */
const LoopAutoplayExample = () => {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ inlineSize: "100%" }}>
      <Carousel
        ariaLabel="Featured products"
        loop
        autoplay={{ delay: 3000 }}
        playing={playing}
        onPlayingChange={setPlaying}
        cluster="joined"
      >
        <CarouselViewport>
          <Slides />
        </CarouselViewport>
        <CarouselControls>
          <CarouselPreviousTrigger aria-label="Previous slide">
            <ChevronLeft />
          </CarouselPreviousTrigger>
          <CarouselIndicators label="Choose slide" />
          <CarouselNextTrigger aria-label="Next slide">
            <ChevronRight />
          </CarouselNextTrigger>
        </CarouselControls>
      </Carousel>
      <div style={{ marginBlockStart: "1rem" }}>
        <Button variant="secondary" size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause /> : <Play />}
          {playing ? "Pause" : "Play"}
        </Button>
      </div>
    </div>
  );
};

/**
 * Carousel's page content.
 *
 * By far the largest component in the library — a scroll-snap viewport plus the
 * WAI-ARIA Carousel control model, with a deep set of layout, behaviour and
 * effect knobs. The playground stays deliberately small (the four knobs that
 * reshape a plain carousel on their own); the rest earn a worked example each.
 */
export const carouselSpec: ComponentSpec = {
  playground: {
    component: "Carousel",
    /* The contract carries ~17 modifiers; all but four are about control
       ARRANGEMENT or need specific content (real media for `fit`/`effect`, a
       fuller composition for `placement`/`cluster`/`side`/...). They each get a
       dedicated example, so the playground keeps only the knobs that visibly
       reshape a plain carousel independently. */
    excludeControls: [
      "padding",
      "surface",
      "radius",
      "placement",
      "side",
      "distribution",
      "align",
      "cluster",
      "indicators",
      "slideWidth",
      "effect",
      "glide",
      "fit",
    ],
    /* Hand-written: a compound whose parts are the point, and `toJsx` would
       print a childless `<Carousel size="md" ... />`. */
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsTree({
          mods: { size: values.size, ratio: values.ratio, peek: values.peek, gap: values.gap },
        });
      const p = partNamer(mode, "Carousel");
      const mods =
        contractAttr({ mode, prop: "size", value: values.size }) +
        contractAttr({ mode, prop: "ratio", value: values.ratio }) +
        contractAttr({ mode, prop: "peek", value: values.peek }) +
        contractAttr({ mode, prop: "gap", value: values.gap });
      return [
        imports(mode),
        ``,
        `<${p("Root")} ariaLabel="Featured products"${mods}>`,
        `  <${p("Viewport")}>`,
        `    <${p("Slide")}>{/* your slide */}</${p("Slide")}>`,
        `    {/* ...more slides */}`,
        `  </${p("Viewport")}>`,
        `  <${p("PreviousTrigger")} aria-label="Previous slide">`,
        `    <ChevronLeft />`,
        `  </${p("PreviousTrigger")}>`,
        `  <${p("NextTrigger")} aria-label="Next slide">`,
        `    <ChevronRight />`,
        `  </${p("NextTrigger")}>`,
        `  <${p("Indicators")} label="Choose slide" />`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    elementsPreview: painted,
    fill: true,
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <Carousel
          ariaLabel="Featured products"
          size={values.size as Size}
          ratio={values.ratio as Ratio}
          peek={values.peek as Peek}
          gap={values.gap as Gap}
        >
          <CarouselViewport>
            <Slides />
          </CarouselViewport>
          <SplitControls />
        </Carousel>
      </div>
    ),
  },

  anatomyMeta:
    "The Root is a `<section>` that owns the paging state and wraps a `Viewport` of `Slide`s, plus controls. The controls compose two ways: as **direct children** of the Root (the default `split` cluster — prev/next flank the viewport, the indicators sit apart) or bundled inside `Carousel.Controls` (the `joined` cluster — one bar). `Carousel.Indicators` auto-renders one dot per page; drop to `Carousel.IndicatorGroup` + `Carousel.Indicator` when you need thumbnails or custom markup. `Carousel.SlideContent` is the layer `effect=\"parallax\"` animates, and `Carousel.PlayPauseTrigger` is the autoplay control (both optional). `Carousel.SlideContent` and `Carousel.Controls` are styled-layer parts; `Carousel.PlayPauseTrigger` exists in the headless primitive only.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-carousel>`,
            `  <primitiv-carousel-viewport>`,
            `    <primitiv-carousel-track>   <!-- loop="infinite" only -->`,
            `      <primitiv-carousel-slide></primitiv-carousel-slide>`,
            `    </primitiv-carousel-track>`,
            `  </primitiv-carousel-viewport>`,
            ``,
            `  <!-- each control wraps the <button> it decorates -->`,
            `  <primitiv-carousel-previous-trigger><button></button></primitiv-carousel-previous-trigger>`,
            `  <primitiv-carousel-next-trigger><button></button></primitiv-carousel-next-trigger>`,
            `  <primitiv-carousel-indicators></primitiv-carousel-indicators>   <!-- or an indicator-group of indicators -->`,
            `  <primitiv-carousel-play-pause-trigger><button></button></primitiv-carousel-play-pause-trigger>   <!-- needs autoplay -->`,
            `  <primitiv-carousel-progress-text></primitiv-carousel-progress-text>   <!-- optional -->`,
            `</primitiv-carousel>`,
          ].join("\n");
        const p = partNamer(mode, "Carousel");
        return [
          `<${p("Root")}>`,
          `  <${p("Viewport")}>`,
          `    <${p("Slide")}>`,
          `      <${p("SlideContent")} />   {/* optional — the effect layer */}`,
          `    </${p("Slide")}>`,
          `  </${p("Viewport")}>`,
          ``,
          `  {/* split (default): controls are direct children */}`,
          `  <${p("PreviousTrigger")} />`,
          `  <${p("NextTrigger")} />`,
          `  <${p("Indicators")} />         {/* or IndicatorGroup + Indicator */}`,
          `  <${p("PlayPauseTrigger")} />   {/* optional — needs autoplay */}`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The Viewport is focusable and pages with the arrow keys; the prev/next controls are real `<button>`s, and each indicator is a button that jumps to its page. The keys follow the scroll axis, so they flip with `orientation`; they do not mirror under `dir=\"rtl\"`, where `ArrowRight` still advances.",

  keyboard: [
    {
      keys: ["ArrowRight", "ArrowLeft"],
      behaviour:
        "Advance / retreat one page, when `orientation` is horizontal (the default).",
    },
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "The same, when `orientation` is vertical.",
    },
    { keys: ["Home", "End"], behaviour: "Jump to the first / last page." },
    {
      keys: ["Enter", "Space"],
      behaviour:
        "Activate the focused control — a prev/next trigger, an indicator, or the play/pause button.",
    },
  ],

  examples: [
    {
      id: "basic",
      title: "Basic",
      render: () => (
        <InteractiveExample
          elementsCaption={"The minimal carousel: a `<primitiv-carousel-viewport>` of `<primitiv-carousel-slide>`s, previous and next controls, and `<primitiv-carousel-indicators>`, which stamps one indicator per page from its `<template>`. `aria-label` on the root names the region; give each control's `<button>` its own `aria-label` too. The root's classes are the styled defaults, and the layout reads them \u2014 `placement-external` with `cluster-split` flanks the viewport with the controls and puts the dots below \u2014 so keep them all."}
          elementsPreview={(_density, code) => painted(code)}
          caption={"The minimal carousel: a `Carousel.Viewport` of `Carousel.Slide`s, prev/next triggers, and `Carousel.Indicators` (one dot per page, auto). `ariaLabel` on the Root names the region; give each trigger its own `aria-label`. This is the default `placement=\"external\"` `cluster=\"split\"` layout — prev/next flank the viewport, the dots sit below."}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree();
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode),
              ``,
              `<${p("Root")} ariaLabel="Featured products">`,
              `  <${p("Viewport")}>`,
              `    {slides.map((slide) => (`,
              `      <${p("Slide")} key={slide.id}>{/* ... */}</${p("Slide")}>`,
              `    ))}`,
              `  </${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous slide">`,
              `    <ChevronLeft />`,
              `  </${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next slide">`,
              `    <ChevronRight />`,
              `  </${p("NextTrigger")}>`,
              `  <${p("Indicators")} label="Choose slide" />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Featured products">
                <CarouselViewport>
                  <Slides />
                </CarouselViewport>
                <SplitControls />
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "control-layout",
      title: "Control layout",
      render: () => (
        <InteractiveExample
          elementsCaption={"Two independent classes place the controls. `placement` is off versus on the imagery: `primitiv-carousel--placement-external` (the default) keeps them around the viewport, `--placement-overlay` insets them on the slide for edge-to-edge photography. `cluster` is the arrangement: with `--cluster-split` (the default) the controls are direct children of the root, flanking the viewport, while `--cluster-joined` bundles previous, indicators and next into one `primitiv-carousel__controls` bar \u2014 a styling-only `<span>`, so the headless markup drops it. `side`, `distribution` and `align` then position the cluster along its edge. Below: an overlay carousel over one with a joined bar."}
          elementsPreview={(_density, code) => `<div style="display: flex; flex-direction: column; gap: 2rem; inline-size: 100%">\n${painted(code)}\n</div>`}
          caption={"Two orthogonal axes place the controls. `placement` is off-vs-on the imagery — `external` (the default) keeps them in the space around the viewport, `overlay` insets them on the slide for edge-to-edge photography. `cluster` is the arrangement — `split` (the default) flanks the viewport with prev/next and leaves the indicators apart, `joined` bundles prev + indicators + next into one `Carousel.Controls` bar. `side`, `distribution` and `align` then position the cluster along its edge. Below: an `overlay` carousel over one with a `joined` bar."}
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                `<!-- Controls on the imagery -->`,
                elementsTree({ label: "Overlay gallery", mods: { placement: "overlay" } }),
                ``,
                `<!-- previous + indicators + next in one joined bar -->`,
                elementsTree({ label: "Joined-bar gallery", mods: { cluster: "joined" } }),
              ].join("\n");
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode, ["Viewport", "Slide", "Controls", "PreviousTrigger", "NextTrigger", "Indicators"]),
              ``,
              `{/* Controls on the imagery */}`,
              `<${p("Root")} ariaLabel="Gallery" placement="overlay">`,
              `  <${p("Viewport")}>{/* slides */}</${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next"><ChevronRight /></${p("NextTrigger")}>`,
              `  <${p("Indicators")} label="Choose slide" />`,
              `</${p("Root")}>`,
              ``,
              `{/* prev + indicators + next in one joined bar */}`,
              `<${p("Root")} ariaLabel="Gallery" cluster="joined">`,
              `  <${p("Viewport")}>{/* slides */}</${p("Viewport")}>`,
              `  <${p("Controls")}>`,
              `    <${p("PreviousTrigger")} aria-label="Previous"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `    <${p("Indicators")} label="Choose slide" />`,
              `    <${p("NextTrigger")} aria-label="Next"><ChevronRight /></${p("NextTrigger")}>`,
              `  </${p("Controls")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>
              <Carousel ariaLabel="Overlay gallery" placement="overlay">
                <CarouselViewport>
                  <Slides />
                </CarouselViewport>
                <CarouselPreviousTrigger aria-label="Previous slide">
                  <ChevronLeft />
                </CarouselPreviousTrigger>
                <CarouselNextTrigger aria-label="Next slide">
                  <ChevronRight />
                </CarouselNextTrigger>
                <CarouselIndicators label="Choose slide" />
              </Carousel>

              <Carousel ariaLabel="Joined-bar gallery" cluster="joined">
                <CarouselViewport>
                  <Slides />
                </CarouselViewport>
                <CarouselControls>
                  <CarouselPreviousTrigger aria-label="Previous slide">
                    <ChevronLeft />
                  </CarouselPreviousTrigger>
                  <CarouselIndicators label="Choose slide" />
                  <CarouselNextTrigger aria-label="Next slide">
                    <ChevronRight />
                  </CarouselNextTrigger>
                </CarouselControls>
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "thumbnails",
      title: "Thumbnails",
      render: () => (
        <InteractiveExample
          elementsCaption={"`primitiv-carousel--indicators-thumbnails` swaps the dots for a filmstrip \u2014 each indicator shows its slide, the active one ringed in the primary colour. Write the indicators out rather than stamping them: a `<primitiv-carousel-indicator-group>` holding one `<primitiv-carousel-indicator>` per slide, each wrapping a `<button>` with the thumbnail inside. `index` is the page it jumps to."}
          elementsPreview={(_density, code) => paintedThumbnails(code)}
          caption={"`indicators=\"thumbnails\"` swaps the dots for a filmstrip — each indicator shows its slide, the active one ringed in the primary colour. Drop the auto `Carousel.Indicators` for `Carousel.IndicatorGroup` + one `Carousel.Indicator` per slide, and put the thumbnail (an `<img>` or a background element) inside each. `index` links the indicator to its page."}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                label: "Thumbnail gallery",
                mods: { indicators: "thumbnails", cluster: "joined" },
                controls: { indicators: elThumbnails() },
              });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode, ["Viewport", "Slide", "PreviousTrigger", "NextTrigger", "IndicatorGroup", "Indicator"]),
              ``,
              `<${p("Root")} ariaLabel="Gallery" indicators="thumbnails">`,
              `  <${p("Viewport")}>{/* slides */}</${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next"><ChevronRight /></${p("NextTrigger")}>`,
              `  <${p("IndicatorGroup")} label="Choose slide">`,
              `    {slides.map((slide, i) => (`,
              `      <${p("Indicator")} key={slide.id} index={i}>`,
              `        <img src={slide.thumb} alt="" />`,
              `      </${p("Indicator")}>`,
              `    ))}`,
              `  </${p("IndicatorGroup")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Thumbnail gallery" indicators="thumbnails" cluster="joined">
                <CarouselViewport>
                  <Slides />
                </CarouselViewport>
                <CarouselControls>
                  <CarouselPreviousTrigger aria-label="Previous slide">
                    <ChevronLeft />
                  </CarouselPreviousTrigger>
                  <CarouselIndicatorGroup label="Choose slide">
                    {GRADIENTS.slice(0, 4).map((bg, i) => (
                      <CarouselIndicator key={i} index={i}>
                        <span style={{ background: bg }} />
                      </CarouselIndicator>
                    ))}
                  </CarouselIndicatorGroup>
                  <CarouselNextTrigger aria-label="Next slide">
                    <ChevronRight />
                  </CarouselNextTrigger>
                </CarouselControls>
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "multiple-slides",
      title: "Multiple slides per page",
      render: () => (
        <InteractiveExample
          elementsCaption={"`slides-per-page` shows several slides at once; navigation is then per **page** \u2014 the controls advance a full page and `<primitiv-carousel-indicators>` stamps one indicator per page. The styled layer sizes the slides from `--primitiv-carousel-slides-per-page`, which CSS cannot read from an attribute, so set it beside `slides-per-page` in `style`, as the styled React wrapper does. `slides-per-move` advances a set number of slides per step instead, windowing so the visible group always stays full. The last page always end-aligns rather than leaving a partial group."}
          elementsPreview={(_density, code) => painted(code)}
          caption="`slidesPerPage` shows several slides at once; each takes an equal share of the viewport (minus the `gap`). Navigation is then per **page** — the triggers advance a full page and the auto `Carousel.Indicators` render one dot per page. `slidesPerMove` (default one page) advances a set number of slides per click instead, windowing so the visible group always stays full. The last page always end-aligns rather than leaving a partial group."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                label: "Product gallery",
                attrs: ' slides-per-page="3"',
                style: "--primitiv-carousel-slides-per-page: 3",
                mods: { gap: "md", cluster: "joined" },
                slides: elSlides(6),
                controls: { previous: "Previous page", next: "Next page", indicators: elIndicators("Choose page") },
              });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode, ["Viewport", "Slide", "Controls", "PreviousTrigger", "NextTrigger", "Indicators"]),
              ``,
              `<${p("Root")} ariaLabel="Products" slidesPerPage={3} gap="md" cluster="joined">`,
              `  <${p("Viewport")}>{/* six slides */}</${p("Viewport")}>`,
              `  <${p("Controls")}>`,
              `    <${p("PreviousTrigger")} aria-label="Previous page"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `    <${p("Indicators")} label="Choose page" />`,
              `    <${p("NextTrigger")} aria-label="Next page"><ChevronRight /></${p("NextTrigger")}>`,
              `  </${p("Controls")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Product gallery" slidesPerPage={3} gap="md" cluster="joined">
                <CarouselViewport>
                  <Slides count={6} />
                </CarouselViewport>
                <CarouselControls>
                  <CarouselPreviousTrigger aria-label="Previous page">
                    <ChevronLeft />
                  </CarouselPreviousTrigger>
                  <CarouselIndicators label="Choose page" />
                  <CarouselNextTrigger aria-label="Next page">
                    <ChevronRight />
                  </CarouselNextTrigger>
                </CarouselControls>
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "loop-autoplay",
      title: "Loop & autoplay",
      render: () => (
        <InteractiveExample
          elementsCaption={"`loop` wraps navigation past the ends (`loop=\"infinite\"` glides on instead of rewinding). `autoplay` advances on a timer while the `playing` attribute is present \u2014 `autoplay-delay` sets the interval in milliseconds \u2014 and pauses on hover, focus and touch (WCAG 2.2.2). `<primitiv-carousel-play-pause-trigger>` is the explicit control: it toggles `playing`, names its `<button>` for what pressing it will do, and shows whichever glyph's `data-play-state` matches. Its `<button>` borrows the Button component's classes here, so the styled form wants `primitiv add button` too. This demo starts **paused** \u2014 press play to start the motion."}
          elementsPreview={(_density, code) => painted(code)}
          caption={"`loop` wraps navigation past the ends (`\"wrap\"` rewinds the track; `\"infinite\"` glides on continuously). `autoplay={{ delay }}` advances on a timer — pair it with `loop` for an endless hero. Autoplay pauses on hover and focus (WCAG 2.2.2). Give the reader an explicit control too: the headless primitive ships `Carousel.PlayPauseTrigger`, while a styled consumer wires their own control to the `playing` / `onPlayingChange` state (there is no styled play/pause part). This demo starts **paused** — press play to start the motion."}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                attrs: ' loop autoplay autoplay-delay="3000"',
                mods: { cluster: "joined" },
                controls: { extra: elPlayPause },
              });
            const p = partNamer(mode, "Carousel");
            // Headless has a dedicated PlayPauseTrigger; the styled surface does
            // not, so a styled consumer drives the controlled `playing` state
            // from their own control (a Button here).
            if (mode === "headless") {
              return [
                imports(mode, ["Viewport", "Slide", "PreviousTrigger", "NextTrigger", "Indicators", "PlayPauseTrigger"], ["ChevronLeft", "ChevronRight", "Play", "Pause"]),
                ``,
                `<${p("Root")} ariaLabel="Featured" loop autoplay={{ delay: 3000 }} defaultPlaying={false}>`,
                `  <${p("Viewport")}>{/* slides */}</${p("Viewport")}>`,
                `  <${p("PreviousTrigger")} aria-label="Previous"><ChevronLeft /></${p("PreviousTrigger")}>`,
                `  <${p("NextTrigger")} aria-label="Next"><ChevronRight /></${p("NextTrigger")}>`,
                `  <${p("Indicators")} label="Choose slide" />`,
                `  <${p("PlayPauseTrigger")}>`,
                `    {({ playing }) => (playing ? <Pause /> : <Play />)}`,
                `  </${p("PlayPauseTrigger")}>`,
                `</${p("Root")}>`,
              ].join("\n");
            }
            return [
              `import { useState } from "react";`,
              imports(mode, ["Viewport", "Slide", "Controls", "PreviousTrigger", "NextTrigger", "Indicators"], ["ChevronLeft", "ChevronRight", "Play", "Pause"]),
              `import { Button } from "@/components/ui/button";`,
              ``,
              `const [playing, setPlaying] = useState(false);`,
              ``,
              `<Carousel`,
              `  ariaLabel="Featured"`,
              `  loop`,
              `  autoplay={{ delay: 3000 }}`,
              `  playing={playing}`,
              `  onPlayingChange={setPlaying}`,
              `>`,
              `  <CarouselViewport>{/* slides */}</CarouselViewport>`,
              `  <CarouselPreviousTrigger aria-label="Previous"><ChevronLeft /></CarouselPreviousTrigger>`,
              `  <CarouselNextTrigger aria-label="Next"><ChevronRight /></CarouselNextTrigger>`,
              `  <CarouselIndicators label="Choose slide" />`,
              `</Carousel>`,
              `<Button variant="secondary" onClick={() => setPlaying((p) => !p)}>`,
              `  {playing ? <Pause /> : <Play />}`,
              `  {playing ? "Pause" : "Play"}`,
              `</Button>`,
            ].join("\n");
          }}
        >
          {() => <LoopAutoplayExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "infinite-loop",
      title: "Infinite loop",
      render: () => (
        <InteractiveExample
          elementsCaption={"`loop=\"infinite\"` moves the track with a transform rather than native scrolling, so passing either end glides on to the next slide instead of rewinding. It translates a `<primitiv-carousel-track>` you put around the slides, and fills it with seam copies of the edge slides so the join is invisible; the copies carry `data-carousel-clone` and stay out of the counts and the accessibility tree. Press next past the last slide, or drag with `allow-mouse-drag`: it always settles on a real slide."}
          elementsPreview={(_density, code) => painted(code)}
          caption={'`loop="infinite"` moves the track with a transform rather than native scrolling, so passing either end glides on to the next slide instead of rewinding. Seam copies of the edge slides make the join invisible; they carry `data-carousel-clone` and stay out of the counts and the accessibility tree. Press Next past the last slide, or drag with `allowMouseDrag`: it always settles on a real slide.'}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({ label: "Featured products, infinite", attrs: ' loop="infinite" allow-mouse-drag', track: true });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode),
              ``,
              `<${p("Root")} ariaLabel="Featured" loop="infinite" allowMouseDrag>`,
              `  <${p("Viewport")}>{/* slides */}</${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous slide"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next slide"><ChevronRight /></${p("NextTrigger")}>`,
              `  <${p("Indicators")} label="Choose slide" />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Featured products, infinite" loop="infinite" allowMouseDrag>
                <CarouselViewport>
                  <Slides />
                </CarouselViewport>
                <SplitControls />
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "linked-slides",
      title: "Linked slides",
      render: () => (
        <InteractiveExample
          elementsPreview={(_density, code) => painted(code).replace(/<a href=/g, '<a class="docs-carousel-slide-link" href=')}
          caption="A slide can be a link. A tap or click reaches it; only a drag past a small threshold steers the track, and that drag suppresses the click, so dragging a linked slide never follows its link by accident."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                label: "Featured products, linked",
                attrs: ' loop="infinite" allow-mouse-drag',
                track: true,
                slides: [1, 2, 3, 4].map((n) => elSlide(`<a href="#slide-${n}">Slide ${n}</a>`)),
              });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode),
              ``,
              `<${p("Root")} ariaLabel="Featured" loop="infinite" allowMouseDrag>`,
              `  <${p("Viewport")}>`,
              `    {products.map((product) => (`,
              `      <${p("Slide")} key={product.id}>`,
              `        <a href={product.href}>{product.name}</a>`,
              `      </${p("Slide")}>`,
              `    ))}`,
              `  </${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous slide"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next slide"><ChevronRight /></${p("NextTrigger")}>`,
              `  <${p("Indicators")} label="Choose slide" />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Featured products, linked" loop="infinite" allowMouseDrag>
                <CarouselViewport>
                  {GRADIENTS.slice(0, 4).map((bg, i) => (
                    <CarouselSlide key={i} style={{ background: bg }}>
                      <a className="docs-carousel-slide-link" href={`#slide-${i + 1}`}>
                        Slide {i + 1}
                      </a>
                    </CarouselSlide>
                  ))}
                </CarouselViewport>
                <SplitControls />
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "slideshow",
      title: "Slideshow (parallax)",
      render: () => (
        <InteractiveExample
          elementsCaption={"`primitiv-carousel--effect-parallax` drifts each slide's content against the scroll as the slide crosses the viewport \u2014 a native, zero-JavaScript effect driven by a CSS view-timeline. It animates a `primitiv-carousel__slide-content` layer around the slide's media, so wrap each image in one; that layer is a styling-only `<span>`, so the headless markup drops it. Browsers without `animation-timeline: view()` fall back to an equivalent transform off the `--slide-progress` the root writes on each slide, and the effect switches off under `prefers-reduced-motion`. Page across the slides to see the drift."}
          elementsPreview={(_density, code) =>
            withGlyphs(code).replace(
              /<span class="primitiv-carousel__slide-content"><img src="\/slides\/(\d)\.jpg" alt="[^"]*"><\/span>/g,
              (_, n: string) =>
                `<span class="primitiv-carousel__slide-content" style="background: ${GRADIENTS[Number(n) - 1]}; display: grid; place-items: center; block-size: 100%; color: #fff; font-size: 3rem; font-weight: 700">${n}</span>`,
            )}
          caption={"`effect=\"parallax\"` drifts each slide's content against the scroll as the slide crosses the viewport — a native, zero-JavaScript effect driven by a CSS view-timeline. It requires wrapping the slide's media in `Carousel.SlideContent`, the layer the animation targets. Browsers without `animation-timeline: view()` fall back to an equivalent transform off the headless progress signal, and it disables entirely under `prefers-reduced-motion`. Page across the slides to see the drift."}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                label: "Slideshow",
                mods: { effect: "parallax", cluster: "joined" },
                slides: [1, 2, 3, 4].map((n) =>
                  elSlide(`<span class="primitiv-carousel__slide-content"><img src="/slides/${n}.jpg" alt="Slide ${n}"></span>`),
                ),
              });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode, ["Viewport", "Slide", "SlideContent", "PreviousTrigger", "NextTrigger", "Indicators"]),
              ``,
              `<${p("Root")} ariaLabel="Slideshow" effect="parallax">`,
              `  <${p("Viewport")}>`,
              `    {slides.map((slide) => (`,
              `      <${p("Slide")} key={slide.id}>`,
              `        <${p("SlideContent")}>`,
              `          <img src={slide.src} alt={slide.alt} />`,
              `        </${p("SlideContent")}>`,
              `      </${p("Slide")}>`,
              `    ))}`,
              `  </${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next"><ChevronRight /></${p("NextTrigger")}>`,
              `  <${p("Indicators")} label="Choose slide" />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Slideshow" effect="parallax" cluster="joined">
                <CarouselViewport>
                  {GRADIENTS.slice(0, 4).map((bg, i) => (
                    <CarouselSlide key={i}>
                      <CarouselSlideContent
                        style={{
                          background: bg,
                          display: "grid",
                          placeItems: "center",
                          blockSize: "100%",
                          color: "#fff",
                          fontSize: "3rem",
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </CarouselSlideContent>
                    </CarouselSlide>
                  ))}
                </CarouselViewport>
                <CarouselControls>
                  <CarouselPreviousTrigger aria-label="Previous slide">
                    <ChevronLeft />
                  </CarouselPreviousTrigger>
                  <CarouselIndicators label="Choose slide" />
                  <CarouselNextTrigger aria-label="Next slide">
                    <ChevronRight />
                  </CarouselNextTrigger>
                </CarouselControls>
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "vertical",
      title: "Vertical orientation",
      render: () => (
        <InteractiveExample
          elementsCaption={"`orientation=\"vertical\"` scrolls and pages on the block axis; the viewport sits beside a stacked control column and the arrow keys become `ArrowUp` / `ArrowDown`. Everything else composes unchanged \u2014 point the control glyphs up and down so they show the way they move."}
          elementsPreview={(_density, code) => painted(code)}
          caption={"`orientation=\"vertical\"` scrolls and pages on the block axis (up/down); the viewport sits beside a stacked control column and the arrow keys become `ArrowUp` / `ArrowDown`. Everything else composes unchanged — swap the trigger glyphs for `ChevronUp` / `ChevronDown` so they point the way they move."}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                attrs: ' orientation="vertical"',
                mods: { cluster: "joined" },
                controls: { icons: ["chevron-up", "chevron-down"] },
              });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode, ["Viewport", "Slide", "Controls", "PreviousTrigger", "NextTrigger", "Indicators"], ["ChevronUp", "ChevronDown"]),
              ``,
              `<${p("Root")} ariaLabel="Featured" orientation="vertical" cluster="joined">`,
              `  <${p("Viewport")}>{/* slides */}</${p("Viewport")}>`,
              `  <${p("Controls")}>`,
              `    <${p("PreviousTrigger")} aria-label="Previous"><ChevronUp /></${p("PreviousTrigger")}>`,
              `    <${p("Indicators")} label="Choose slide" />`,
              `    <${p("NextTrigger")} aria-label="Next"><ChevronDown /></${p("NextTrigger")}>`,
              `  </${p("Controls")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Featured products" orientation="vertical" cluster="joined">
                <CarouselViewport>
                  <Slides />
                </CarouselViewport>
                <CarouselControls>
                  <CarouselPreviousTrigger aria-label="Previous slide">
                    <ChevronUp />
                  </CarouselPreviousTrigger>
                  <CarouselIndicators label="Choose slide" />
                  <CarouselNextTrigger aria-label="Next slide">
                    <ChevronDown />
                  </CarouselNextTrigger>
                </CarouselControls>
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "mouse-drag",
      title: "Mouse drag",
      render: () => (
        <InteractiveExample
          elementsCaption={"`allow-mouse-drag` lets a mouse click-and-drag scroll the viewport, until release lets scroll-snap settle. It is off by default \u2014 an always-on drag can fight drag-sensitive slide content (a nested carousel, a draggable card) \u2014 so it is opt-in. Touch and pen scrolling are native and unaffected either way. Click and drag the slides below."}
          elementsPreview={(_density, code) => painted(code)}
          caption="`allowMouseDrag` lets a mouse click-and-drag scroll the viewport, tracking the pointer 1:1 until release lets scroll-snap settle. It is off by default — an always-on drag can fight drag-sensitive slide content (a nested carousel, a draggable card) — so it is opt-in. Touch and pen scrolling are native and unaffected either way. Click and drag the slides below."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({ attrs: " allow-mouse-drag" });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode),
              ``,
              `<${p("Root")} ariaLabel="Featured" allowMouseDrag>`,
              `  <${p("Viewport")}>{/* slides */}</${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next"><ChevronRight /></${p("NextTrigger")}>`,
              `  <${p("Indicators")} label="Choose slide" />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Featured products" allowMouseDrag>
                <CarouselViewport>
                  <Slides />
                </CarouselViewport>
                <SplitControls />
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "slide-fit",
      title: "Slide fit",
      render: () => (
        <InteractiveExample
          elementsCaption={"When a slide holds a real image, its `fit` class decides how the image fills the slide box. `primitiv-carousel__slide--fit-cover` (the default) fills and crops, preserving the image's ratio \u2014 best for photography. `--fit-contain` fits the whole image without cropping and letterboxes the rest; pair it with `--surface-subtle` to give the letterbox a backdrop. Page between the two slides below \u2014 same image, cover then contain."}
          elementsPreview={(_density, code) => withGlyphs(code).replaceAll('src="/photo.jpg"', `src="${PHOTO}"`)}
          caption={"When a slide holds a real image, `fit` on `Carousel.Slide` decides how it fills the slide box. `cover` (the default) fills and crops, preserving the image's ratio — best for photography. `contain` fits the whole image without cropping and letterboxes the rest; pair it with `surface=\"subtle\"` to give the letterbox a backdrop. Page between the two slides below — same image, `cover` then `contain`."}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                label: "Slide fit demo",
                mods: { cluster: "joined" },
                slides: [
                  elSlide('<img src="/photo.jpg" alt="A landscape">', { fit: "cover" }),
                  elSlide('<img src="/photo.jpg" alt="A landscape">', { fit: "contain", surface: "subtle" }),
                ],
              });
            const p = partNamer(mode, "Carousel");
            return [
              imports(mode, ["Viewport", "Slide", "PreviousTrigger", "NextTrigger", "Indicators"]),
              ``,
              `<${p("Root")} ariaLabel="Fit demo">`,
              `  <${p("Viewport")}>`,
              `    <${p("Slide")} fit="cover">`,
              `      <img src="/photo.jpg" alt="A landscape" />`,
              `    </${p("Slide")}>`,
              `    <${p("Slide")} fit="contain" surface="subtle">`,
              `      <img src="/photo.jpg" alt="A landscape" />`,
              `    </${p("Slide")}>`,
              `  </${p("Viewport")}>`,
              `  <${p("PreviousTrigger")} aria-label="Previous"><ChevronLeft /></${p("PreviousTrigger")}>`,
              `  <${p("NextTrigger")} aria-label="Next"><ChevronRight /></${p("NextTrigger")}>`,
              `  <${p("Indicators")} label="Choose slide" />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Carousel ariaLabel="Slide fit demo" cluster="joined">
                <CarouselViewport>
                  <CarouselSlide fit="cover">
                    <img src={PHOTO} alt="A stylised landscape" />
                  </CarouselSlide>
                  <CarouselSlide fit="contain" surface="subtle">
                    <img src={PHOTO} alt="A stylised landscape" />
                  </CarouselSlide>
                </CarouselViewport>
                <CarouselControls>
                  <CarouselPreviousTrigger aria-label="Previous slide">
                    <ChevronLeft />
                  </CarouselPreviousTrigger>
                  <CarouselIndicators label="Choose slide" />
                  <CarouselNextTrigger aria-label="Next slide">
                    <ChevronRight />
                  </CarouselNextTrigger>
                </CarouselControls>
              </Carousel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "The Root is the WAI-ARIA Carousel region. Name it with `ariaLabel` or `ariaLabelledBy` — without a name a screen-reader user has no idea what the region rotates through. Each `Carousel.Slide` is a labelled group in the set.",
    "The prev/next controls and every indicator are real `<button>`s wired to the paging state, so `Enter` and `Space` activate them and the Viewport itself pages with the arrow keys, Home and End. Give each prev/next trigger its own `aria-label` — the glyph alone says nothing.",
    "Autoplay pauses on hover and on keyboard focus (WCAG 2.2.2, Pause/Stop/Hide), and `Carousel.PlayPauseTrigger` gives an explicit, discoverable control. Prefer starting paused, or honour `prefers-reduced-motion` before starting motion on load.",
    "`effect=\"parallax\"` disables itself entirely under `prefers-reduced-motion: reduce`, so the drift never plays for a user who has asked motion to stop — the slides still page, just without the effect.",
    "Loop clones under `loop=\"infinite\"` are marked `data-carousel-clone` and kept out of the counts and the accessibility tree, so a screen reader never announces a duplicated slide.",
    "Indicator thumbnails are decorative — the `<img>` inside a `Carousel.Indicator` should have empty `alt`, since the indicator's own accessible name already says which slide it jumps to.",
  ],

  elements: {
    description:
      "A carousel: the WAI-ARIA Carousel pattern over a native scroll-snap viewport. `<primitiv-carousel>` is the region and holds the page in its reflected `page` attribute; the previous and next controls, the indicators, the arrow keys, the wheel, a swipe and (opt-in) a mouse drag all page it, with optional autoplay and an infinite loop. `primitiv-carousel-change` reports each move before it lands, and is cancelable.",
    anatomyMeta:
      "`<primitiv-carousel>` is the region that owns the page, around a `<primitiv-carousel-viewport>` of `<primitiv-carousel-slide>`s, plus the controls. Each control wraps the `<button>` you write and makes it the control: `<primitiv-carousel-previous-trigger>`, `<primitiv-carousel-next-trigger>`, and `<primitiv-carousel-play-pause-trigger>` for autoplay. `<primitiv-carousel-indicators>` stamps one indicator per page from its `<template>`; for thumbnails or your own markup, write a `<primitiv-carousel-indicator-group>` of `<primitiv-carousel-indicator>`s instead. `loop=\"infinite\"` needs a `<primitiv-carousel-track>` around the slides, and `<primitiv-carousel-progress-text>` prints the page as text (\"2 of 4\"). The joined control bar and the parallax layer are classes on plain `<span>`s, not elements.",
    keyboardMeta:
      "The viewport is focusable \u2014 it gets `tabindex=\"0\"` unless you set one \u2014 and pages with the arrow keys; the controls are the real `<button>`s inside the trigger elements, and each indicator is a button that jumps to its page. The keys follow the scroll axis, so they change with `orientation`; they do not mirror under `dir=\"rtl\"`, where `ArrowRight` still advances.",
    accessibility: [
      "`<primitiv-carousel>` writes `role=\"region\"` and `aria-roledescription=\"carousel\"`; name it with `aria-label` or `aria-labelledby` \u2014 without a name a screen-reader user has no idea what the region rotates through. Each slide becomes a group named for its place (\"2 of 4\"): `slide-label` rewords every slide, and a slide's own `label` replaces its name.",
      "The previous and next controls and every indicator are the real `<button>`s you put inside them, so `Enter` and `Space` activate them, and the focusable viewport pages with the arrow keys, Home and End. At either end a control is `disabled` unless the carousel loops. Give each previous and next `<button>` its own `aria-label` \u2014 the glyph alone says nothing.",
      "Autoplay pauses on hover, on keyboard focus and while a touch is down (WCAG 2.2.2, Pause, Stop, Hide), and `<primitiv-carousel-play-pause-trigger>` gives an explicit control, named for what pressing it will do (`start-label` / `stop-label`). The viewport's `aria-live` is `off` while playing and `polite` otherwise, so timed changes are not announced. Leave `playing` off on load, or check `prefers-reduced-motion` before adding it.",
      "`primitiv-carousel--effect-parallax` disables itself entirely under `prefers-reduced-motion: reduce`, so the drift never plays for a user who has asked motion to stop \u2014 the slides still page, just without the effect.",
      "The copies `loop=\"infinite\"` adds are `inert`, `aria-hidden` and stripped of their ids, and carry `data-carousel-clone`, so a screen reader never announces a duplicated slide and the counts stay true.",
      "Indicator thumbnails are decorative \u2014 give the `<img>` inside an indicator's `<button>` an empty `alt`, since the root names each indicator for the slide it jumps to (`indicator-label`, \"Slide 2\" by default).",
    ],
  },
};
