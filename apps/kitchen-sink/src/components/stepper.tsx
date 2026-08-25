import "../styles/primitiv/stepper/styles.css";
/*
 * Stepper — styled wrapper, HAND-AUTHORED (composes the headless Tabs).
 *
 * Copied into the consumer repo by `primitiv add stepper`. The structure is
 * bespoke (markers, connectors, a step's own progress state), so it is not
 * generated from contract.json and carries no drift-guard test — keep
 * contract.json + the stylesheet + this file in sync by hand.
 *
 * THE STEP ROW IS A TABLIST. Each marker is a real `Tabs.Trigger`, restyled as
 * a circle: activation, `aria-selected`, the roving tabindex, Home/End and
 * `disabled` all arrive from Tabs, correct, for free. The headless library
 * exists precisely so a styled layer can make a Trigger look like anything.
 * Activation is `manual` by default — automatic activation would change step
 * the moment focus lands and discard whatever is half-typed in the panel.
 *
 * Compound by design: a step's content is arbitrary, so the parts are exported
 * individually rather than driven by props on one component. `Stepper` owns no
 * step data model — you write the steps, exactly as `breadcrumb-overflow` takes
 * children rather than a `label`/`href` array.
 *
 * TWO STATES, DELIBERATELY SEPARATE. `data-state` (from Tabs) says which step
 * is CURRENT; `data-step-state` (from StepperStep) says what progress a step
 * carries in its own right. A failed step keeps `data-step-state="error"` while
 * you stand on a later one, which one merged "active" flag could not express.
 *
 * THE CONNECTOR IS A PSEUDO-ELEMENT ON THE STEP, not a component. A segment is
 * filled when the step to its RIGHT has been reached, so drawing it as
 * `::before` on that step makes the rule local — the step colours its own
 * incoming connector and CSS never has to look forward. That is also what lets
 * it animate: the fill is a `scaleX` from the leading edge, so advancing a step
 * runs the line into the marker rather than repainting it.
 */
