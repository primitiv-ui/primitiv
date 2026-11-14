import icons from "@/content/icons.generated.json";

/** One `@primitiv-ui/icons` glyph (scripts/gen-icon-names.mjs). */
export type IconEntry = {
  /** The file name, and the name an Elements icon slot gives. */
  readonly name: string;
  /** The React export: `Close`, or `GridIcon` where a name is overridden. */
  readonly component: string;
  /** The plain SVG the package publishes, `currentColor` and `aria-hidden`. */
  readonly svg: string;
};

export const ICONS = icons as readonly IconEntry[];

/**
 * Where the CDN serves an icon's SVG, pinned to `version` (the release the site
 * documents, `WEB_RELEASE`, which the caller passes: it is read from disk, so a
 * client component cannot import it).
 */
export const iconUrl = (name: string, version: string): string =>
  `https://cdn.jsdelivr.net/npm/@primitiv-ui/icons@${version}/svg/${name}.svg`;
