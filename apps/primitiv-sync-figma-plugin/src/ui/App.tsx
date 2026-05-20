import { useEffect, useMemo, useState } from "react";

import type {
  CollectionSummary,
  SandboxMessage,
  UiMessage,
  VariableSummary,
} from "../shared/messages";
import { Button } from "@primitiv/react";
import { Close } from "@primitiv/icons";
import { figmaVarsToDtcg } from "@primitiv/tokens";
import type { DtcgFiles, DtcgGroup } from "@primitiv/tokens";

type InspectResult = {
  collections: CollectionSummary[];
  variables: VariableSummary[];
};

const DTCG_FILE_NAMES = ["primitives", "semantic", "components"] as const;

function postToSandbox(message: UiMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function toDataUri(group: DtcgGroup): string {
  const json = JSON.stringify(group, null, 2);
  return `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
}

/**
 * Sync plugin UI root.
 *
 * Owns the connection banner, an Inspect Variables dev affordance that
 * dumps the raw Figma payload as JSON, and an Export Tokens action that
 * runs the @primitiv/tokens DTCG transform against a fresh sandbox read
 * and surfaces the three DTCG files as direct downloads.
 */
export function App() {
  const [pageName, setPageName] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(
    null,
  );
  const [dtcgFiles, setDtcgFiles] = useState<DtcgFiles | null>(null);

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
      } else if (message?.type === "export-tokens-result") {
        setDtcgFiles(figmaVarsToDtcg(message.collections, message.variables));
      }
    }

    window.addEventListener("message", onMessage);
    postToSandbox({ type: "ui-ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const downloadHrefs = useMemo(
    () =>
      dtcgFiles === null
        ? null
        : {
            primitives: toDataUri(dtcgFiles.primitives),
            semantic: toDataUri(dtcgFiles.semantic),
            components: toDataUri(dtcgFiles.components),
          },
    [dtcgFiles],
  );

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
          onClick={() => postToSandbox({ type: "export-tokens-request" })}
        >
          Export tokens
        </Button>
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
      {downloadHrefs !== null && (
        <ul className="app__downloads">
          {DTCG_FILE_NAMES.map((name) => (
            <li key={name}>
              <a href={downloadHrefs[name]} download={`${name}.json`}>
                {name}.json
              </a>
            </li>
          ))}
        </ul>
      )}
      {inspectResult !== null && (
        <pre className="app__dump">
          {JSON.stringify(inspectResult, null, 2)}
        </pre>
      )}
    </main>
  );
}
