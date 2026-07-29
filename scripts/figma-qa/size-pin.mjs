// Size-pin check.
//
// The failure signature behind three separate bugs this session: a component sets
// its type on the root and lets a part inherit, but `primitiv.reset` styles that
// part's bare element DIRECTLY — and a declaration on the element beats an
// inherited one whatever the layer. The part is then pinned to the reset's value
// and stops responding to the `size` modifier entirely.
//
// So: render each component at xs/md/xl and assert every text part's font-size
// and line-height actually MOVE. Anything pinned is the bug.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const root = process.env.REPO;
const SIZES = ["xs", "sm", "md", "lg", "xl"];

// component -> markup template, {SZ} substituted. Only components with a size axis.
const SPECIMENS = {
  blockquote: `<blockquote class="primitiv-blockquote primitiv-blockquote--default primitiv-blockquote--{SZ}">
    <p class="primitiv-blockquote__quote">Quote</p><cite class="primitiv-blockquote__citation">Cite</cite></blockquote>`,
  "description-list": `<dl class="primitiv-description-list primitiv-description-list--stacked primitiv-description-list--{SZ}">
    <dt class="primitiv-description-list__term">Term</dt><dd class="primitiv-description-list__details">Detail</dd></dl>`,
  list: `<ul class="primitiv-list primitiv-list--unordered primitiv-list--indent primitiv-list--{SZ}">
    <li class="primitiv-list__item">Item</li></ul>`,
  figure: `<figure class="primitiv-figure primitiv-figure--below primitiv-figure--{SZ}">
    <div class="primitiv-figure__media"></div>
    <figcaption class="primitiv-figure__caption primitiv-figure__caption--start">Caption</figcaption></figure>`,
  "pull-quote": `<blockquote class="primitiv-pull-quote primitiv-pull-quote--{SZ}">
    <p class="primitiv-pull-quote__text">Quote</p></blockquote>`,
  kbd: `<kbd class="primitiv-kbd primitiv-kbd--{SZ}">K</kbd>`,
  "inline-code": `<code class="primitiv-inline-code primitiv-inline-code--{SZ}">code</code>`,
  table: `<table class="primitiv-table primitiv-table--{SZ}"><caption class="primitiv-table__caption">Caption</caption>
    <thead><tr class="primitiv-table__row"><th class="primitiv-table__header-cell">Head</th></tr></thead>
    <tbody><tr class="primitiv-table__row"><td class="primitiv-table__cell">Cell</td></tr></tbody></table>`,
  breadcrumb: `<nav class="primitiv-breadcrumb primitiv-breadcrumb--{SZ}"><ol class="primitiv-breadcrumb__list">
    <li class="primitiv-breadcrumb__item"><a class="primitiv-breadcrumb__link" href="#">Link</a>
    <span class="primitiv-breadcrumb__separator">/</span></li></ol></nav>`,
  field: `<div class="primitiv-field primitiv-field--{SZ}"><label class="primitiv-field__label">Label</label>
    <p class="primitiv-field__description">Desc</p><p class="primitiv-field__error">Err</p></div>`,
  prose: `<div class="primitiv-prose primitiv-prose--{SZ}"><p>Body</p><h2>Head</h2><li>Item</li></div>`,
};

const tokens = readFileSync(`${root}/apps/kitchen-sink/src/styles/primitiv/tokens.css`, "utf8");
const base = readFileSync(`${root}/apps/kitchen-sink/src/styles/primitiv/primitiv-base.css`, "utf8");
const sheets = Object.keys(SPECIMENS)
  .map((n) => `${root}/registry/components/${n}/styles.css`)
  .filter((p) => existsSync(p))
  .map((p) => readFileSync(p, "utf8"));

const bodies = [];
for (const [name, tpl] of Object.entries(SPECIMENS))
  for (const sz of SIZES)
    bodies.push(`<div class="spec" data-comp="${name}" data-size="${sz}">${tpl.replaceAll("{SZ}", sz)}</div>`);

const script = `
window.__probe = () => {
  const rows = {};
  for (const spec of document.querySelectorAll(".spec")) {
    const comp = spec.dataset.comp, size = spec.dataset.size;
    for (const el of spec.querySelectorAll("*")) {
      if (!el.textContent.trim()) continue;             // only text-bearing parts
      if (el.children.length) continue;                 // leaf text nodes only
      const c = getComputedStyle(el);
      const cls = (el.className || "").toString().split(" ").find((x) => x.includes("__"))
        || el.tagName.toLowerCase();
      const k = comp + "|" + cls;
      (rows[k] ||= { comp, part: cls, tag: el.tagName.toLowerCase(), fs: {}, lh: {} });
      rows[k].fs[size] = c.fontSize;
      rows[k].lh[size] = c.lineHeight;
    }
  }
  return rows;
};
`;

writeFileSync(process.env.SP + "/size-pin.html", `<!doctype html><html><head><meta charset="utf-8">
<style>${tokens}</style><style>${base}</style>
${sheets.map((s) => `<style>${s}</style>`).join("\n")}
<style>body{margin:0;width:900px}</style></head><body data-density="comfortable">
${bodies.join("\n")}
<script>${script}<\/script></body></html>`);
console.log("harness:", Object.keys(SPECIMENS).length, "components ×", SIZES.length, "sizes");
