/*
 * Tooltip styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Popover (and unlike the generated registry components), Tooltip's wrapper
 * is hand-authored (tooltip.tsx) because Tooltip.Root / Trigger / Portal take no
 * className. This recipe maps the `tone` + `size` + `placement` variants to the
 * contract's modifier classes; the styling lives in the copied stylesheet (RFC
 * 0006 §6.1 / D53). The arrow is a real element (Tooltip.Arrow), styled via
 * `tooltipArrow`. Change registry/components/tooltip/contract.json + this file
 * together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const tooltip = cva("primitiv-tooltip", {
  variants: {
    tone: {
      default: "primitiv-tooltip--default",
      inverted: "primitiv-tooltip--inverted",
    },
    size: {
      sm: "primitiv-tooltip--sm",
      md: "primitiv-tooltip--md",
      lg: "primitiv-tooltip--lg",
      xl: "primitiv-tooltip--xl",
    },
    placement: {
      top: "primitiv-tooltip--top",
      "top-start": "primitiv-tooltip--top-start",
      "top-end": "primitiv-tooltip--top-end",
      right: "primitiv-tooltip--right",
      "right-start": "primitiv-tooltip--right-start",
      "right-end": "primitiv-tooltip--right-end",
      bottom: "primitiv-tooltip--bottom",
      "bottom-start": "primitiv-tooltip--bottom-start",
      "bottom-end": "primitiv-tooltip--bottom-end",
      left: "primitiv-tooltip--left",
      "left-start": "primitiv-tooltip--left-start",
      "left-end": "primitiv-tooltip--left-end",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "md",
    placement: "top",
  },
});

export type TooltipVariants = VariantProps<typeof tooltip>;

export const tooltipArrow = cva("primitiv-tooltip__arrow");

export type TooltipArrowVariants = VariantProps<typeof tooltipArrow>;
