import { usePopoverContext } from "../PopoverContext";

export function usePopoverContent() {
  const { open, contentId } = usePopoverContext();

  const contentProps = {
    id: contentId,
    role: "dialog" as const,
    popover: "auto" as const,
    "data-state": (open ? "open" : "closed") as "open" | "closed",
  };

  return { contentProps };
}
