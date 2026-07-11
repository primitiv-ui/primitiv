import { useState, type ReactNode } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "@primitiv-ui/icons";

import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  AccordionTriggerIcon,
  Carousel,
  CarouselViewport,
  CarouselControls,
  CarouselSlide,
  CarouselPreviousTrigger,
  CarouselNextTrigger,
  CarouselIndicatorGroup,
  CarouselIndicator,
  CarouselIndicators,
} from "../components";
import "./CarouselBuilder.css";

// The controls-panel sections. Rendered as a single `multiple` Accordion, all
// expanded by default (controlled value seeded with every id) so every control
// is visible on load and the human collapses just what they're not tuning.
const SECTIONS = [
  "layout",
  "slides",
  "spacing",
  "indicators",
  "transition",
] as const;

// Gradients stand in for photography — the same stand-ins the example pages use.
// Eight, so the slide-count slider can range 1–8.
const GALLERY = [
  "linear-gradient(135deg, #1e3a8a, #14b8a6)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #ea580c, #16a34a)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "linear-gradient(135deg, #db2777, #f59e0b)",
  "linear-gradient(135deg, #0d9488, #4f46e5)",
  "linear-gradient(135deg, #9333ea, #06b6d4)",
  "linear-gradient(135deg, #dc2626, #facc15)",
];

type Placement = "external" | "overlay";
type Orientation = "horizontal" | "vertical";
type Side = "after" | "before";
type Distribution = "group" | "stretch";
type Align = "start" | "center" | "end";
type Cluster = "split" | "joined";
type Ratio = "square" | "standard" | "wide" | "ultrawide";
type Radius = "md" | "none";
type Sizing = "none" | "sm" | "md" | "lg";
type Surface = "none" | "subtle";
type Indicators = "dots" | "thumbnails";
type Transition = "slide" | "fade";

interface BuilderConfig {
  placement: Placement;
  orientation: Orientation;
  side: Side;
  distribution: Distribution;
  align: Align;
  cluster: Cluster;
  rtl: boolean;
  slideCount: number;
  slidesPerPage: number;
  ratio: Ratio;
  radius: Radius;
  gap: Sizing;
  peek: Sizing;
  padding: Sizing;
  surface: Surface;
  indicators: Indicators;
  transition: Transition;
}

// The defaults reproduce the iteration-1 baseline (external · after · group ·
// center · dots · slide), so the Builder opens on the known-good look.
const DEFAULT_CONFIG: BuilderConfig = {
  placement: "external",
  orientation: "horizontal",
  side: "after",
  distribution: "group",
  align: "center",
  cluster: "split",
  rtl: false,
  slideCount: 4,
  slidesPerPage: 1,
  ratio: "wide",
  radius: "md",
  gap: "md",
  peek: "none",
  padding: "none",
  surface: "none",
  indicators: "dots",
  transition: "slide",
};

const SIZING: readonly Sizing[] = ["none", "sm", "md", "lg"];

// One accordion section — a titled, independently-collapsible panel of controls.
function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionHeader>
        <AccordionTrigger>
          {title}
          <AccordionTriggerIcon>
            <ChevronDown aria-hidden="true" />
          </AccordionTriggerIcon>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>
        <div className="carousel-builder__section-body">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function RadioField<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  disabled = false,
  note,
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  // When an axis is a no-op for the current combination (e.g. align under
  // distribution=stretch), the field is greyed out with a short reason.
  disabled?: boolean;
  note?: string;
}) {
  return (
    <fieldset className="carousel-builder__field" disabled={disabled}>
      <legend className="carousel-builder__legend">
        {legend}
        {disabled && note ? (
          <span className="carousel-builder__na"> — {note}</span>
        ) : null}
      </legend>
      <div className="carousel-builder__radios">
        {options.map((option) => (
          <label key={option} className="carousel-builder__radio">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="carousel-builder__field carousel-builder__range">
      <span className="carousel-builder__legend">
        {label}: <strong>{value}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="carousel-builder__check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

// The live instance. Composition branches on `cluster`: `joined` groups prev /
// indicators / next inside a <CarouselControls> bar (for both external and
// overlay); `split` renders them as direct children of the root (the grid / absolute
// layout flanks prev/next and places the indicator cluster). Everything else is a
// straight prop passthrough.
function LiveCarousel({ config }: { config: BuilderConfig }) {
  const slides = GALLERY.slice(0, config.slideCount);
  const isVertical = config.orientation === "vertical";
  // `joined` bundles prev/indicators/next into the CarouselControls bar so they
  // travel together; `split` flanks prev/next at the viewport edges with a separate
  // indicator cluster. Vertical overlay can't join (its up/pill/down share one
  // lane), so it stays split there.
  const verticalOverlay = config.placement === "overlay" && isVertical;
  const joined = config.cluster === "joined" && !verticalOverlay;
  const useControlsBar = joined;

  const prev = (
    <CarouselPreviousTrigger aria-label="Previous slide">
      {isVertical ? <ChevronUp /> : <ChevronLeft />}
    </CarouselPreviousTrigger>
  );
  const next = (
    <CarouselNextTrigger aria-label="Next slide">
      {isVertical ? <ChevronDown /> : <ChevronRight />}
    </CarouselNextTrigger>
  );

  // Dots use the auto <CarouselIndicators> (one per *page*, correct across
  // slidesPerPage). Thumbnails need per-slide children, so they use the manual
  // group with an image thumb per slide.
  const indicators =
    config.indicators === "thumbnails" ? (
      <CarouselIndicatorGroup label="Choose slide">
        {slides.map((background, index) => (
          <CarouselIndicator key={index} index={index}>
            <span
              className="carousel-builder__thumb"
              style={{ background }}
            />
          </CarouselIndicator>
        ))}
      </CarouselIndicatorGroup>
    ) : (
      <CarouselIndicators label="Choose slide" />
    );

  const controls = useControlsBar ? (
    <CarouselControls>
      {prev}
      {indicators}
      {next}
    </CarouselControls>
  ) : (
    <>
      {prev}
      {indicators}
      {next}
    </>
  );

  return (
    <div
      className="carousel-builder__stage"
      dir={config.rtl ? "rtl" : undefined}
    >
      <Carousel
        ariaLabel="Carousel builder preview"
        orientation={config.orientation}
        placement={config.placement}
        side={config.side}
        distribution={config.distribution}
        align={config.align}
        cluster={joined ? "joined" : "split"}
        peek={config.peek}
        padding={config.padding}
        surface={config.surface}
        gap={config.gap}
        indicators={config.indicators}
        transition={config.transition}
        slidesPerPage={config.slidesPerPage}
      >
        <CarouselViewport>
          {slides.map((background, index) => (
            <CarouselSlide
              key={index}
              radius={config.radius}
              ratio={config.ratio}
              style={{ background }}
            />
          ))}
        </CarouselViewport>
        {controls}
      </Carousel>
    </div>
  );
}

// A copy-pasteable echo of the active props, so a spotted bug reports the exact
// combination that produced it.
function describe(config: BuilderConfig): string {
  const props: string[] = [
    `orientation="${config.orientation}"`,
    `placement="${config.placement}"`,
    `side="${config.side}"`,
    `distribution="${config.distribution}"`,
    `align="${config.align}"`,
    `cluster="${config.cluster}"`,
    `gap="${config.gap}"`,
    `peek="${config.peek}"`,
    `padding="${config.padding}"`,
    `surface="${config.surface}"`,
    `indicators="${config.indicators}"`,
    `transition="${config.transition}"`,
    `slidesPerPage={${config.slidesPerPage}}`,
  ];
  if (config.rtl) props.unshift(`dir="rtl"`);
  const slide = `  <CarouselSlide radius="${config.radius}" ratio="${config.ratio}" /> × ${config.slideCount}`;
  return `<Carousel\n  ${props.join("\n  ")}\n>\n${slide}\n</Carousel>`;
}

/**
 * The Builder — a live composability sandbox. Every carousel axis is a control
 * on the left (grouped into open-by-default Accordion sections); a single
 * instance on the right re-renders as the controls change. It exists to QA how
 * the features compose and to surface edge cases the per-feature example pages
 * don't cover.
 */
export function CarouselBuilder() {
  const [config, setConfig] = useState<BuilderConfig>(DEFAULT_CONFIG);
  // Controlled accordion so every section can start expanded (uncontrolled only
  // opens a single defaultValue); the human collapses individually from there.
  const [openSections, setOpenSections] = useState<string[]>([...SECTIONS]);

  function set<K extends keyof BuilderConfig>(key: K, value: BuilderConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  // distribution/align position the joined bar or the split indicator cluster —
  // except vertical overlay, where up/pill/down share one lane, so both are inert
  // there. align is also moot under distribution=stretch (the cluster fills its edge).
  const verticalOverlay =
    config.placement === "overlay" && config.orientation === "vertical";
  const alignDisabled = verticalOverlay || config.distribution === "stretch";

  // cluster (split/joined) is read by both placements, except vertical overlay,
  // which is split-only (its up/pill/down share one lane).
  const clusterApplies = !verticalOverlay;
  const clusterNote = "split only for vertical overlay";

  return (
    <article className="carousel-builder">
      <header className="carousel-builder__intro">
        <div>
          <h1>Builder</h1>
          <p className="carousel-builder__note">
            Configure the carousel on the left; the instance on the right updates
            live. Use it to stress-test how the features compose and to spot
            missing edge cases.
          </p>
        </div>
        <button
          type="button"
          className="carousel-builder__reset"
          onClick={() => setConfig(DEFAULT_CONFIG)}
        >
          Reset
        </button>
      </header>

      <div className="carousel-builder__grid">
        <div className="carousel-builder__controls">
          <Accordion
            multiple
            value={openSections}
            onValueChange={setOpenSections}
          >
          <Section value="layout" title="Layout">
            <RadioField
              legend="placement"
              name="placement"
              value={config.placement}
              options={["external", "overlay"] as const}
              onChange={(value) => set("placement", value)}
            />
            <RadioField
              legend="orientation"
              name="orientation"
              value={config.orientation}
              options={["horizontal", "vertical"] as const}
              onChange={(value) => set("orientation", value)}
            />
            <RadioField
              legend="side"
              name="side"
              value={config.side}
              options={["after", "before"] as const}
              onChange={(value) => set("side", value)}
            />
            <RadioField
              legend="distribution"
              name="distribution"
              value={config.distribution}
              options={["group", "stretch"] as const}
              onChange={(value) => set("distribution", value)}
              disabled={verticalOverlay}
              note="n/a for vertical overlay"
            />
            <RadioField
              legend="align"
              name="align"
              value={config.align}
              options={["start", "center", "end"] as const}
              onChange={(value) => set("align", value)}
              disabled={alignDisabled}
              note={
                verticalOverlay
                  ? "n/a for vertical overlay"
                  : "n/a when distribution=stretch"
              }
            />
            <RadioField
              legend="cluster"
              name="cluster"
              value={config.cluster}
              options={["split", "joined"] as const}
              onChange={(value) => set("cluster", value)}
              disabled={!clusterApplies}
              note={clusterNote}
            />
            <CheckField
              label={'RTL (dir="rtl")'}
              checked={config.rtl}
              onChange={(value) => set("rtl", value)}
            />
          </Section>

          <Section value="slides" title="Slides">
            <RangeField
              label="slide count"
              min={1}
              max={GALLERY.length}
              value={config.slideCount}
              onChange={(value) => set("slideCount", value)}
            />
            <RangeField
              label="slidesPerPage"
              min={1}
              max={4}
              value={config.slidesPerPage}
              onChange={(value) => set("slidesPerPage", value)}
            />
            <RadioField
              legend="ratio"
              name="ratio"
              value={config.ratio}
              options={["square", "standard", "wide", "ultrawide"] as const}
              onChange={(value) => set("ratio", value)}
            />
            <RadioField
              legend="radius"
              name="radius"
              value={config.radius}
              options={["md", "none"] as const}
              onChange={(value) => set("radius", value)}
            />
          </Section>

          <Section value="spacing" title="Spacing & frame">
            <RadioField
              legend="gap"
              name="gap"
              value={config.gap}
              options={SIZING}
              onChange={(value) => set("gap", value)}
            />
            <RadioField
              legend="peek"
              name="peek"
              value={config.peek}
              options={SIZING}
              onChange={(value) => set("peek", value)}
            />
            <RadioField
              legend="padding"
              name="padding"
              value={config.padding}
              options={SIZING}
              onChange={(value) => set("padding", value)}
            />
            <RadioField
              legend="surface"
              name="surface"
              value={config.surface}
              options={["none", "subtle"] as const}
              onChange={(value) => set("surface", value)}
            />
          </Section>

          <Section value="indicators" title="Indicators">
            <RadioField
              legend="indicators"
              name="indicators"
              value={config.indicators}
              options={["dots", "thumbnails"] as const}
              onChange={(value) => set("indicators", value)}
            />
          </Section>

          <Section value="transition" title="Transition">
            <RadioField
              legend="transition"
              name="transition"
              value={config.transition}
              options={["slide", "fade"] as const}
              onChange={(value) => set("transition", value)}
            />
          </Section>
          </Accordion>
        </div>

        <div className="carousel-builder__preview">
          <LiveCarousel config={config} />
          <pre className="carousel-builder__readout">{describe(config)}</pre>
        </div>
      </div>
    </article>
  );
}
