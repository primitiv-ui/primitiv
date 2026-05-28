import {
  InputGroupAdornmentProps,
  InputGroupRootProps,
} from "./types";

function InputGroupRoot({ children, ref, ...rest }: InputGroupRootProps) {
  return (
    <div {...rest} ref={ref} data-input-group="">
      {children}
    </div>
  );
}

InputGroupRoot.displayName = "InputGroupRoot";

function InputGroupLeadingAdornment({
  children,
  ref,
  ...rest
}: InputGroupAdornmentProps) {
  return (
    <span {...rest} ref={ref} data-input-group-adornment="leading">
      {children}
    </span>
  );
}

InputGroupLeadingAdornment.displayName = "InputGroupLeadingAdornment";

function InputGroupTrailingAdornment({
  children,
  ref,
  ...rest
}: InputGroupAdornmentProps) {
  return (
    <span {...rest} ref={ref} data-input-group-adornment="trailing">
      {children}
    </span>
  );
}

InputGroupTrailingAdornment.displayName = "InputGroupTrailingAdornment";

type TInputGroupCompound = typeof InputGroupRoot & {
  Root: typeof InputGroupRoot;
  LeadingAdornment: typeof InputGroupLeadingAdornment;
  TrailingAdornment: typeof InputGroupTrailingAdornment;
};

const InputGroupCompound: TInputGroupCompound = Object.assign(InputGroupRoot, {
  Root: InputGroupRoot,
  LeadingAdornment: InputGroupLeadingAdornment,
  TrailingAdornment: InputGroupTrailingAdornment,
});

InputGroupCompound.displayName = "InputGroup";

export { InputGroupCompound as InputGroup };
