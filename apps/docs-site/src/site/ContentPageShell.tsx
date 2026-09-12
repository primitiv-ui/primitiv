"use client";

import { type ContentPage as Page, tocFor } from "@/lib/content-pages";

import { ContentPage } from "./ContentPage";
import { Shell } from "./Shell";

/**
 * One prose page inside the docs shell.
 *
 * The client half of all eight content routes: a route file stays a server
 * component so it can export `metadata` and `generateStaticParams`, and
 * everything that touches a registry component (the whole of `ContentPage`, and
 * the shell's own nav) lives here. The TOC is derived from the page's own
 * sections rather than passed in, so a route cannot hand the rail a list that
 * disagrees with the headings below it.
 */
export const ContentPageShell = ({ page }: { page: Page }) => (
  <Shell toc={tocFor(page)}>
    <ContentPage page={page} />
  </Shell>
);
