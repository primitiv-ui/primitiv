import { useId, useMemo, type KeyboardEvent, type ReactElement } from "react";

import { Dropdown } from "../Dropdown/index.ts";
import { useDropdownContext } from "../Dropdown/hooks/index.ts";
import type { DropdownRootProps } from "../Dropdown/types";
import { composeEventHandlers } from "../Slot/index.ts";
import { deriveId } from "../utils/index.ts";
import {
  SplitButtonProvider,
  useSplitButtonContext,
} from "./SplitButtonContext";
import {
  SplitButtonActionProps,
  SplitButtonItemProps,
  SplitButtonMenuProps,
  SplitButtonRootProps,
  SplitButtonSeparatorProps,
  SplitButtonTriggerProps,
} from "./types";

export function SplitButtonRoot({
  defaultOpen,
  open,
  onOpenChange,
  dir,
  disabled = false,
  children,
  ref,
  ...rest
}: SplitButtonRootProps): ReactElement {
  const rootId = useId();
  const contextValue = useMemo(
    () => ({
      actionId: deriveId(rootId, "split-button", "action"),
      triggerId: deriveId(rootId, "split-button", "trigger"),
      disabled,
    }),
    [rootId, disabled],
  );

  return (
    <Dropdown.Root
      {...({ defaultOpen, open, onOpenChange, dir } as DropdownRootProps)}
    >
      <SplitButtonProvider value={contextValue}>
        <div
          {...rest}
          ref={ref}
          role="group"
          data-split-button=""
          data-disabled={disabled ? "" : undefined}
        >
          {children}
        </div>
      </SplitButtonProvider>
    </Dropdown.Root>
  );
}

SplitButtonRoot.displayName = "SplitButtonRoot";

export function SplitButtonAction({
  children,
  disabled,
  onKeyDown,
  ref,
  ...rest
}: SplitButtonActionProps): ReactElement {
  const { actionId, disabled: groupDisabled } = useSplitButtonContext();
  const { setOpen } = useDropdownContext();
  const isDisabled = groupDisabled || disabled === true;

  const openMenu = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setOpen(true);
  };

  return (
    <button
      type="button"
      {...rest}
      ref={ref}
      id={actionId}
      disabled={isDisabled}
      onKeyDown={composeEventHandlers(onKeyDown, openMenu)}
      data-disabled={isDisabled ? "" : undefined}
      data-split-button-action=""
    >
      {children}
    </button>
  );
}

SplitButtonAction.displayName = "SplitButtonAction";

export function SplitButtonTrigger({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  disabled,
  ...rest
}: SplitButtonTriggerProps): ReactElement {
  const {
    actionId,
    triggerId,
    disabled: groupDisabled,
  } = useSplitButtonContext();
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
  const isDisabled = groupDisabled || disabled === true;

  return (
    <Dropdown.Trigger
      {...rest}
      id={triggerId}
      aria-label={ariaLabel}
      aria-labelledby={named ? ariaLabelledBy : `${triggerId} ${actionId}`}
      disabled={isDisabled}
      data-disabled={isDisabled ? "" : undefined}
      data-split-button-trigger=""
    />
  );
}

SplitButtonTrigger.displayName = "SplitButtonTrigger";

export function SplitButtonMenu(props: SplitButtonMenuProps): ReactElement {
  return <Dropdown.Content {...props} data-split-button-menu="" />;
}

SplitButtonMenu.displayName = "SplitButtonMenu";

export function SplitButtonItem(props: SplitButtonItemProps): ReactElement {
  return <Dropdown.Item {...props} />;
}

SplitButtonItem.displayName = "SplitButtonItem";

export function SplitButtonSeparator(
  props: SplitButtonSeparatorProps,
): ReactElement {
  return <Dropdown.Separator {...props} />;
}

SplitButtonSeparator.displayName = "SplitButtonSeparator";

export type TSplitButtonCompound = typeof SplitButtonRoot & {
  Root: typeof SplitButtonRoot;
  Action: typeof SplitButtonAction;
  Trigger: typeof SplitButtonTrigger;
  Menu: typeof SplitButtonMenu;
  Item: typeof SplitButtonItem;
  Separator: typeof SplitButtonSeparator;
};

const SplitButtonCompound: TSplitButtonCompound = Object.assign(
  SplitButtonRoot,
  {
    Root: SplitButtonRoot,
    Action: SplitButtonAction,
    Trigger: SplitButtonTrigger,
    Menu: SplitButtonMenu,
    Item: SplitButtonItem,
    Separator: SplitButtonSeparator,
  },
);

SplitButtonCompound.displayName = "SplitButton";

export { SplitButtonCompound as SplitButton };
