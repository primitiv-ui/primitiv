/*
 * Description List — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add description-list`. Renders
 * a <dl> compound (RFC 0012 D10). Like <Prose>, it carries zero behaviour —
 * it only adds classes — so, unlike the generated wrappers, it composes no
 * headless primitive. Hand-written, so it has no drift-guard test.
 *
 * Compound subcomponents: `DescriptionList.Term` renders the <dt>,
 * `DescriptionList.Details` renders the <dd> — mirroring the dot-property
 * pattern already used by the registry's other hand-authored compounds (e.g.
 * `CodeBlock.Header`). `layout` (`"stacked"` default | `"inline"`) matches
 * Figma's `Layout` variant axis — both arrange the same flat dt/dd
 * composition, so no DOM change is needed between them.
 */
import { type ComponentPropsWithRef } from "react";
import { descriptionList, type DescriptionListVariants } from "./description-list.recipe";

export type DescriptionListProps = ComponentPropsWithRef<"dl"> & DescriptionListVariants;

/**
 * A `<dl>` compound. Compose one `DescriptionList.Term` + one
 * `DescriptionList.Details` per pair; `size` (`xs`–`xl`, default `md`)
 * scales both, `layout` (`"stacked"` default | `"inline"`) picks dt-above-dd
 * or dt-beside-dd. The term is fixed SemiBold across every size and density
 * (RFC 0012 D10) — only its family/size/line-height scale with `size`.
 *
 * @example
 * ```tsx
 * <DescriptionList layout="inline">
 *   <DescriptionList.Term>Version</DescriptionList.Term>
 *   <DescriptionList.Details>0.1.0</DescriptionList.Details>
 * </DescriptionList>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/description-list
 */
export function DescriptionList({ size, layout, className, ...props }: DescriptionListProps) {
  return (
    <dl className={[descriptionList({ size, layout }), className].filter(Boolean).join(" ")} {...props} />
  );
}

export type DescriptionListTermProps = ComponentPropsWithRef<"dt">;

function DescriptionListTerm({ className, ...props }: DescriptionListTermProps) {
  return <dt className={["primitiv-description-list__term", className].filter(Boolean).join(" ")} {...props} />;
}

export type DescriptionListDetailsProps = ComponentPropsWithRef<"dd">;

function DescriptionListDetails({ className, ...props }: DescriptionListDetailsProps) {
  return <dd className={["primitiv-description-list__details", className].filter(Boolean).join(" ")} {...props} />;
}

DescriptionList.Term = DescriptionListTerm;
DescriptionList.Details = DescriptionListDetails;
