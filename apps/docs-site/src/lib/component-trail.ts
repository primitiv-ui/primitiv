import type { ComponentDocs } from "./docs-data";
import { humanName } from "./human-name";

export type Crumb = { readonly name: string; readonly href: string };

/**
 * A component page's breadcrumb trail, root first, ending at the page itself.
 *
 * One list for two readers — the visible `Breadcrumb` in `ComponentPageHeader`
 * and the `BreadcrumbList` JSON-LD in the route file — because Google expects
 * the structured trail to match the one on the page.
 */
export const componentTrail = (docs: Pick<ComponentDocs, "id" | "displayName">): readonly Crumb[] => [
  { name: "Docs", href: "/" },
  { name: "Components", href: "/components/" },
  { name: humanName(docs.displayName), href: `/components/${docs.id}/` },
];
