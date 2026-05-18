import { useState } from "react";

import { Portal } from "@primitiv/react";

import "./PortalExample.scss";

export function PortalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="portal-example">
      <h2 className="portal-example__title">Portal</h2>

      <section className="portal-example__section">
        <h3 className="portal-example__section-title">
          Escaping a clipped parent
        </h3>
        <p className="portal-example__description">
          The bordered box below sets <code>overflow: hidden</code>. The
          portalled panel escapes it and mounts at the end of{" "}
          <code>document.body</code>, so it stays fully visible.
        </p>
        <button
          className="portal-example__button"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Unmount portal" : "Mount portal"}
        </button>

        <div className="portal-example__clip">
          Clipped parent — anything painted beyond this border is cut off.
          {open && (
            <Portal>
              <div className="portal-example__panel" role="status">
                Rendered into document.body — not inside the clipped box.
              </div>
            </Portal>
          )}
        </div>
      </section>
    </div>
  );
}
