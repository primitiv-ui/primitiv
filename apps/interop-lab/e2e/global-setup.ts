import { execFileSync } from "node:child_process";

// The styled page needs the CLI's install on disk before any test loads it.
export default function globalSetup() {
  execFileSync("node", ["scripts/install-elements-site.mjs"], { stdio: "inherit" });
}
