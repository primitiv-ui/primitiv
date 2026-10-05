// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Portal } from "../Portal";

describe("Portal SSR", () => {
  it("should render nothing on the server, where there is no document to portal into", () => {
    // A force-mounted overlay (Modal.Portal / Drawer.Portal with `forceMount`)
    // renders its Portal while closed, so a server render reaches it too.
    expect(typeof document).toBe("undefined");

    const markup = renderToStaticMarkup(
      <div>
        <Portal>
          <p>Portal content</p>
        </Portal>
      </div>,
    );

    expect(markup).toBe("<div></div>");
  });
});
