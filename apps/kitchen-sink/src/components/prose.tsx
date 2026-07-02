import "../styles/primitiv/prose/styles.css";
/*
 * Prose — styled flow-rhythm wrapper.
 *
 * Copied into the consumer repo by `primitiv add prose`. Applies the
 * `.primitiv-flow` context so every direct child gets density-scoped vertical
 * rhythm (RFC 0016). Zero behaviour — it only adds a class — so, unlike the
 * other registry wrappers, it composes no headless primitive: it renders a
 * <div>, or the consumer's own semantic element via `asChild` (Slot).
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { prose } from "./prose.recipe";

export type ProseProps = ComponentPropsWithRef<"div"> & {
  /**
   * Render the single child element instead of a wrapping <div>, merging the
   * flow class onto it — e.g. `<Prose asChild><article>…</article></Prose>`.
   */
  asChild?: boolean;
};

/**
 * A flow-rhythm container. Applies `.primitiv-flow` so its **direct** children
 * get density-scoped vertical spacing (large air above headings, tight space
 * below them, even paragraph rhythm between blocks). Nested regions opt in with
 * their own `<Prose>` — rhythm never leaks across a container boundary (RFC 0016).
 *
 * @example
 * ```tsx
 * <Prose asChild>
 *   <article>
 *     <h1>Title</h1>
 *     <p>Body…</p>
 *   </article>
 * </Prose>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/prose
 */
export function Prose({ asChild = false, className, ...props }: ProseProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return <Comp className={[prose(), className].filter(Boolean).join(" ")} {...props} />;
}
