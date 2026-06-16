import { deriveId } from "../utils/index.ts";

export function getTriggerAndPanelIds(tabsId: string, value: string) {
  return {
    triggerId: deriveId(tabsId, "trigger", value),
    panelId: deriveId(tabsId, "panel", value),
  };
}
