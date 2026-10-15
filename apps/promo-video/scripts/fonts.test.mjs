import { describe, expect, it } from "vitest";

import { latinFaces } from "./fonts.mjs";

const CSS = `/* latin-ext */
@font-face {
  font-family: 'Khand';
  font-weight: 600;
  src: url(https://fonts.gstatic.com/s/khand/v1/ext.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'Khand';
  font-weight: 600;
  src: url(https://fonts.gstatic.com/s/khand/v1/latin.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'Asta Sans';
  font-weight: 300 800;
  src: url(https://fonts.gstatic.com/s/astasans/v1/latin.woff2) format('woff2');
}`;

describe("latinFaces", () => {
  it("keeps only the latin subset of each face", () => {
    expect(latinFaces(CSS).map((f) => f.url)).toEqual([
      "https://fonts.gstatic.com/s/khand/v1/latin.woff2",
      "https://fonts.gstatic.com/s/astasans/v1/latin.woff2",
    ]);
  });

  it("names each file after its family and weight range", () => {
    expect(latinFaces(CSS).map((f) => f.file)).toEqual(["Khand-600.woff2", "AstaSans-300_800.woff2"]);
  });

  it("rewrites each rule to point at the local file", () => {
    const [face] = latinFaces(CSS);
    expect(face.css).toContain("url('./Khand-600.woff2')");
    expect(face.css).not.toContain("gstatic");
  });
});
