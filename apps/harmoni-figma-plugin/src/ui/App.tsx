import { useEffect, useState } from "react";

import type { SandboxMessage, UiMessage } from "../shared/messages";
import { initEngine } from "./engine";

function postToSandbox(message: UiMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

/**
 * Plugin UI root.
 *
 * It exists to prove the plumbing end to end: the greeting confirms the
 * harmoni-wasm engine instantiated inside Figma's iframe, the page name
 * confirms messages flow from the sandbox, and Close confirms they flow
 * back. No palette feature is wired up yet.
 */
export function App() {
  const [engineReady, setEngineReady] = useState(false);
  const [pageName, setPageName] = useState<string | null>(null);

  useEffect(() => {
    initEngine().then(() => setEngineReady(true));
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = event.data?.pluginMessage as SandboxMessage | undefined;
      if (message?.type === "plugin-ready") {
        setPageName(message.pageName);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <main className="app">
      <h1 className="app__title">Harmoni</h1>
      <p className="app__status">
        {engineReady
          ? "Hello from Harmoni Wasm! Body base"
          : "Starting the Harmoni engine…"}
      </p>
      {pageName !== null && (
        <p className="app__page">Connected to: {pageName}</p>
      )}
      <button
        type="button"
        className="app__close"
        onClick={() => postToSandbox({ type: "close" })}
      >
        Close
      </button>
    </main>
  );
}
