import { FieldsetLegendProps, FieldsetProps } from "./types";

function Fieldset({ disabled, children, ...rest }: FieldsetProps) {
  return (
    <fieldset
      {...rest}
      disabled={disabled}
      data-disabled={disabled ? "" : undefined}
    >
      {children}
    </fieldset>
  );
}

Fieldset.displayName = "Fieldset";

function FieldsetLegend({ children, ...rest }: FieldsetLegendProps) {
  return <legend {...rest}>{children}</legend>;
}

FieldsetLegend.displayName = "FieldsetLegend";

type FieldsetCompound = typeof Fieldset & {
  Root: typeof Fieldset;
  Legend: typeof FieldsetLegend;
};

const FieldsetCompound: FieldsetCompound = Object.assign(Fieldset, {
  Root: Fieldset,
  Legend: FieldsetLegend,
});

FieldsetCompound.displayName = "Fieldset";

export { FieldsetCompound as Fieldset };
