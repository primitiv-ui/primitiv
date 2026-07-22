// Print surviving / no-coverage mutants from a Stryker JSON report, grouped by
// file. Run after `mutate:component <Name>` to see exactly what to kill.
// Usage (from repo root): node scripts/mutation-survivors.mjs <Component>
import { readFileSync } from "node:fs";

const component = process.argv[2];
const report = JSON.parse(
  readFileSync(`packages/react/reports/mutation/${component}.json`, "utf8"),
);

let total = 0;
for (const [file, data] of Object.entries(report.files)) {
  const bad = data.mutants.filter(
    (m) => m.status === "Survived" || m.status === "NoCoverage",
  );
  if (bad.length === 0) continue;
  console.log(`\n${file}`);
  for (const m of bad.sort(
    (a, b) => a.location.start.line - b.location.start.line,
  )) {
    console.log(
      `  L${m.location.start.line}\t${m.status}\t${m.mutatorName}\t-> ${JSON.stringify(m.replacement)}`,
    );
    total++;
  }
}
if (total === 0) console.log(`${component}: no survivors`);
