/*
 * Tabs — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/tabs/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import {
  Tabs as TabsPrimitive,
  type TabsRootProps as TabsPrimitiveProps,
  type TabsListProps as TabsListPrimitiveProps,
  type TabsTriggerProps as TabsTriggerPrimitiveProps,
  type TabsContentProps as TabsContentPrimitiveProps,
} from "@primitiv-ui/react";
import { tabs, tabsList, tabsTrigger, tabsContent } from "./tabs.recipe";

/**
 * An accessible tabbed interface — a tablist of triggers that switch between panels (WAI-ARIA Tabs pattern).
 *
 * @see https://primitiv-ui.dev/docs/components/tabs
 */
export interface TabsProps extends TabsPrimitiveProps {
  /**
   * Control size for the whole widget; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/tabs
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function Tabs({ size, className, ...props }: TabsProps) {
  return <TabsPrimitive.Root className={[tabs({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

export interface TabsListProps extends TabsListPrimitiveProps {
  /**
   * Alignment of the triggers along the tablist. Direction-aware — `start`/`end` follow the reading direction, flipping under RTL via the inherited `DirectionProvider`.
   * - `start` — Triggers grouped at the start edge (the default).
   * - `center` — Triggers centred along the tablist.
   * - `end` — Triggers grouped at the end edge.
   * @default "start"
   * @see https://primitiv-ui.dev/docs/components/tabs
   */
  justify?: "start" | "center" | "end";
}

export function TabsList({ justify, className, ...props }: TabsListProps) {
  return <TabsPrimitive.List className={[tabsList({ justify }), className].filter(Boolean).join(" ")} {...props} />;
}

export type TabsTriggerProps = TabsTriggerPrimitiveProps;

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return <TabsPrimitive.Trigger className={[tabsTrigger(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TabsContentProps = TabsContentPrimitiveProps;

export function TabsContent({ className, ...props }: TabsContentProps) {
  return <TabsPrimitive.Content className={[tabsContent(), className].filter(Boolean).join(" ")} {...props} />;
}
