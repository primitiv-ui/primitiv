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
import { prose, type ProseVariants } from "./prose.recipe";

export type ProseProps = ComponentPropsWithRef<"div"> &
  ProseVariants & {
    /**
     * Render the single child element instead of a wrapping <div>, merging the
     * flow class onto it — e.g. `<Prose asChild><article>...</article></Prose>`.
     */
    asChild?: boolean;
  };

/**
 * A flow-rhythm container. Applies `.primitiv-flow` so its **direct** children
 * get density-scoped vertical spacing (large air above headings, tight space
 * below them, even paragraph rhythm between blocks). Nested regions opt in with
 * their own `<Prose>` — rhythm never leaks across a container boundary (RFC 0016).
 *
 * `measure` (default `false`) caps the column at a comfortable reading line
 * length — roughly 68 characters, via `--primitiv-prose-measure`. It is opt-in
 * because a flow context is just as often a whole page region containing grids
 * and media, which a reading-width cap would break; reach for it on running
 * text. Retune or disable it per subtree with the custom property.
 *
 * @example
 * ```tsx
 * <Prose asChild>
 *   <article>
 *     <h1>Title</h1>
 *     <p>Body...</p>
 *   </article>
 * </Prose>
 *
 * // Long-form reading column, capped at the measure
 * <Prose measure asChild>
 *   <article>...</article>
 * </Prose>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/prose
 */
export function Prose({ measure, asChild = false, className, ...props }: ProseProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return (
    <Comp className={[prose({ measure }), className].filter(Boolean).join(" ")} {...props} />
  );
}
