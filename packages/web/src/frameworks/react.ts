/**
 * Opt-in React 19 JSX typings for the raw elements, for a React project that
 * uses `@primitiv-ui/web` directly rather than `@primitiv-ui/react`:
 *
 * ```tsx
 * import type {} from "@primitiv-ui/web/react";
 *
 * <primitiv-tabs value={value} onprimitiv-tabs-change={(e) => setValue(e.detail.value)}>
 * ```
 *
 * React 19 passes a custom element's `on…` prop to `addEventListener` with the
 * name exactly as written, so the change event's prop is
 * `onprimitiv-tabs-change` (RFC 0033 §5.6.3, D29). Most React projects want
 * `@primitiv-ui/react` instead, whose `onValueChange` / `onChange` are the
 * idiomatic names.
 *
 * npm-only, like `@primitiv-ui/web/tags`: it augments the `react` module,
 * which JSR does not allow a published module to do.
 */
import type { DetailedHTMLProps, HTMLAttributes } from "react";

import type {
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "../tabs/elements.ts";

/** React's own props for an element, plus `class`, which React 19 passes to custom elements. */
type ElementProps<E extends HTMLElement> = DetailedHTMLProps<HTMLAttributes<E>, E> & {
  class?: string;
};

/** The `primitiv-tabs-change` event: bubbles, cancelable, fired before the change applies. */
export type PrimitivTabsChangeEvent = CustomEvent<{ value: string; index: number }>;

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "primitiv-tabs": ElementProps<PrimitivTabsElement> & {
        value?: string;
        orientation?: "horizontal" | "vertical";
        "activation-mode"?: "automatic" | "manual";
        "onprimitiv-tabs-change"?: (event: PrimitivTabsChangeEvent) => void;
      };
      "primitiv-tabs-list": ElementProps<PrimitivTabsListElement> & {
        label?: string;
      };
      "primitiv-tabs-trigger": ElementProps<PrimitivTabsTriggerElement> & {
        value: string;
        disabled?: boolean;
      };
      "primitiv-tabs-content": ElementProps<PrimitivTabsContentElement> & {
        value: string;
        "onprimitiv-tabs-show"?: (event: CustomEvent) => void;
      };
    }
  }
}
