/**
 * Opt-in Svelte 5 template typings for the elements. With this in scope,
 * `svelte-check` checks each tag's attributes and its events:
 *
 * ```svelte
 * <script lang="ts">
 *   import type {} from "@primitiv-ui/web/svelte";
 * </script>
 * <primitiv-tabs {value} onprimitiv-tabs-change={(e) => (value = e.detail.value)}>…</primitiv-tabs>
 * ```
 *
 * Svelte 5 treats an `on…` attribute as a listener for the event named by the
 * rest of it, so the change event's attribute is `onprimitiv-tabs-change`, the
 * same as React 19's (RFC 0033 §5.6.3).
 *
 * npm-only, like `@primitiv-ui/web/tags`: it augments `svelte/elements`, which
 * JSR does not allow a published module to do.
 */
import type { HTMLAttributes } from "svelte/elements";

import type {
  PrimitivAccordionContentElement,
  PrimitivAccordionElement,
  PrimitivAccordionItemElement,
  PrimitivAccordionTriggerElement,
  PrimitivAccordionTriggerIconElement,
} from "../accordion/elements.ts";
import type {
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "../tabs/elements.ts";
import type { PrimitivAccordionChangeEvent, PrimitivTabsChangeEvent } from "./events.ts";

/** Svelte's own attributes and events for an element. */
type Attributes<E extends HTMLElement> = HTMLAttributes<E>;

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "primitiv-accordion": Attributes<PrimitivAccordionElement> & {
      value?: string | readonly string[];
      multiple?: boolean;
      orientation?: "vertical" | "horizontal";
      "onprimitiv-accordion-change"?: (event: PrimitivAccordionChangeEvent) => void;
    };
    "primitiv-accordion-item": Attributes<PrimitivAccordionItemElement> & {
      value: string;
    };
    "primitiv-accordion-trigger": Attributes<PrimitivAccordionTriggerElement> & {
      disabled?: boolean;
    };
    "primitiv-accordion-content": Attributes<PrimitivAccordionContentElement> & {
      "force-mount"?: boolean;
      "onprimitiv-accordion-show"?: (event: CustomEvent) => void;
    };
    "primitiv-accordion-trigger-icon": Attributes<PrimitivAccordionTriggerIconElement>;
    "primitiv-tabs": Attributes<PrimitivTabsElement> & {
      value?: string;
      orientation?: "horizontal" | "vertical";
      "activation-mode"?: "automatic" | "manual";
      "onprimitiv-tabs-change"?: (event: PrimitivTabsChangeEvent) => void;
    };
    "primitiv-tabs-list": Attributes<PrimitivTabsListElement> & {
      label?: string;
    };
    "primitiv-tabs-trigger": Attributes<PrimitivTabsTriggerElement> & {
      value: string;
      disabled?: boolean;
    };
    "primitiv-tabs-content": Attributes<PrimitivTabsContentElement> & {
      value: string;
      "onprimitiv-tabs-show"?: (event: CustomEvent) => void;
    };
  }
}
