import { useEffect, useMemo, useRef, useState } from "react";

import type {
  BootstrapInteractionResult,
  BootstrapIntentLightResult,
  BootstrapResult,
  CollectionSummary,
  ContextName,
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

type SyncStatus =
  | { kind: "idle" }
  | { kind: "syncing" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type BootstrapStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; result: BootstrapResult }
  | { kind: "error"; message: string };

type InteractionStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; result: BootstrapInteractionResult }
  | { kind: "error"; message: string };

type IntentLightStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; result: BootstrapIntentLightResult }
  | { kind: "error"; message: string };

const DTCG_FILE_NAMES = ["primitives", "semantic", "components"] as const;
const SYNC_URL = "http://localhost:4477/sync";
const CONTEXT_OPTIONS: { value: ContextName; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
  { value: "spacious", label: "Spacious" },
  { value: "dense", label: "Dense" },
];

function postToSandbox(message: UiMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function toDataUri(group: DtcgGroup): string {
  const json = JSON.stringify(group, null, 2);
  return `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
}

async function syncToServer(files: DtcgFiles): Promise<void> {
  const response = await fetch(SYNC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(files),
  });
  if (!response.ok) {
    throw new Error(`Sync server responded ${response.status}`);
  }
}

/**
 * Sync plugin UI root.
 *
 * Owns the connection banner, an Inspect Variables dev affordance that
 * dumps the raw Figma payload as JSON, and an Export Tokens action.
 * Export can either write straight into `packages/tokens/src/*.json`
 * via the local sync server (Live sync toggle) or surface the three
 * DTCG files as direct downloads when no server is running.
 */
export function App() {
  const [pageName, setPageName] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(
    null,
  );
  const [dtcgFiles, setDtcgFiles] = useState<DtcgFiles | null>(null);
  const [liveSync, setLiveSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: "idle" });
  const [selectedContext, setSelectedContext] =
    useState<ContextName>("comfortable");
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({
    kind: "idle",
  });
  const [interactionStatus, setInteractionStatus] = useState<InteractionStatus>(
    { kind: "idle" },
  );
  const [intentLightStatus, setIntentLightStatus] = useState<IntentLightStatus>(
    { kind: "idle" },
  );
  const liveSyncRef = useRef(false);

  useEffect(() => {
    liveSyncRef.current = liveSync;
  }, [liveSync]);

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
        const files = figmaVarsToDtcg(message.collections, message.variables);
        setDtcgFiles(files);
        if (liveSyncRef.current) {
          setSyncStatus({ kind: "syncing" });
          syncToServer(files)
            .then(() => setSyncStatus({ kind: "success" }))
            .catch((error: unknown) =>
              setSyncStatus({ kind: "error", message: String(error) }),
            );
        }
      } else if (message?.type === "bootstrap-context-result") {
        setBootstrapStatus({ kind: "success", result: message.result });
      } else if (message?.type === "bootstrap-context-error") {
        setBootstrapStatus({ kind: "error", message: message.message });
      } else if (message?.type === "bootstrap-interaction-result") {
        setInteractionStatus({ kind: "success", result: message.result });
      } else if (message?.type === "bootstrap-interaction-error") {
        setInteractionStatus({ kind: "error", message: message.message });
      } else if (message?.type === "bootstrap-intent-light-result") {
        setIntentLightStatus({ kind: "success", result: message.result });
      } else if (message?.type === "bootstrap-intent-light-error") {
        setIntentLightStatus({ kind: "error", message: message.message });
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
      <label className="app__toggle">
        <input
          type="checkbox"
          checked={liveSync}
          onChange={(e) => setLiveSync(e.target.checked)}
        />
        Live sync (localhost:4477)
      </label>
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
      {liveSync ? (
        syncStatus.kind === "syncing" ? (
          <p className="app__sync-status">Syncing to localhost:4477…</p>
        ) : syncStatus.kind === "success" ? (
          <p className="app__sync-status app__sync-status--ok">
            Synced to localhost:4477
          </p>
        ) : syncStatus.kind === "error" ? (
          <p className="app__sync-status app__sync-status--err">
            Sync failed: {syncStatus.message}
          </p>
        ) : null
      ) : downloadHrefs !== null ? (
        <ul className="app__downloads">
          {DTCG_FILE_NAMES.map((name) => (
            <li key={name}>
              <a href={downloadHrefs[name]} download={`${name}.json`}>
                {name}.json
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <section className="app__bootstrap">
        <h2 className="app__bootstrap-title">Bootstrap context</h2>
        <label className="app__bootstrap-row">
          Context:
          <select
            value={selectedContext}
            onChange={(e) =>
              setSelectedContext(e.target.value as ContextName)
            }
          >
            {CONTEXT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          onClick={() => {
            setBootstrapStatus({ kind: "running" });
            postToSandbox({
              type: "bootstrap-context-request",
              context: selectedContext,
            });
          }}
        >
          Bootstrap context
        </Button>
        {bootstrapStatus.kind === "running" && (
          <p className="app__sync-status">Bootstrapping…</p>
        )}
        {bootstrapStatus.kind === "success" && (
          <BootstrapSummary result={bootstrapStatus.result} />
        )}
        {bootstrapStatus.kind === "error" && (
          <p className="app__sync-status app__sync-status--err">
            Bootstrap failed: {bootstrapStatus.message}
          </p>
        )}
      </section>
      <section className="app__bootstrap">
        <h2 className="app__bootstrap-title">Bootstrap interaction</h2>
        <Button
          type="button"
          onClick={() => {
            setInteractionStatus({ kind: "running" });
            postToSandbox({ type: "bootstrap-interaction-request" });
          }}
        >
          Bootstrap interaction
        </Button>
        {interactionStatus.kind === "running" && (
          <p className="app__sync-status">Bootstrapping…</p>
        )}
        {interactionStatus.kind === "success" && (
          <InteractionSummary result={interactionStatus.result} />
        )}
        {interactionStatus.kind === "error" && (
          <p className="app__sync-status app__sync-status--err">
            Bootstrap failed: {interactionStatus.message}
          </p>
        )}
      </section>
      <section className="app__bootstrap">
        <h2 className="app__bootstrap-title">Bootstrap Intent / Light</h2>
        <Button
          type="button"
          onClick={() => {
            setIntentLightStatus({ kind: "running" });
            postToSandbox({ type: "bootstrap-intent-light-request" });
          }}
        >
          Bootstrap Intent / Light
        </Button>
        {intentLightStatus.kind === "running" && (
          <p className="app__sync-status">Bootstrapping…</p>
        )}
        {intentLightStatus.kind === "success" && (
          <IntentLightSummary result={intentLightStatus.result} />
        )}
        {intentLightStatus.kind === "error" && (
          <p className="app__sync-status app__sync-status--err">
            Bootstrap failed: {intentLightStatus.message}
          </p>
        )}
      </section>
      {inspectResult !== null && (
        <pre className="app__dump">
          {JSON.stringify(inspectResult, null, 2)}
        </pre>
      )}
    </main>
  );
}

function InteractionSummary({
  result,
}: {
  result: BootstrapInteractionResult;
}) {
  return (
    <div className="app__bootstrap-summary">
      <p className="app__sync-status app__sync-status--ok">
        Bootstrapped Interaction — collection {result.collection}
      </p>
      <ul>
        <li>
          Variables: {result.variablesCreated} created,{" "}
          {result.variablesUpdated} updated
        </li>
      </ul>
      {result.warnings.length > 0 && (
        <div className="app__bootstrap-warnings">
          <p>{result.warnings.length} warning(s):</p>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IntentLightSummary({
  result,
}: {
  result: BootstrapIntentLightResult;
}) {
  return (
    <div className="app__bootstrap-summary">
      <p className="app__sync-status app__sync-status--ok">
        Bootstrapped Intent / Light — collection {result.collection}
      </p>
      <ul>
        <li>
          Variables: {result.variablesCreated} created,{" "}
          {result.variablesUpdated} updated
        </li>
      </ul>
      {result.warnings.length > 0 && (
        <div className="app__bootstrap-warnings">
          <p>{result.warnings.length} warning(s):</p>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BootstrapSummary({ result }: { result: BootstrapResult }) {
  return (
    <div className="app__bootstrap-summary">
      <p className="app__sync-status app__sync-status--ok">
        Bootstrapped {result.context} — collection {result.collection}
      </p>
      <ul>
        <li>
          Variables: {result.variablesCreated} created,{" "}
          {result.variablesUpdated} updated
        </li>
        <li>
          Text styles: {result.textStylesCreated} created,{" "}
          {result.textStylesUpdated} updated
        </li>
      </ul>
      {result.warnings.length > 0 && (
        <div className="app__bootstrap-warnings">
          <p>{result.warnings.length} warning(s):</p>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
