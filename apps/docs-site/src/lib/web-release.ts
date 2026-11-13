import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * The `@primitiv-ui/web` release the docs pin every CDN script to: the
 * package's own version, read as the site builds. Never stored in the
 * generated docs-data, because a release bumps it after that data is
 * committed, and a stored copy is stale the moment it lands — the same version
 * `primitiv add` prints, since the CLI is versioned in lockstep.
 *
 * Server-only (it reads the file system): pass it into a client component.
 */
export const WEB_RELEASE: string = JSON.parse(
  readFileSync(join(process.cwd(), "../../packages/web/package.json"), "utf8"),
).version;
