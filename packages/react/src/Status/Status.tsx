import { StatusProps } from "./types";

export function Status({ children, ...rest }: StatusProps) {
  return (
    <div role="status" {...rest}>
      {children}
    </div>
  );
}

Status.displayName = "Status";
