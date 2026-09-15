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
    "The Viewport is focusable and pages with the arrow keys; the prev/next controls are real `<button>`s, and each indicator is a button that jumps to its page. The keys follow the scroll axis, so they flip with `orientation` and mirror under `dir=\"rtl\"`.",

  keyboard: [
    {
      keys: ["ArrowRight", "ArrowLeft"],
      behaviour:
        "Advance / retreat one page, when `orientation` is horizontal (the default). Mirrored under `dir=\"rtl\"`.",
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
          caption={"The minimal carousel: a `Carousel.Viewport` of `Carousel.Slide`s, prev/next triggers, and `Carousel.Indicators` (one dot per page, auto). `ariaLabel` on the Root names the region; give each trigger its own `aria-label`. This is the default `placement=\"external\"` `cluster=\"split\"` layout — prev/next flank the viewport, the dots sit below."}
          code={(_density, mode) => {
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
          caption={"Two orthogonal axes place the controls. `placement` is off-vs-on the imagery — `external` (the default) keeps them in the space around the viewport, `overlay` insets them on the slide for edge-to-edge photography. `cluster` is the arrangement — `split` (the default) flanks the viewport with prev/next and leaves the indicators apart, `joined` bundles prev + indicators + next into one `Carousel.Controls` bar. `side`, `distribution` and `align` then position the cluster along its edge. Below: an `overlay` carousel over one with a `joined` bar."}
          code={(_density, mode) => {
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
          caption={"`indicators=\"thumbnails\"` swaps the dots for a filmstrip — each indicator shows its slide, the active one ringed in the primary colour. Drop the auto `Carousel.Indicators` for `Carousel.IndicatorGroup` + one `Carousel.Indicator` per slide, and put the thumbnail (an `<img>` or a background element) inside each. `index` links the indicator to its page."}
          code={(_density, mode) => {
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
          caption="`slidesPerPage` shows several slides at once; each takes an equal share of the viewport (minus the `gap`). Navigation is then per **page** — the triggers advance a full page and the auto `Carousel.Indicators` render one dot per page. `slidesPerMove` (default one page) advances a set number of slides per click instead, windowing so the visible group always stays full. The last page always end-aligns rather than leaving a partial group."
          code={(_density, mode) => {
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
          caption={"`loop` wraps navigation past the ends (`\"wrap\"` rewinds the track; `\"infinite\"` glides on continuously). `autoplay={{ delay }}` advances on a timer — pair it with `loop` for an endless hero. Autoplay pauses on hover and focus (WCAG 2.2.2). Give the reader an explicit control too: the headless primitive ships `Carousel.PlayPauseTrigger`, while a styled consumer wires their own control to the `playing` / `onPlayingChange` state (there is no styled play/pause part). This demo starts **paused** — press play to start the motion."}
          code={(_density, mode) => {
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
      id: "slideshow",
      title: "Slideshow (parallax)",
      render: () => (
        <InteractiveExample
          caption={"`effect=\"parallax\"` drifts each slide's content against the scroll as the slide crosses the viewport — a native, zero-JavaScript effect driven by a CSS view-timeline. It requires wrapping the slide's media in `Carousel.SlideContent`, the layer the animation targets. Browsers without `animation-timeline: view()` fall back to an equivalent transform off the headless progress signal, and it disables entirely under `prefers-reduced-motion`. Page across the slides to see the drift."}
          code={(_density, mode) => {
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
          caption={"`orientation=\"vertical\"` scrolls and pages on the block axis (up/down); the viewport sits beside a stacked control column and the arrow keys become `ArrowUp` / `ArrowDown`. Everything else composes unchanged — swap the trigger glyphs for `ChevronUp` / `ChevronDown` so they point the way they move."}
          code={(_density, mode) => {
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
          caption="`allowMouseDrag` lets a mouse click-and-drag scroll the viewport, tracking the pointer 1:1 until release lets scroll-snap settle. It is off by default — an always-on drag can fight drag-sensitive slide content (a nested carousel, a draggable card) — so it is opt-in. Touch and pen scrolling are native and unaffected either way. Click and drag the slides below."
          code={(_density, mode) => {
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
          caption={"When a slide holds a real image, `fit` on `Carousel.Slide` decides how it fills the slide box. `cover` (the default) fills and crops, preserving the image's ratio — best for photography. `contain` fits the whole image without cropping and letterboxes the rest; pair it with `surface=\"subtle\"` to give the letterbox a backdrop. Page between the two slides below — same image, `cover` then `contain`."}
          code={(_density, mode) => {
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
};
