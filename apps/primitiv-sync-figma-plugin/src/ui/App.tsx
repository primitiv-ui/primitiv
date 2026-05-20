import { useEffect, useState } from "react";

import type {
  CollectionSummary,
  SandboxMessage,
  UiMessage,
  VariableSummary,
} from "../shared/messages";
import { Button } from "@primitiv/react";
import { Close } from "@primitiv/icons";

type InspectResult = {
  collections: CollectionSummary[];
  variables: VariableSummary[];
};

function postToSandbox(message: UiMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

/**
 * Sync plugin UI root.
 *
 * Renders the name of the connected Figma page plus an "Inspect
 * variables" smoke command that dumps the local variable collections /
 * variables coming back from the sandbox. The real Export and Migrate
 * panels land in later cycles.
 */
export function App() {
  const [pageName, setPageName] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(
    null,
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = event.data?.pluginMessage as SandboxMessage | undefined;
      if (message?.type === "plugin-ready") {
        setPageName(message.pageName);
      } else if (message?.type === "inspect-variables-result") {
        setInspectResult({
          collections: message.collections,
          variables: message.variables,
        });
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
      <div className="app__actions">
        <Button
          type="button"
          onClick={() =>
            postToSandbox({ type: "inspect-variables-request" })
          }
        >
          Inspect variables
        </Button>
        <Button
          type="button"
          className="app__close"
          onClick={() => postToSandbox({ type: "close" })}
        >
          <Close size={16} />
          Close
        </Button>
      </div>
      {inspectResult !== null && (
        <pre className="app__dump">
          {JSON.stringify(inspectResult, null, 2)}
        </pre>
      )}
    </main>
  );
}
