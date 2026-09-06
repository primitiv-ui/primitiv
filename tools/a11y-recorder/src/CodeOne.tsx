/*
 * CODE-01 — "the code lands in your repository", shown rather than claimed.
 *
 * Everything on screen is real and none of it is transcribed: the command, the
 * CLI output and the stylesheet excerpt all come from
 * `src/generated/code-01.json`, which `scripts/capture-code-01.mjs` writes by
 * running the actual `primitiv add button`. Re-run that script and this scene
 * updates; there is deliberately no second copy to drift.
 *
 * The corner preview is a real registry Button, and beat 4 drives it through the
 * SAME value the code shows — `--primitiv-button-padding-inline` — so the button
 * grows because the declaration changed, not because something was animated to
 * look as though it had. That is the whole argument of the beat.
 *
 * The scene owns its timeline (see BEATS) rather than being stepped from
 * outside: the brief specifies it as a beat table with millisecond boundaries,
 * so it belongs next to what it animates.
 */
import { useEffect, useState } from "react";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import { Button } from "@registry/button/button";
import capture from "./generated/code-01.json";

/**
 * The beat boundaries, from the brief. `typeUntil` is when the command has
 * finished typing; the rest are the moments a pane or a cursor appears.
 */
const BEATS = {
  typeFrom: 200,
  typeUntil: 1600,
  outputFrom: 1600,
  outputStep: 120,
  editorFrom: 2600,
  editorSlide: 400,
  caretFrom: 4200,
  selectAt: 4600,
  retypeFrom: 5000,
  retypeStep: 55,
} as const;

/*
 * Prism's inline theme is switched OFF, exactly as the registry `code-block`
 * does it, so the `.token.*` classes take their colour from that component's
 * own stylesheet and the `--primitiv-code-syntax-*` roles. Restating the theme
 * as an object here would be a second copy of the palette, free to drift from
 * the one the site ships — and the panes carry `.primitiv-code-block` for the
 * same reason: those rules are scoped to it.
 */
const NO_INLINE_THEME: PrismTheme = { plain: {}, styles: [] };

/** Milliseconds since mount, on rAF — the clock every beat reads. */
function useElapsed() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let raf = 0;
    const started = performance.now();
    const tick = () => {
      setElapsed(performance.now() - started);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return elapsed;
}

/** How much of `text` has been typed by `elapsed`, over the window `from`→`to`. */
function typed(text: string, elapsed: number, from: number, to: number) {
  if (elapsed <= from) return "";
  const progress = Math.min((elapsed - from) / (to - from), 1);
  return text.slice(0, Math.round(progress * text.length));
}

export function CodeOne() {
  const elapsed = useElapsed();

  const command = typed(capture.command, elapsed, BEATS.typeFrom, BEATS.typeUntil);
  const commandDone = elapsed >= BEATS.typeUntil;
  const outputLines = Math.max(
    0,
    Math.floor((elapsed - BEATS.outputFrom) / BEATS.outputStep),
  );

  const editorProgress = Math.min(
    Math.max((elapsed - BEATS.editorFrom) / BEATS.editorSlide, 0),
    1,
  );

  // Beat 4. The declaration's value is selected, then replaced a character at a
  // time; `value` is what the file says at this instant, and the preview reads
  // the same string.
  const selected = elapsed >= BEATS.selectAt && elapsed < BEATS.retypeFrom;
  const replacement = typed(
    capture.editTo,
    elapsed,
    BEATS.retypeFrom,
    BEATS.retypeFrom + capture.editTo.length * BEATS.retypeStep,
  );
  const editing = elapsed >= BEATS.retypeFrom;
  const value = editing ? replacement : capture.editFrom;
  const caretVisible = elapsed >= BEATS.caretFrom;

  const excerpt = capture.excerpt
    .map((line, i) =>
      i === capture.editLine
        ? line.replace(capture.editFrom, editing ? replacement : capture.editFrom)
        : line,
    )
    .join("\n");

  return (
    <div className="stage code-stage">
      <div className="code-panes">
        <section className="code-pane code-pane--terminal primitiv-code-block">
          <header className="code-pane__header">
            <span className="code-pane__name">Terminal</span>
          </header>
          <pre className="code-pane__body">
            <code>
              <span className="code-prompt">$ </span>
              {command}
              {!commandDone && <span className="code-caret code-caret--block" />}
              {outputLines > 0 && (
                <>
                  {"\n"}
                  {capture.output.slice(0, outputLines).join("\n")}
                </>
              )}
            </code>
          </pre>
        </section>

        <section
          className="code-pane code-pane--editor primitiv-code-block"
          style={{
            // Slides in from the right, then holds. Opacity rides along so the
            // pane does not appear as a hard edge crossing the terminal.
            transform: `translateX(${(1 - editorProgress) * 100}%)`,
            opacity: editorProgress,
          }}
        >
          <header className="code-pane__header">
            <span className="code-pane__name">{capture.file}</span>
          </header>
          <div className="code-pane__body code-pane__body--file">
            <Highlight theme={NO_INLINE_THEME} code={excerpt} language="css">
              {({ tokens, getLineProps, getTokenProps }) => (
                <pre>
                  {tokens.map((line, i) => (
                    <div
                      key={i}
                      {...getLineProps({ line })}
                      className={
                        i === capture.editLine && caretVisible
                          ? "code-line code-line--active"
                          : "code-line"
                      }
                    >
                      <span className="code-gutter">{i + 1}</span>
                      <span className={selected && i === capture.editLine ? "code-selection" : undefined}>
                        {line.map((token, k) => (
                          <span key={k} {...getTokenProps({ token })} />
                        ))}
                      </span>
                      {caretVisible && i === capture.editLine && !selected && (
                        <span className="code-caret" />
                      )}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>

          <div className="code-preview">
            <Button
              variant="primary"
              style={{ ["--primitiv-button-padding-inline" as string]: value }}
            >
              Create account
            </Button>
          </div>
        </section>
      </div>

      <p className="code-caption">It is a file. Change it.</p>
    </div>
  );
}
