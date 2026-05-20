import { useEffect, useState } from "react";

import type { SandboxMessage, UiMessage } from "../shared/messages";
import { Button } from "@primitiv/react";
import { Close } from "@primitiv/icons";

function postToSandbox(message: UiMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

/**
 * Sync plugin UI root.
 *
 * Renders the name of the connected Figma page, confirming the message
 * channel from the sandbox is live, plus a Close affordance. The real
 * feature panels (Export, Migrate) land in later cycles.
 */
export function App() {
  const [pageName, setPageName] = useState<string | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = event.data?.pluginMessage as SandboxMessage | undefined;
      if (message?.type === "plugin-ready") {
        setPageName(message.pageName);
      }
    }

    window.addEventListener("message", onMessage);
    postToSandbox({ type: "ui-ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <main className="app">
      <h1 className="app__title">Primitiv Sync</h1>
      {pageName !== null ? (
        <p className="app__page">Connected to: {pageName}</p>
      ) : (
        <p className="app__status">Waiting for Figma…</p>
      )}
      <Button
        type="button"
        className="app__close"
        onClick={() => postToSandbox({ type: "close" })}
      >
        <Close size={16} />
        Close
      </Button>
    </main>
  );
}