import { Tabs } from "@primitiv-ui/react";
import {
  Children,
  createContext,
  useContext,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import {
  stepper,
  stepperDescription,
  stepperLabel,
  stepperList,
  stepperMarker,
  stepperPanel,
  stepperStep,
} from "./stepper.recipe";

function cx(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * `Tabs.Root`'s props are a discriminated union — controlled (`value` +
 * `onValueChange`) or uncontrolled (`defaultValue`) — and a plain `Omit`
 * collapses it into one shape whose `value` is required-but-possibly-undefined.
 * Distributing over the union keeps both arms intact (same helper the generated
 * Tabs wrapper uses).
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * Explicit literal unions rather than the `class-variance-authority`-derived
 * variants, whose inference can widen to a bare `string` depending on how the
 * recipe was declared (same reasoning as `alert` and `card`).
 */
type Size = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * What a step carries in its own right, independently of which step is current.
 * `current` is deliberately absent — that is `data-state="active"`, which Tabs
 * already owns.
 */
export type StepState = "upcoming" | "complete" | "error";

const StepperStepContext = createContext<StepState>("upcoming");

/** The completed tick. NOT an icon: it is Checkbox's mark, drawn the same way
 *  (a `currentColor` box behind a clip-path) and sized from Checkbox's own
 *  token, so a completed step and a ticked checkbox carry exactly the same
 *  stroke weight at every size and density. An icon glyph could only ever
 *  approximate that, because its stroke weight is fixed in the path. */
function CheckMark() {
  return <span className="primitiv-stepper__marker-mark" aria-hidden="true" />;
}

function ErrorMark() {
  return (
    <svg
      className="primitiv-stepper__marker-error"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="10.2" y="3.6" width="3.6" height="10.6" rx="1.8" />
      <circle cx="12" cy="18.6" r="2" />
    </svg>
  );
}

export type StepperProps = DistributiveOmit<
  ComponentPropsWithRef<typeof Tabs.Root>,
  "size"
> & {
  /**
   * Marker, label and panel size for the whole rail; `data-density` scales each
   * size further. Below `lg` the marker is smaller than the 44px minimum touch
   * target, so the hit area is widened independently — see
   * `--primitiv-stepper-tap-target`.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/stepper
   */
  size?: Size;
};

/**
 * The root of a stepper — a `Tabs.Root` whose value is the current step,
 * rendering a single container `<div>`.
 *
 * Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`),
 * exactly as Tabs: the current step IS the Tabs value, so a wizard needs no
 * state of its own beyond the one string. Activation defaults to `"manual"`
 * rather than Tabs' own `"automatic"` — arrow keys move focus along the rail
 * and `Enter`/`Space` commits, so browsing the steps never discards what is
 * half-typed in the current panel.
 *
 * Every child part is exported separately; `Stepper` owns no step data model.
 *
 * @extends HTMLDivElement
 *
 * @example Uncontrolled
 * ```tsx
 * <Stepper defaultValue="account">
 *   <StepperList label="Sign-up progress">...</StepperList>
 *   <StepperPanel value="account">...</StepperPanel>
 * </Stepper>
 * ```
 *
 * @example Controlled, driving Back / Continue
 * ```tsx
 * const [step, setStep] = useState("account");
 * <Stepper value={step} onValueChange={setStep} size="lg">...</Stepper>
 * ```
 *
 * @example A vertical rail
 * ```tsx
 * <Stepper defaultValue="account" orientation="vertical">...</Stepper>
 * ```
 *
 * @see {@link StepperList} for the rail, {@link StepperPanel} for a step's body.
 * @see https://primitiv-ui.dev/docs/components/stepper
 */
export function Stepper({
  size,
  className,
  activationMode = "manual",
  ...props
}: StepperProps) {
  return (
    <Tabs.Root
      className={cx(stepper({ size }), className)}
      activationMode={activationMode}
      {...props}
    />
  );
}

export type StepperListProps = ComponentPropsWithRef<typeof Tabs.List> & {
  /**
   * Collapse the rail into a progress bar — the same steps, drawn as segments
   * with their markers and labels hidden. For narrow containers, where a
   * labelled rail cannot fit.
   *
   * Deliberately a presentation of the SAME steps rather than different markup:
   * the triggers stay mounted, so every {@link StepperPanel} keeps its
   * `aria-labelledby` pointing at a real trigger. Swapping the rail out for a
   * hand-rolled bar at narrow widths breaks that reference on exactly the
   * viewport where it is least likely to be noticed.
   *
   * Stepper owns no step data model, so pair it with your own "Step N of M"
   * line — you already have the index.
   * @default false
   */
  compact?: boolean;
};

/**
 * The rail — a `Tabs.List` rendering `<div role="tablist">`, laid out as equal
 * cells so every step owns the same fraction of the width and a long label can
 * never collide with its neighbour.
 *
 * Requires `label` or `ariaLabelledBy`: a tablist with no accessible name gives
 * a screen-reader user no idea what the steps belong to.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <StepperList label="Sign-up progress">
 *   <StepperStep value="account" state="complete">...</StepperStep>
 * </StepperList>
 * ```
 *
 * @example Collapsing to a progress bar on narrow screens
 * ```tsx
 * const isNarrow = useMediaQuery("(max-width: 40rem)");
 * <StepperList label="Sign-up progress" compact={isNarrow}>...</StepperList>
 * ```
 *
 * @see {@link StepperStep} for one entry.
 */
export function StepperList({
  compact = false,
  className,
  ...props
}: StepperListProps) {
  return (
    <Tabs.List className={cx(stepperList({ compact }), className)} {...props} />
  );
}

export type StepperStepProps = ComponentPropsWithRef<typeof Tabs.Trigger> & {
  /**
   * The progress this step carries in its own right, published as
   * `data-step-state`. Deliberately independent of which step is *current* —
   * that is `data-state="active"`, owned by {@link Stepper}'s value — so a
   * failed step keeps its error marker while the user stands on a later one.
   *
   * {@link StepperMarker} reads this to decide whether to render its children
   * (the step number), a tick, or a warning glyph.
   * - `upcoming` — Not yet done (the default).
   * - `complete` — Done; the marker becomes a tick.
   * - `error` — Failed validation; the marker becomes a warning glyph.
   * @default "upcoming"
   * @see {@link StepState}
   */
  state?: StepState;
};

/**
 * One step — a `Tabs.Trigger` rendering `<button role="tab">`, restyled as a
 * marker over (or beside) its label.
 *
 * Carries **two** independent state hooks, and the distinction matters: Tabs
 * sets `data-state="active"` on whichever step is *current*, while this
 * component sets `data-step-state` from its {@link StepperStepProps.state}
 * prop for the progress the step carries *in its own right*. A step that failed
 * validation keeps `data-step-state="error"` while the user stands on a later
 * one — a single merged flag could not express that.
 *
 * Provides its state to {@link StepperMarker} through context, so the marker can
 * swap its glyph without the caller repeating itself.
 *
 * There is no `linear` prop: a step the user has not reached yet is a
 * `disabled` step, which is already a `Tabs.Trigger` prop and already correct
 * for keyboard and screen readers.
 *
 * @extends HTMLButtonElement
 *
 * @example A completed step
 * ```tsx
 * <StepperStep value="account" state="complete">
 *   <StepperMarker>1</StepperMarker>
 *   <StepperLabel>Account</StepperLabel>
 * </StepperStep>
 * ```
 *
 * @example Locking a step the user cannot reach yet
 * ```tsx
 * <StepperStep value="review" disabled>...</StepperStep>
 * ```
 *
 * @see {@link StepperMarker}, {@link StepperLabel}, {@link StepperDescription}.
 */
export function StepperStep({
  state = "upcoming",
  className,
  children,
  ...props
}: StepperStepProps) {
  return (
    <StepperStepContext.Provider value={state}>
      <Tabs.Trigger
        className={cx(stepperStep(), className)}
        data-step-state={state}
        {...props}
      >
        {children}
      </Tabs.Trigger>
    </StepperStepContext.Provider>
  );
}

/**
 * `text-box-trim` is only honoured on the element that directly wraps the text
 * node, never on a flex container — and the marker is a flex box that also holds
 * the tick / warning SVGs. So the step number gets its own span, exactly as
 * `TabsTrigger` wraps its label. Without the trim the marker centres the font's
 * full line box rather than the digit, and Khand's asymmetric ascender/descender
 * metrics make that visibly off-centre inside a circle.
 */
function wrapStepperMarkerTextNodes(children: ReactNode): ReactNode {
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className="primitiv-stepper__marker-number">{child}</span>
    ) : (
      child
    ),
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

export type StepperMarkerProps = ComponentPropsWithRef<"span">;

/**
 * The circle at the head of a step, rendering a `<span>`.
 *
 * Renders its children — the step number — but swaps in a tick or a warning
 * glyph once the enclosing {@link StepperStep} reports `complete` or `error`,
 * so the caller writes the number once and never branches on state. Both glyphs
 * are inlined SVGs, so installing Stepper pulls in no icon package.
 *
 * Reads its state from {@link StepperStep} through context and so must be
 * rendered inside one; on its own it always shows its children.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <StepperMarker>2</StepperMarker>
 * ```
 */
export function StepperMarker({
  className,
  children,
  ...props
}: StepperMarkerProps) {
  const state = useContext(StepperStepContext);
  return (
    <span className={cx(stepperMarker(), className)} {...props}>
      {state === "complete" ? (
        <CheckMark />
      ) : state === "error" ? (
        <ErrorMark />
      ) : (
        wrapStepperMarkerTextNodes(children)
      )}
    </span>
  );
}

export type StepperLabelProps = ComponentPropsWithRef<"span">;

/**
 * A step's title, rendering a `<span>`. Trimmed to its cap height so it sits
 * optically centred under the marker rather than inside its font's full line
 * box.
 *
 * Keep it to a word or two — a step title is a signpost, not a sentence. Titles
 * wrap rather than truncate, because a clipped step title tells the user
 * nothing.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <StepperLabel>Billing address</StepperLabel>
 * ```
 */
export function StepperLabel({ className, ...props }: StepperLabelProps) {
  return <span className={cx(stepperLabel(), className)} {...props} />;
}

export type StepperDescriptionProps = ComponentPropsWithRef<"span">;

/**
 * Optional supporting copy under a step's title, rendering a `<span>`.
 *
 * Sits one type tier below {@link StepperLabel} at every size, because the label
 * face is condensed and a same-size description would out-measure it. This is
 * the first thing to drop as the container narrows.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <StepperDescription>Where should we send the receipt?</StepperDescription>
 * ```
 */
export function StepperDescription({
  className,
  ...props
}: StepperDescriptionProps) {
  return <span className={cx(stepperDescription(), className)} {...props} />;
}

export type StepperPanelProps = ComponentPropsWithRef<typeof Tabs.Content>;

/**
 * A step's body — a `Tabs.Content` rendering `<div role="tabpanel">`, linked to
 * the {@link StepperStep} of the same `value`.
 *
 * Stays mounted while inactive (the headless `hidden` attribute governs
 * visibility), so a half-filled form keeps its values as the user moves around
 * the rail. Pass `lazyMount` on {@link Stepper} to defer a panel's first render
 * until it is reached.
 *
 * The active panel fades up on arrival; the animation is disabled under
 * `prefers-reduced-motion: reduce`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <StepperPanel value="account">
 *   <Field label="Email">...</Field>
 * </StepperPanel>
 * ```
 */
export function StepperPanel({ className, ...props }: StepperPanelProps) {
  return <Tabs.Content className={cx(stepperPanel(), className)} {...props} />;
}
