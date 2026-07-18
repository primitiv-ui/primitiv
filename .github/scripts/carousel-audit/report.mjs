// Renders the audit results into a single, self-contained HTML report —
// screenshots referenced as relative files (in ./screenshots/) alongside it.
// No build step, no external assets: safe to drop straight into a GitHub
// Pages deploy and open on a phone.

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function deltaChips(delta) {
  const keys = Object.keys(delta);
  if (keys.length === 0) return `<span class="chip chip-muted">defaults only</span>`;
  return keys
    .map((k) => `<span class="chip">${escapeHtml(k)}=${escapeHtml(delta[k])}</span>`)
    .join(" ");
}

function caseCard(record) {
  const statusClass = record.pass ? "pass" : "fail";
  const statusLabel = record.pass ? "PASS" : "FAIL";
  const issues = [];
  if (!record.appliedOk) issues.push(`Could not apply config: ${escapeHtml(record.applyError)}`);
  if (record.appliedOk && record.slideCount === 0) issues.push("No slide elements found");
  if (record.appliedOk && record.slideCount > 0 && !record.anySlideVisible)
    issues.push("No slide is visible (all hidden/zero-size)");
  for (const e of record.pageErrors) issues.push(`Page error: ${escapeHtml(e)}`);
  for (const e of record.consoleErrors) issues.push(`Console error: ${escapeHtml(e)}`);

  const shot = record.screenshot
    ? `<a href="screenshots/${record.screenshot}" target="_blank" rel="noopener">
         <img class="thumb" src="screenshots/${record.screenshot}" alt="Case ${record.index} screenshot" loading="lazy" />
       </a>`
    : `<div class="thumb thumb-missing">no screenshot</div>`;

  return `
  <article class="case ${statusClass}" data-status="${statusClass}">
    <div class="case-media">${shot}</div>
    <div class="case-body">
      <div class="case-head">
        <span class="badge ${statusClass}">${statusLabel}</span>
        <span class="case-index">#${record.index}</span>
      </div>
      <div class="chips">${deltaChips(record.delta)}</div>
      ${issues.length ? `<ul class="issues">${issues.map((i) => `<li>${i}</li>`).join("")}</ul>` : ""}
      <details>
        <summary>Full config</summary>
        <pre>${escapeHtml(JSON.stringify(record.fullCase, null, 1))}</pre>
      </details>
    </div>
  </article>`;
}

export function renderReport(results) {
  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;
  const generatedAt = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Carousel builder audit</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff;
    --fg: #16181d;
    --muted: #6b7280;
    --card-bg: #f7f7f8;
    --border: #e2e2e6;
    --pass: #16a34a;
    --pass-bg: #dcfce7;
    --fail: #dc2626;
    --fail-bg: #fee2e2;
    --chip-bg: #eef0f3;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1115;
      --fg: #e6e8eb;
      --muted: #9aa1ab;
      --card-bg: #181b21;
      --border: #2a2e37;
      --pass: #4ade80;
      --pass-bg: #113321;
      --fail: #f87171;
      --fail-bg: #3b1414;
      --chip-bg: #23262e;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 16px;
    max-width: 720px;
    margin-inline: auto;
  }
  h1 { font-size: 1.3rem; margin: 0 0 4px; }
  .meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 16px; }
  .summary {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .summary-stat {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    background: var(--card-bg);
  }
  .summary-stat b { display: block; font-size: 1.4rem; }
  .filters { display: flex; gap: 8px; margin-bottom: 16px; }
  .filters button {
    border: 1px solid var(--border);
    background: var(--card-bg);
    color: var(--fg);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .filters button.active { border-color: var(--fg); font-weight: 600; }
  .cases { display: flex; flex-direction: column; gap: 12px; }
  .case {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--card-bg);
  }
  .case.fail { border-color: var(--fail); }
  .case-media { background: repeating-conic-gradient(#0000 0 25%, #0001 0 50%) 0 0/16px 16px; }
  .thumb { display: block; width: 100%; height: auto; max-height: 200px; object-fit: contain; }
  .thumb-missing {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .case-body { padding: 10px 12px 12px; }
  .case-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 999px;
  }
  .badge.pass { color: var(--pass); background: var(--pass-bg); }
  .badge.fail { color: var(--fail); background: var(--fail-bg); }
  .case-index { color: var(--muted); font-size: 0.8rem; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
  .chip {
    font-size: 0.72rem;
    background: var(--chip-bg);
    border-radius: 6px;
    padding: 2px 6px;
    font-family: ui-monospace, monospace;
  }
  .chip-muted { color: var(--muted); }
  .issues {
    margin: 6px 0 0;
    padding-left: 18px;
    color: var(--fail);
    font-size: 0.82rem;
  }
  details { margin-top: 6px; }
  summary { cursor: pointer; font-size: 0.8rem; color: var(--muted); }
  pre {
    font-size: 0.72rem;
    overflow-x: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px;
    margin: 6px 0 0;
  }
</style>
</head>
<body>
  <h1>Carousel builder audit</h1>
  <div class="meta">
    Generated ${escapeHtml(generatedAt)} · Chromium-only structural smoke test
    (thrown errors, hidden/collapsed slides) — pairwise-combinatorial coverage
    of the builder's variant axes. Does <strong>not</strong> catch iOS-Safari-only
    rendering bugs; a real-device pass is still the final word.
  </div>
  <div class="summary">
    <div class="summary-stat"><b>${results.length}</b>cases</div>
    <div class="summary-stat"><b style="color:var(--pass)">${passCount}</b>passed</div>
    <div class="summary-stat"><b style="color:var(--fail)">${failCount}</b>failed</div>
  </div>
  <div class="filters">
    <button data-filter="all" class="active">All</button>
    <button data-filter="fail">Failures only</button>
    <button data-filter="pass">Passes only</button>
  </div>
  <div class="cases" id="cases">
    ${results.map(caseCard).join("\n")}
  </div>
  <script>
    const buttons = document.querySelectorAll('.filters button');
    const cases = document.querySelectorAll('.case');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        cases.forEach((c) => {
          c.style.display = filter === 'all' || c.dataset.status === filter ? '' : 'none';
        });
      });
    });
  </script>
</body>
</html>`;
}
