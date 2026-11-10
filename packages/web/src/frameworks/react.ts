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
  PrimitivAccordionContentElement,
  PrimitivAccordionElement,
  PrimitivAccordionItemElement,
  PrimitivAccordionTriggerElement,
  PrimitivAccordionTriggerIconElement,
} from "../accordion/elements.ts";
import type {
  PrimitivCollapsibleContentElement,
  PrimitivCollapsibleElement,
  PrimitivCollapsibleTriggerElement,
  PrimitivCollapsibleTriggerIconElement,
} from "../collapsible/elements.ts";
import type {
  PrimitivModalCloseElement,
  PrimitivModalContentElement,
  PrimitivModalDescriptionElement,
  PrimitivModalElement,
  PrimitivModalTitleElement,
  PrimitivModalTriggerElement,
} from "../modal/elements.ts";
import type {
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "../tabs/elements.ts";
import type {
  PrimitivAccordionChangeEvent,
  PrimitivCollapsibleChangeEvent,
  PrimitivModalChangeEvent,
  PrimitivTabsChangeEvent,
} from "./events.ts";

/** React's own props for an element, plus `class`, which React 19 passes to custom elements. */
type ElementProps<E extends HTMLElement> = DetailedHTMLProps<HTMLAttributes<E>, E> & {
  class?: string;
};

export type {
  PrimitivAccordionChangeEvent,
  PrimitivCollapsibleChangeEvent,
  PrimitivModalChangeEvent,
  PrimitivTabsChangeEvent,
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "primitiv-accordion": ElementProps<PrimitivAccordionElement> & {
        value?: string | readonly string[];
        multiple?: boolean;
        orientation?: "vertical" | "horizontal";
        "onprimitiv-accordion-change"?: (event: PrimitivAccordionChangeEvent) => void;
      };
      "primitiv-accordion-item": ElementProps<PrimitivAccordionItemElement> & {
        value: string;
      };
      "primitiv-accordion-trigger": ElementProps<PrimitivAccordionTriggerElement> & {
        disabled?: boolean;
      };
      "primitiv-accordion-content": ElementProps<PrimitivAccordionContentElement> & {
        "force-mount"?: boolean;
        "onprimitiv-accordion-show"?: (event: CustomEvent) => void;
      };
      "primitiv-accordion-trigger-icon": ElementProps<PrimitivAccordionTriggerIconElement>;
      "primitiv-collapsible": ElementProps<PrimitivCollapsibleElement> & {
        open?: boolean;
        disabled?: boolean;
        "onprimitiv-collapsible-change"?: (event: PrimitivCollapsibleChangeEvent) => void;
      };
      "primitiv-collapsible-trigger": ElementProps<PrimitivCollapsibleTriggerElement>;
      "primitiv-collapsible-content": ElementProps<PrimitivCollapsibleContentElement> & {
        "force-mount"?: boolean;
        "collapsed-height"?: string | number;
        "onprimitiv-collapsible-show"?: (event: CustomEvent) => void;
      };
      "primitiv-collapsible-trigger-icon": ElementProps<PrimitivCollapsibleTriggerIconElement>;
      "primitiv-modal": ElementProps<PrimitivModalElement> & {
        open?: boolean;
        "onprimitiv-modal-change"?: (event: PrimitivModalChangeEvent) => void;
      };
      "primitiv-modal-trigger": ElementProps<PrimitivModalTriggerElement>;
      "primitiv-modal-content": ElementProps<PrimitivModalContentElement>;
      "primitiv-modal-title": ElementProps<PrimitivModalTitleElement>;
      "primitiv-modal-description": ElementProps<PrimitivModalDescriptionElement>;
      "primitiv-modal-close": ElementProps<PrimitivModalCloseElement>;
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
