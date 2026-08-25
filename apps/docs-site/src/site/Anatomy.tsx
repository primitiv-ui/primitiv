"use client";

import { Stack } from "@/components/stack";

import { ModeCodeBlock } from "./ModeCodeBlock";
import type { Mode } from "./preferences";

/**
 * The "Anatomy" section's body — the part tree, one block per render path.
 *
 * **Every code block on a component page carries the Styled/Headless tabs**, and
 * this one is no exception: the tree is the place a reader looks up what to
 * type, so it is the last place that should show one mode's part names while
 * every snippet below shows the other's.
 *
 * That decides how a MULTI-PATH component is laid out. Select's anatomy has two
 * render paths (five of its nine parts render nothing under `native`), and one
 * `CodeBlock.Tabs` is a single Tabs.Root — one tablist, one value space — so it
 * cannot carry render path AND mode at once. Nesting is not available either:
 * `CodeBlock.Content` takes a `code` string, not children.
 *
 * So the paths STACK, each as its own labelled block with its own mode tabs,
 * rather than being tabbed against each other. The cost is real and worth
 * stating: an earlier version tabbed the paths precisely so the alternative
 * occupied the same space, which is the better way to read a comparison. Mode
 * won because it changes what the reader can actually import, whereas the path
 * is a choice they have already made by the time they are reading the tree.
 *
 * A single-path component (Tabs) gets one block and no path heading, since a
 * heading over the only tree names nothing.
 */
export const Anatomy = ({
  paths,
}: {
  paths: readonly {
    /** Render-path name, e.g. `"Rich"` — the heading above its block. */
    readonly label: string;
    readonly code: (mode: Mode) => string;
  }[];
}) => {
  /* `wrap={false}`: each line pairs a part with the DOM it emits in an aligned
     trailing `//` comment, so that column IS the content — wrapped, an annotation
     drops onto the next row and reads as belonging to the part below. The block
     scrolls inside its own box instead, the contract the props tables use. This
     was a `.docs-anatomy` override on the component's private `__pre` class until
     `code-block` grew the knob (registry-bugs §8). */
  if (paths.length === 1) return <ModeCodeBlock wrap={false} code={paths[0].code} />;

  return (
    <Stack gap="lg">
      {paths.map((p) => (
        <Stack key={p.label} gap="sm">
          {/* h3 to match the example titles: the section's own h2 is "Anatomy",
              and these sit one level under it. */}
          <h3 className="docs-example-title">{p.label}</h3>
          <ModeCodeBlock wrap={false} code={p.code} />
        </Stack>
      ))}
    </Stack>
  );
};
