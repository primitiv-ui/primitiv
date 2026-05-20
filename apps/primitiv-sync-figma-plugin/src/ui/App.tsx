import { useEffect, useMemo, useRef, useState } from "react";

import type {
  CollectionSummary,
  MigrationPlan,
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

const DTCG_FILE_NAMES = ["primitives", "semantic", "components"] as const;
const SYNC_URL = "http://localhost:4477/sync";

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
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(
    null,
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
      } else if (message?.type === "migrate-preview-result") {
        setMigrationPlan(message.plan);
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
          onClick={() => postToSandbox({ type: "migrate-preview-request" })}
        >
          Plan migration
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
      {migrationPlan !== null && (
        <section className="app__migrate">
          <h2 className="app__migrate-title">
            Typography → Semantic migration plan
          </h2>
          <p>
            {migrationPlan.semantic.needsCreate
              ? `Will create a Semantic collection with mode "${migrationPlan.semantic.modeName}".`
              : `Will reuse the existing Semantic collection.`}
          </p>
          <p>
            {migrationPlan.newVariables.length} new variables will be created
            under <code>typography/&lt;variant&gt;/</code>.
          </p>
          {migrationPlan.deletedCollectionIds.length > 0 && (
            <p>
              {migrationPlan.deletedCollectionIds.length} Typography
              collection
              {migrationPlan.deletedCollectionIds.length === 1 ? "" : "s"}{" "}
              will be deleted after references are rebound.
            </p>
          )}
          <details>
            <summary>
              Show all {migrationPlan.newVariables.length} new variables
            </summary>
            <ul className="app__migrate-list">
              {migrationPlan.newVariables.map((v) => (
                <li key={v.name}>
                  <code>{v.name}</code>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
      {inspectResult !== null && (
        <pre className="app__dump">
          {JSON.stringify(inspectResult, null, 2)}
        </pre>
      )}
    </main>
  );
}
