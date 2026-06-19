/*
 * DemoView — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/demo-view/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { DemoView as DemoViewPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { demoView, demoViewBar, demoViewItem } from "./demo-view.recipe";

/**
 * A demo composed view.
 *
 * @see https://example.test/demo-view
 */
export type DemoViewProps = ComponentPropsWithRef<typeof DemoViewPrimitive.Root> & {
  /**
   * Control size.
   * - `sm` — Small.
   * - `md` — Medium.
   * @default "md"
   * @see https://example.test/demo-view
   */
  size?: "sm" | "md";
};

export function DemoView({ size, className, ...props }: DemoViewProps) {
  return <DemoViewPrimitive.Root className={[demoView({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

export type DemoViewBarProps = ComponentPropsWithRef<typeof DemoViewPrimitive.Bar> & {
  /**
   * Alignment of the items.
   * - `start` — Start.
   * - `center` — Centre.
   * - `end` — End.
   * @default "start"
   * @see https://example.test/demo-view
   */
  align?: "start" | "center" | "end";
};

export function DemoViewBar({ align, className, ...props }: DemoViewBarProps) {
  return <DemoViewPrimitive.Bar className={[demoViewBar({ align }), className].filter(Boolean).join(" ")} {...props} />;
}

export type DemoViewItemProps = ComponentPropsWithRef<typeof DemoViewPrimitive.Item>;

export function DemoViewItem({ className, ...props }: DemoViewItemProps) {
  return <DemoViewPrimitive.Item className={[demoViewItem(), className].filter(Boolean).join(" ")} {...props} />;
}
