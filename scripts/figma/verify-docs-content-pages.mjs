#!/usr/bin/env node
/*
 * Prove that `docs-content-pages.js`'s PAGES data still describes what the
 * Figma frames actually carry.
 *
 * The two sides cannot be diffed directly: a paragraph with inline code is one
 * string in the spec and a run of per-word text nodes on the canvas, because a
 * Figma text node cannot contain a component. So both sides are reduced to a
 * whitespace-stripped concatenation per page and fingerprinted — which makes
 * word-splitting invisible while any real difference in wording, ordering or
 * punctuation still shows up.
 *
 * Usage:
 *   1. In figma_execute, paste docs-content-pages.js and `return await fingerprint();`
 *   2. Save that JSON somewhere, then:
 *        node scripts/figma/verify-docs-content-pages.mjs figma-fingerprint.json
 *
 * Exits non-zero on any divergence. A same-length, different-hash page is a
 * character-level edit (a capital, a curly quote); a different length is
 * missing or extra content.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const builder = path.join(here, 'docs-content-pages.js');

const src = fs.readFileSync(builder, 'utf8');
const start = src.indexOf('const PAGES = {');
const end = src.indexOf('\nconst ALL =');
if (start === -1 || end === -1) throw new Error('could not find the PAGES literal in ' + builder);
const PAGES = eval('(' + src.slice(start + 'const PAGES = '.length, end).trim().replace(/;$/, '') + ')');

const djb2 = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
};

/* Every user-visible string a page spec produces, in document order. Kept in
   step with `renderBlock` by hand — a block form added there needs a case
   here, and an unknown one throws rather than silently scoring a match. */
const stringsFor = (spec) => {
  const strings = [spec.eyebrow, spec.title, spec.lede];
  const walk = (blocks) => {
    for (const b of blocks) {
      const [kind] = b;
      if (kind === 'group') walk(b[2]);
      else if (kind === 'p') strings.push(b[1]);
      else if (kind[0] === 'h' && kind.length === 2) strings.push(b[1]);
      else if (kind === 'block') strings.push(b[1], b[2]);
      else if (kind === 'code') strings.push(b[1]);
      else if (kind === 'alert') strings.push(b[2]);
      // A gap is either still a placeholder or already replaced by its
      // illustration; either way its text is not prose. Skipped on the
      // canvas side too — see `fingerprint`'s IS_ILLUSTRATION.
      else if (kind === 'gap') continue;
      else if (kind === 'defs' || kind === 'doors') for (const [t, d] of b[1]) strings.push(t, d);
      else if (kind === 'flags') {
        strings.push('Useful flags:');
        for (const [f, d] of b[1]) strings.push(f + ' ' + d);
      } else if (kind === 'links') strings.push(...b[1]);
      else throw new Error('unknown block form: ' + kind);
    }
  };
  walk(spec.head || []);
  for (const s of spec.sections) walk(s.blocks);
  return strings;
};

const file = process.argv[2];
if (!file) {
  console.error('usage: verify-docs-content-pages.mjs <figma-fingerprint.json>');
  process.exit(2);
}
const canvas = JSON.parse(fs.readFileSync(file, 'utf8'));

let ok = true;
for (const spec of Object.values(PAGES)) {
  const flat = stringsFor(spec).join('').replace(/\s+/g, '');
  const mine = { len: flat.length, hash: djb2(flat) };
  const theirs = canvas[spec.name];
  const match = theirs && mine.len === theirs.len && mine.hash === theirs.hash;
  if (!match) ok = false;
  const rhs = theirs ? `${theirs.len}/${theirs.hash}` : 'not on the canvas';
  console.log(`${match ? 'MATCH  ' : 'DIFFER '} ${spec.name.padEnd(22)} spec ${mine.len}/${mine.hash}  canvas ${rhs}`);
}
process.exit(ok ? 0 : 1);
