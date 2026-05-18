import { AlertProps } from "./types";

export function Alert({ children, ...rest }: AlertProps) {
  return (
    <div role="alert" {...rest}>
      {children}
    </div>
  );
}

Alert.displayName = "Alert";
