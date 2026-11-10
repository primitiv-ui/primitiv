/**
 * Opt-in Vue 3 template typings for the elements. With this in scope, `vue-tsc`
 * checks each tag's attributes and its events:
 *
 * ```vue
 * <script setup lang="ts">
 * import type {} from "@primitiv-ui/web/vue";
 * </script>
 * <template>
 *   <primitiv-tabs :value="value" @primitiv-tabs-change="onChange">…</primitiv-tabs>
 * </template>
 * ```
 *
 * The compiler must also be told the tags are custom elements, so Vue does not
 * try to resolve them as components at runtime:
 * `compilerOptions.isCustomElement: (tag) => tag.startsWith("primitiv-")`.
 *
 * npm-only, like `@primitiv-ui/web/tags`: it augments the `vue` module, which
 * JSR does not allow a published module to do.
 */
import type { DefineComponent, EmitsOptions } from "vue";

import type {
  PrimitivAccordionChangeEvent,
  PrimitivCollapsibleChangeEvent,
  PrimitivModalChangeEvent,
  PrimitivTabsChangeEvent,
} from "./events.ts";

/** A tag as Vue's template checker sees it: its props, and the events it emits. */
type Tag<Props, Events extends EmitsOptions = Record<never, never>> = DefineComponent<
  Props,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>,
  Events
>;

declare module "vue" {
  interface GlobalComponents {
    "primitiv-accordion": Tag<
      {
        value?: string | readonly string[];
        multiple?: boolean | "";
        orientation?: "vertical" | "horizontal";
      },
      { "primitiv-accordion-change": (event: PrimitivAccordionChangeEvent) => void }
    >;
    "primitiv-accordion-item": Tag<{ value: string }>;
    "primitiv-accordion-trigger": Tag<{ disabled?: boolean | "" }>;
    "primitiv-accordion-content": Tag<
      { forceMount?: boolean | "" },
      { "primitiv-accordion-show": (event: CustomEvent) => void }
    >;
    "primitiv-accordion-trigger-icon": Tag<Record<never, never>>;
    "primitiv-collapsible": Tag<
      { open?: boolean | ""; disabled?: boolean | "" },
      { "primitiv-collapsible-change": (event: PrimitivCollapsibleChangeEvent) => void }
    >;
    "primitiv-collapsible-trigger": Tag<Record<never, never>>;
    "primitiv-collapsible-content": Tag<
      { forceMount?: boolean | ""; collapsedHeight?: string | number },
      { "primitiv-collapsible-show": (event: CustomEvent) => void }
    >;
    "primitiv-collapsible-trigger-icon": Tag<Record<never, never>>;
    "primitiv-modal": Tag<
      { open?: boolean | "" },
      { "primitiv-modal-change": (event: PrimitivModalChangeEvent) => void }
    >;
    "primitiv-modal-trigger": Tag<Record<never, never>>;
    "primitiv-modal-content": Tag<Record<never, never>>;
    "primitiv-modal-title": Tag<Record<never, never>>;
    "primitiv-modal-description": Tag<Record<never, never>>;
    "primitiv-modal-close": Tag<Record<never, never>>;
    "primitiv-tabs": Tag<
      {
        value?: string;
        orientation?: "horizontal" | "vertical";
        activationMode?: "automatic" | "manual";
      },
      { "primitiv-tabs-change": (event: PrimitivTabsChangeEvent) => void }
    >;
    "primitiv-tabs-list": Tag<{ label?: string }>;
    "primitiv-tabs-trigger": Tag<{ value: string; disabled?: boolean | "" }>;
    "primitiv-tabs-content": Tag<{ value: string }, { "primitiv-tabs-show": (event: CustomEvent) => void }>;
  }
}
