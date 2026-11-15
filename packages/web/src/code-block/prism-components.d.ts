// Prism's grammar files extend the global `Prism` as a side effect and export
// nothing; its core file exports Prism itself.
declare module "prismjs/components/prism-core.js" {
  import type Prism from "prismjs";
  const core: typeof Prism;
  export default core;
}
declare module "prismjs/components/*.js";
