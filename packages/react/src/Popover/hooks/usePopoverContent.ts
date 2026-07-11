import { usePopoverContext } from "../PopoverContext";

export function usePopoverContent() {
  const { contentId } = usePopoverContext();

  const contentProps = {
    id: contentId,
  };

  return { contentProps };
}
