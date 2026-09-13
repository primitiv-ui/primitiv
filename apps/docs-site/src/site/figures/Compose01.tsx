"use client";

import { Arrow } from "./Arrow";

import "./figure-chrome.css";
import "./compose-figure.css";

/**
 * COMPOSE-01 — what `asChild` does to the DOM.
 *
 * Two snippets, each above the DOM it produces. **The comparison only works
 * because both halves are drawn the same way** — same code block, same arrow,
 * same box shape — so the only difference a reader sees is the one that matters:
 * two nested elements against one.
 *
 * Built against the frame `COMPOSE-01 — desktop`, which stays the design record
 * (plan §6.0.29).
 *
 * The invalid case carries the one warning colour in the whole figure set.
 * **A link inside a button is invalid HTML, not merely untidy**, so it is worth
 * a real feedback role rather than another muted note — but the panel itself
 * stays neutral, because the point is the nesting, not that the box is bad.
 *
 * The code is bare mono rather than a `CodeBlock`: inside a diagram it is a
 * specimen being pointed at, and the component's header, copy control and
 * syntax colouring would all compete with the arrow below it. The page's own
 * prose uses real `CodeBlock`s a few paragraphs away, which is the contrast
 * that keeps this reading as a diagram.
 */
const WITHOUT = `<Button>
  <Link href="/x">Go</Link>
</Button>`;

const WITH = `<Button asChild>
  <Link href="/x">Go</Link>
</Button>`;

export const Compose01 = () => (
  <figure className="docs-figure docs-compose">
    <div className="docs-compose__case">
      <p className="docs-figure__heading">without asChild</p>
      <pre className="docs-compose__code">{WITHOUT}</pre>
      <Arrow />
      <div className="docs-figure__panel docs-compose__dom">
        <p className="docs-compose__tag">&lt;button&gt;</p>
        <p className="docs-compose__tag docs-compose__tag--nested">&lt;a&gt;</p>
      </div>
      <p className="docs-figure__note docs-figure__note--warning">a link inside a button</p>
    </div>

    <div className="docs-compose__case">
      <p className="docs-figure__heading">with asChild</p>
      <pre className="docs-compose__code">{WITH}</pre>
      <Arrow />
      <div className="docs-figure__panel docs-compose__dom">
        <p className="docs-compose__tag">&lt;a&gt;</p>
      </div>
      <p className="docs-figure__mono">class=&quot;primitiv-button&quot;</p>
    </div>

    <figcaption className="docs-figure__caption docs-figure__caption--center">
      asChild merges them. It does not nest them.
    </figcaption>
  </figure>
);
