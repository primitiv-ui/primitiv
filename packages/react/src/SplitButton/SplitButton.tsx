import type { ReactElement } from "react";

import { SplitButtonActionProps, SplitButtonRootProps } from "./types";

export function SplitButtonRoot({
  children,
  ref,
  ...rest
}: SplitButtonRootProps): ReactElement {
  return (
    <div {...rest} ref={ref} role="group" data-split-button="">
      {children}
    </div>
  );
}

SplitButtonRoot.displayName = "SplitButtonRoot";

export function SplitButtonAction({
  children,
  ref,
  ...rest
}: SplitButtonActionProps): ReactElement {
  return (
    <button
      type="button"
      {...rest}
      ref={ref}
      data-split-button-action=""
    >
      {children}
    </button>
  );
}

SplitButtonAction.displayName = "SplitButtonAction";

export type TSplitButtonCompound = typeof SplitButtonRoot & {
  Root: typeof SplitButtonRoot;
  Action: typeof SplitButtonAction;
};

const SplitButtonCompound: TSplitButtonCompound = Object.assign(
  SplitButtonRoot,
  {
    Root: SplitButtonRoot,
    Action: SplitButtonAction,
  },
);

SplitButtonCompound.displayName = "SplitButton";

export { SplitButtonCompound as SplitButton };
