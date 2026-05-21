import { handleUiMessage } from "./handleMessage";

// Sandbox entry point. Figma runs this in the plugin sandbox and exposes
// the built UI bundle as the `__html__` global. The UI announces itself
// with a `ui-ready` message once its listener is registered; the sandbox
// then replies with `plugin-ready`, which avoids the iframe-load race
// where an eager post would be dropped before the UI could hear it.
figma.showUI(__html__, { width: 640, height: 800, themeColors: true });

figma.ui.onmessage = handleUiMessage;
