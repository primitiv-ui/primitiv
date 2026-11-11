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
  PrimitivContextMenuChangeEvent,
  PrimitivContextMenuCheckedChangeEvent,
  PrimitivContextMenuSelectEvent,
  PrimitivContextMenuSubChangeEvent,
  PrimitivContextMenuValueChangeEvent,
  PrimitivDropdownChangeEvent,
  PrimitivDropdownCheckedChangeEvent,
  PrimitivDropdownSelectEvent,
  PrimitivDropdownSubChangeEvent,
  PrimitivDropdownValueChangeEvent,
  PrimitivCollapsibleChangeEvent,
  PrimitivModalChangeEvent,
  PrimitivPopoverChangeEvent,
  PrimitivTabsChangeEvent,
  PrimitivTooltipChangeEvent,
  PrimitivToggleGroupChangeEvent,
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
    "primitiv-context-menu": Tag<{ open?: boolean | "" }, { "primitiv-context-menu-change": (event: PrimitivContextMenuChangeEvent) => void }>;
    "primitiv-context-menu-trigger": Tag<{ disabled?: boolean | "" }>;
    "primitiv-context-menu-content": Tag<{ popover?: "auto" | "manual" | "" }>;
    "primitiv-context-menu-item": Tag<{ disabled?: boolean | "" }, { "primitiv-context-menu-select": (event: PrimitivContextMenuSelectEvent) => void }>;
    "primitiv-context-menu-checkbox-item": Tag<{ checked?: boolean | "indeterminate"; disabled?: boolean | "" }, { "primitiv-context-menu-checked-change": (event: PrimitivContextMenuCheckedChangeEvent) => void; "primitiv-context-menu-select": (event: PrimitivContextMenuSelectEvent) => void }>;
    "primitiv-context-menu-radio-group": Tag<{ value?: string }, { "primitiv-context-menu-value-change": (event: PrimitivContextMenuValueChangeEvent) => void }>;
    "primitiv-context-menu-radio-item": Tag<{ value: string; disabled?: boolean | "" }, { "primitiv-context-menu-select": (event: PrimitivContextMenuSelectEvent) => void }>;
    "primitiv-context-menu-item-indicator": Tag<{ forceMount?: boolean | "" }>;
    "primitiv-context-menu-group": Tag<Record<never, never>>;
    "primitiv-context-menu-label": Tag<Record<never, never>>;
    "primitiv-context-menu-separator": Tag<Record<never, never>>;
    "primitiv-context-menu-sub": Tag<{ open?: boolean | "" }, { "primitiv-context-menu-sub-change": (event: PrimitivContextMenuSubChangeEvent) => void }>;
    "primitiv-context-menu-sub-trigger": Tag<{ disabled?: boolean | "" }>;
    "primitiv-context-menu-sub-content": Tag<{ popover?: "auto" | "manual" | "" }>;
    "primitiv-dropdown": Tag<{ open?: boolean | "" }, { "primitiv-dropdown-change": (event: PrimitivDropdownChangeEvent) => void }>;
    "primitiv-dropdown-trigger": Tag<Record<never, never>>;
    "primitiv-dropdown-content": Tag<{ popover?: "auto" | "manual" | "" }>;
    "primitiv-dropdown-item": Tag<{ disabled?: boolean | "" }, { "primitiv-dropdown-select": (event: PrimitivDropdownSelectEvent) => void }>;
    "primitiv-dropdown-checkbox-item": Tag<{ checked?: boolean | "indeterminate"; disabled?: boolean | "" }, { "primitiv-dropdown-checked-change": (event: PrimitivDropdownCheckedChangeEvent) => void; "primitiv-dropdown-select": (event: PrimitivDropdownSelectEvent) => void }>;
    "primitiv-dropdown-radio-group": Tag<{ value?: string }, { "primitiv-dropdown-value-change": (event: PrimitivDropdownValueChangeEvent) => void }>;
    "primitiv-dropdown-radio-item": Tag<{ value: string; disabled?: boolean | "" }, { "primitiv-dropdown-select": (event: PrimitivDropdownSelectEvent) => void }>;
    "primitiv-dropdown-item-indicator": Tag<{ forceMount?: boolean | "" }>;
    "primitiv-dropdown-group": Tag<Record<never, never>>;
    "primitiv-dropdown-label": Tag<Record<never, never>>;
    "primitiv-dropdown-separator": Tag<Record<never, never>>;
    "primitiv-dropdown-sub": Tag<{ open?: boolean | "" }, { "primitiv-dropdown-sub-change": (event: PrimitivDropdownSubChangeEvent) => void }>;
    "primitiv-dropdown-sub-trigger": Tag<{ disabled?: boolean | "" }>;
    "primitiv-dropdown-sub-content": Tag<{ popover?: "auto" | "manual" | "" }>;
    "primitiv-modal": Tag<
      { open?: boolean | "" },
      { "primitiv-modal-change": (event: PrimitivModalChangeEvent) => void }
    >;
    "primitiv-modal-trigger": Tag<Record<never, never>>;
    "primitiv-modal-content": Tag<Record<never, never>>;
    "primitiv-modal-title": Tag<Record<never, never>>;
    "primitiv-modal-description": Tag<Record<never, never>>;
    "primitiv-modal-close": Tag<Record<never, never>>;
    "primitiv-popover": Tag<
      { open?: boolean | "" },
      { "primitiv-popover-change": (event: PrimitivPopoverChangeEvent) => void }
    >;
    "primitiv-popover-trigger": Tag<Record<never, never>>;
    "primitiv-popover-anchor": Tag<Record<never, never>>;
    "primitiv-popover-content": Tag<Record<never, never>>;
    "primitiv-popover-title": Tag<Record<never, never>>;
    "primitiv-popover-description": Tag<Record<never, never>>;
    "primitiv-popover-close": Tag<Record<never, never>>;
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
    "primitiv-tooltip": Tag<
      { open?: boolean | ""; delayDuration?: number | string; disableHoverableContent?: boolean | "" },
      { "primitiv-tooltip-change": (event: PrimitivTooltipChangeEvent) => void }
    >;
    "primitiv-tooltip-provider": Tag<{ delayDuration?: number | string; skipDelayDuration?: number | string }>;
    "primitiv-tooltip-trigger": Tag<Record<never, never>>;
    "primitiv-tooltip-content": Tag<Record<never, never>>;
    "primitiv-tooltip-arrow": Tag<Record<never, never>>;
    "primitiv-toggle-group": Tag<
      { value?: string; type?: "single" | "multiple"; orientation?: "horizontal" | "vertical" },
      { "primitiv-toggle-group-change": (event: PrimitivToggleGroupChangeEvent) => void }
    >;
    "primitiv-toggle-group-item": Tag<{ value: string; disabled?: boolean | "" }>;
  }
}
