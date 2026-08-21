"use client";

import { useEffect, useState } from "react";

import { List } from "@/components/list";

import "./page-toc.css";

export type TocEntry = {
  readonly id: string;
  readonly title: string;
  readonly children?: readonly TocEntry[];
};

const flatten = (entries: readonly TocEntry[]): string[] =>
  entries.flatMap((e) => [e.id, ...flatten(e.children ?? [])]);

/**
 * Tracks which section is currently in view.
 *
 * One IntersectionObserver over every heading, rather than a scroll listener:
 * the browser does the hit-testing off the main thread and there is no
 * throttling to tune. The topmost intersecting heading wins, so scrolling up
 * highlights the section being entered rather than the one being left.
 */
const useActiveHeading = (ids: readonly string[]): string | null => {
  const [active, setActive] = useState<string | null>(null);
  // Effects compare deps by identity, and `ids` is a fresh array every render —
  // joining to a string keeps the observer from being torn down and rebuilt on
  // every single render.
  const key = ids.join("|");

  useEffect(() => {
    const idList = key ? key.split("|") : [];
    const nodes = idList
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Keep the last match when nothing is intersecting, so the marker never
        // blanks out mid-scroll between two widely spaced headings.
        const first = idList.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      // Bias the viewport upward so a heading counts as current once it reaches
      // the top third, not when it first peeks in at the bottom.
      { rootMargin: "0px 0px -66% 0px", threshold: 0 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [key]);

  return active;
};

/*
 * Built on the registry `List`, like the documentation map and footer.
 *
 * `type="ordered"` because a table of contents IS ordered — the entries follow
 * document order, and announcing "1 of 6" is useful. `marker={false}` hides the
 * numerals while keeping it an `<ol>`, so the ordering survives in the a11y tree
 * even though it is not drawn.
 *
 * `indent={false}` on the outer list only: the rail is drawn on its
 * inline-start edge, so any padding there would push the rows off it. The nested
 * list keeps the default indent, re-pointed to the design's 20px.
 */
const TocLinks = ({
  entries,
  active,
  nested = false,
}: {
  entries: readonly TocEntry[];
  active: string | null;
  nested?: boolean;
}) => (
  <List
    type="ordered"
    marker={false}
    indent={!nested ? false : undefined}
    size="sm"
    className={nested ? "docs-toc-nested" : "docs-toc-list"}
  >
    {entries.map((entry) => (
      <List.Item key={entry.id}>
        <a
          className="docs-toc-link"
          href={`#${entry.id}`}
          /*
           * "location" rather than "page": this points at a section of the
           * current document, not a different page. It is what conveys the rail
           * marker non-visually — without it the active state is decoration.
           */
          aria-current={active === entry.id ? "location" : undefined}
        >
          {entry.title}
        </a>
        {entry.children && entry.children.length > 0 && (
          <TocLinks entries={entry.children} active={active} nested />
        )}
      </List.Item>
    ))}
  </List>
);

export const PageToc = ({ entries }: { entries: readonly TocEntry[] }) => {
  const active = useActiveHeading(flatten(entries));

  if (entries.length === 0) return null;

  return (
    <nav className="docs-toc-root" aria-labelledby="docs-toc-heading">
      <h2 className="docs-toc-heading" id="docs-toc-heading">
        On this page
      </h2>
      <TocLinks entries={entries} active={active} />
    </nav>
  );
};
