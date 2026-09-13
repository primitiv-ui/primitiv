import type { Metadata } from "next";
import { Asta_Sans, JetBrains_Mono, Khand } from "next/font/google";
import type { ReactNode } from "react";

/*
 * The token layer must be the FIRST stylesheet in the document: it declares the
 * canonical @layer order (reset → tokens → theme → base → variants → states)
 * and @imports the base element styles. Every registry component sheet also
 * re-declares that order up front (RFC 0008 §7) so a sheet bundled ahead of
 * this one cannot invert reset↔base — but importing it here keeps the intent
 * explicit rather than relying on that safety net.
 *
 * `fonts.css` comes after, re-pointing the three font-family tokens at the
 * faces loaded below. It sits in the `primitiv.theme` layer, so its position in
 * the import order does not actually decide precedence — the layer does.
 */
import "../styles/primitiv/tokens.css";
import "./reset.css";
import "./fonts.css";
import "./document.css";

/*
 * Weights match what the sibling apps request, so the faces are identical
 * across the workbench, kitchen-sink and this site.
 *
 * Asta Sans and JetBrains Mono are variable fonts — passing an explicit
 * `weight` would pin them to static instances and lose the whole range the
 * type scale relies on, so it is deliberately omitted. Khand is not variable,
 * hence the explicit list.
 */
const astaSans = Asta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--docs-font-text",
});

const khand = Khand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--docs-font-heading",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--docs-font-mono",
});

/*
 * Applied to <html> before first paint, so the page never flashes light on its
 * way to the default dark (the static HTML carries no data-theme, and the CSS
 * :root default is light). Reads the SAME key useDocsTheme/ThemeToggle write —
 * a JSON-encoded "light"/"dark" — and falls back to dark for anything else
 * (no choice stored, parse error). Keep this rule identical to useDocsTheme's
 * `stored ?? "dark"`; the two must not disagree.
 */
const THEME_INIT_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("primitiv-docs-theme"));document.documentElement.dataset.theme=(t==="light"||t==="dark")?t:"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export const metadata: Metadata = {
  title: {
    default: "Primitiv",
    template: "%s · Primitiv",
  },
  description:
    "Headless React components, a styled registry you own, and a token engine — " +
    "documented across three consumption modes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // lang is required for a screen reader to pick the right pronunciation
    // rules; without it the document is announced in the user's default.
    //
    // The three font classes go on <html> so their CSS variables are in scope
    // for the whole document — including anything portalled to the top layer
    // (Select's popover, Dropdown panels), which is outside <body>'s subtree in
    // paint order but still inherits custom properties through the DOM tree.
    <html
      lang="en"
      // The pre-paint script sets data-theme on <html> before hydration, so the
      // server HTML (no data-theme) and the client (data-theme set) differ on
      // this element by design — suppress the mismatch warning for it only.
      suppressHydrationWarning
      className={`${astaSans.variable} ${khand.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        {/* Runs synchronously as the body is parsed — before the first paint —
            so the page never flashes light on its way to the default dark. It
            must be a raw inline <script> for that timing guarantee: next/script
            beforeInteractive is emitted as a deferred __next_s loader entry that
            can run after the first paint, reintroducing the flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
