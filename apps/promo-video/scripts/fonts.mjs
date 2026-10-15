/**
 * The latin-subset `@font-face` rules from a Google Fonts stylesheet, each
 * re-pointed at a local file so the renderer never needs the network.
 */
export const latinFaces = (css) => {
  const faces = [];
  for (const [, subset, rule] of css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face \{[^}]*\})/g)) {
    if (subset !== "latin") continue;
    const url = /url\(([^)]+)\)/.exec(rule)[1];
    const family = /font-family: '([^']+)'/.exec(rule)[1];
    const weight = /font-weight: ([^;]+);/.exec(rule)[1].trim();
    const file = `${family.replaceAll(" ", "")}-${weight.replaceAll(" ", "_")}.woff2`;
    faces.push({ url, file, css: rule.replace(url, `'./${file}'`) });
  }
  return faces;
};
