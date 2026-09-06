/*
 * The live preview CODE-01 shows beside the editor, opened in VS Code's Simple
 * Browser so it sits inside the same frame as the code.
 *
 * The component is the real registry Button. The STYLESHEET is the one in the
 * recording workspace — the very file being edited on camera — linked rather
 * than imported, and re-linked whenever its bytes change. So beat 4's button
 * grows because the declaration changed, not because something was animated to
 * look as though it had. That is the entire argument of the beat, and it is why
 * this cannot be a mock-up that happens to move at the right moment.
 *
 * It polls rather than using HMR because the file does not exist when the
 * recording starts: `primitiv add button` creates it, on camera, and a missing
 * import would have failed the build long before that.
 */
import { useEffect, useState } from "react";
import { Button } from "@registry/button/button";

/** Where the workspace's copied stylesheet lives, served through vite's /@fs. */
const STYLESHEET = new URL(
  "../out/code-01-workspace/src/styles/primitiv/button/styles.css",
  import.meta.url,
).pathname;

const HREF = `/@fs${STYLESHEET}`;

export function CodePreview() {
  // `null` until the file exists — before `add` has run there is nothing to
  // link, and linking a 404 would log an error into the recording's console.
  const [stamp, setStamp] = useState<number | null>(null);

  useEffect(() => {
    let last = "";
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`${HREF}?probe=${Date.now()}`);
        if (res.ok) {
          const text = await res.text();
          if (text !== last) {
            last = text;
            setStamp(Date.now());
          }
        }
      } catch {
        /* not written yet */
      }
      window.setTimeout(poll, 200);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="preview-stage">
      {stamp !== null && <link rel="stylesheet" href={`${HREF}?v=${stamp}`} />}
      <Button variant="primary">Create account</Button>
    </div>
  );
}
