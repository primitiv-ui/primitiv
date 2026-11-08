"use client";

// `code-block` styles its tabs with the TABS component's classes, and used to
// leave loading that sheet to its importers — so this file (and `InstallTabs`)
// each carried a `tabs/styles.css` import. `code-block.tsx` now declares the
// dependency itself (`import "./tabs"`), so both workarounds are gone.
import { CodeBlock } from "@/components/code-block";
import { mergeImports, withoutClasses } from "@/lib/playground";
import { type Mode, label, useView } from "@/site/preferences";

/**
 * A code block showing a component both ways, headless and styled, in the
 * framework the page is read in, with its tablist TWO-WAY bound to the header's
 * Headless/Styled switch.
 *
 * Every code block on a component page uses this, so the page has one rule
 * rather than a mixture: the playground snippet, and each example's snippet.
 *
 * Why show both rather than follow the switch: a component page is where the
 * difference is legible at a glance, the same component with the styling
 * arriving or leaving. A block that only follows the switch hides exactly that.
 *
 * The binding is two-way because a local tab that only READ the switch could
 * be left saying Headless while Installation above it says `primitiv add`. The
 * style is a shared `useLocalStorage` store, so a tab click IS the switch.
 *
 * Under Elements the markup is plain HTML, and its headless form is derived
 * from the styled one by removing the classes (`withoutClasses`), as the CLI
 * derives it, so a spec writes its Elements markup once.
 *
 * `code` is called once per tab, not once per render, so a caller must not
 * assume it is only asked for the active mode.
 *
 * `wrap` is forwarded for the one caller that needs it: the anatomy tree, whose
 * aligned trailing `//` annotations ARE its content.
 */
export const ModeCodeBlock = ({
  code,
  wrap,
}: {
  code: (mode: Mode) => string;
  wrap?: boolean;
}) => {
  const { styles, style, setStyle, modeFor } = useView();
  const snippet = (s: (typeof styles)[number]) => {
    const mode = modeFor(s);
    const text = mergeImports(code(mode));
    return mode === "elements" && s === "headless" ? withoutClasses(text) : text;
  };
  /* Markup, not TSX, under Elements: plain HTML that pastes into any template
     language (RFC 0033 §8.1). */
  const language = modeFor("styled") === "elements" ? "html" : "tsx";

  return (
    <CodeBlock.Tabs
      size="sm"
      wrap={wrap}
      value={style}
      onValueChange={(next) => setStyle(next as typeof style)}
    >
      <CodeBlock.Header>
        {/* `label`, not `ariaLabelledBy`: the nearest heading names the section
            (an example title, or "Playground"), not what these tabs switch. */}
        <CodeBlock.List label="Styling">
          {styles.map((s) => (
            <CodeBlock.Trigger key={s} value={s}>
              {label(s)}
            </CodeBlock.Trigger>
          ))}
        </CodeBlock.List>
        <CodeBlock.Copy />
      </CodeBlock.Header>

      {styles.map((s) => (
        <CodeBlock.Content
          key={s}
          value={s}
          language={language}
          code={snippet(s)}
        />
      ))}
    </CodeBlock.Tabs>
  );
};
