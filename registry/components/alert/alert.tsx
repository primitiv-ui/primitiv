/*
 * Alert — styled wrapper, HAND-AUTHORED (composes the headless Alert
 * primitive plus the registry Button for the dismiss affordance).
 *
 * Not generated: the icon + optional title + description + optional dismiss
 * anatomy has no generator-emitted shape (unlike a single-primitive
 * wrapper), so — like `chip`/`code-block` — this file carries no
 * drift-guard test. Keep contract.json + the stylesheet + this file in
 * sync by hand.
 *
 * The dismiss button composes the registry `Button` (a sibling copied
 * component, hence the `button` dependency — see `code-block`'s Copy
 * control for the same pattern) rather than a bespoke `<button>`, so it
 * inherits Button's geometry, focus ring, and transitions verbatim; only
 * its colour custom properties are re-pointed per Tone (styles.css). The
 * four tone glyphs (Info/Success/Warning/Error) and the dismiss button's
 * Close glyph are inlined from @primitiv-ui/icons, like `chip`'s
 * CloseGlyph and `code-block`'s Copy/Check glyphs, so this component
 * installs no extra package.
 */
import { Alert as AlertPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ReactNode } from "react";
import { Button } from "./button";
import { alert, type AlertVariants } from "./alert.recipe";

function InfoGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75" />
      <path d="M11.25 10.25h1.5v7.5h-1.5zm0-4h1.5v2.5h-1.5z" />
    </svg>
  );
}

function SuccessGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75" />
      <path d="m18.058 8.919-7.016 8.183L5.939 12 7 10.94l3.957 3.957 5.962-6.955z" />
    </svg>
  );
}

function WarningGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.311 20.75H.688L12 1.52zm-20-1.5H20.69L12 4.479z" />
      <path d="M11.25 8.25h1.5v6.5h-1.5zm0 7.5h1.5v2.5h-1.5z" />
    </svg>
  );
}

function DangerGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75" />
      <path d="M17.06 16 16 17.06 6.94 8 8 6.94z" />
      <path d="M17.06 8 8 17.06 6.94 16 16 6.94z" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.06 19 19 20.06 3.94 5 5 3.94z" />
      <path d="M20.06 5 5 20.06 3.94 19 19 3.94z" />
    </svg>
  );
}

/**
 * Explicit literal unions (not derived from `AlertVariants`, which
 * `class-variance-authority`'s inference can widen to a bare `string`
 * depending on how the recipe was declared) — `Tone` is needed so
 * `TONE_GLYPHS` below can be indexed exhaustively, and `Size` so it can be
 * forwarded to `Button`'s own precisely-typed `size` prop.
 */
type Tone = "info" | "success" | "warning" | "danger";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const TONE_GLYPHS = {
  info: InfoGlyph,
  success: SuccessGlyph,
  warning: WarningGlyph,
  danger: DangerGlyph,
} as const satisfies Record<Tone, () => ReactNode>;

export type AlertProps = Omit<ComponentPropsWithRef<typeof AlertPrimitive>, "asChild" | "children"> &
  Omit<AlertVariants, "tone" | "size"> & {
    /**
     * Semantic colour; also selects the default leading icon.
     * @default "info"
     */
    tone?: Tone;
    /**
     * Alert size; `data-density` scales each size further.
     * @default "md"
     */
    size?: Size;
    /**
     * The alert's heading, shown above the description. Omit for a
     * single-message alert — the headless Alert's own simplest usage
     * (`<Alert>{error}</Alert>`).
     */
    title?: ReactNode;
    /**
     * Overrides the tone's default leading icon (info circle / success
     * check / warning triangle / danger x-circle).
     */
    icon?: ReactNode;
    /** The alert's message. Always present — the required content. */
    children: ReactNode;
    /**
     * Called when the dismiss button is activated. The dismiss button only
     * renders when this is provided; omit it for a non-dismissible alert.
     */
    onDismiss?: () => void;
    /**
     * `aria-label` for the dismiss button.
     * @default "Dismiss"
     */
    dismissLabel?: string;
  };

/**
 * An assertive banner for high-priority, time-sensitive messages — a
 * tone-matched icon, an optional title, a description, and an optional
 * dismiss button. Composes the headless `Alert` primitive (`role="alert"`,
 * implicit `aria-live="assertive"`+`aria-atomic="true"`) for the message and
 * the registry `Button` (`ghost` variant) for the dismiss affordance.
 *
 * @example
 * ```tsx
 * <Alert tone="danger" title="Payment failed">
 *   Your card was declined. Try a different payment method.
 * </Alert>
 * <Alert onDismiss={() => setVisible(false)}>Changes saved.</Alert>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/alert
 */
export function Alert({
  tone,
  size,
  title,
  icon,
  children,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  ...props
}: AlertProps) {
  const Glyph = TONE_GLYPHS[tone ?? "info"];
  return (
    <AlertPrimitive className={[alert({ tone, size }), className].filter(Boolean).join(" ")} {...props}>
      <span className="primitiv-alert__icon-wrapper">{icon ?? <Glyph />}</span>
      <div className="primitiv-alert__content">
        {title != null && <div className="primitiv-alert__title">{title}</div>}
        <div className="primitiv-alert__description">{children}</div>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size={size ?? "md"}
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="primitiv-alert__dismiss"
        >
          <CloseGlyph />
        </Button>
      )}
    </AlertPrimitive>
  );
}
