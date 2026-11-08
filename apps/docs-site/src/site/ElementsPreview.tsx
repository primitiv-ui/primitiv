"use client";

import { useEffect, useRef } from "react";

import "./elements-preview.css";

/**
 * A live preview in Elements mode: the exact markup the Elements code tab
 * shows, put into the page as HTML, with the real custom elements defined.
 *
 * The point is the DOM. A developer inspecting the preview should find the
 * `<primitiv-tabs>` tree and the attributes the element writes, not the React
 * component the other modes render, so the preview is built from the same
 * string as the code block beside it and cannot show anything else.
 *
 * The element module is imported on the client only, the first time a preview
 * holds a `primitiv-` tag; elements already in the page upgrade when it lands,
 * as on any site that loads the module after its markup. `wire` attaches
 * anything an example needs beyond the markup (an event listener) and returns
 * its cleanup. A new `html` string replaces the subtree, so the elements
 * reconnect exactly as they would after an htmx swap.
 *
 * The wrapper is `display: contents`, so the markup lays out in the example's
 * own row or stack as the React preview's children did.
 */
export const ElementsPreview = ({
  html,
  wire,
}: {
  html: string;
  wire?: (root: HTMLElement) => (() => void) | void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (html.includes("<primitiv-")) void import("@primitiv-ui/web/define");
  }, [html]);

  useEffect(() => {
    if (!ref.current || !wire) return;
    return wire(ref.current) ?? undefined;
  }, [html, wire]);

  return (
    <div
      ref={ref}
      className="docs-elements-preview"
      /* Our own spec strings, never user input. */
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
