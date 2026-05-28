import { InputProps } from "./types";

export function Input({ type = "text", ref, ...rest }: InputProps) {
  return <input {...rest} type={type} ref={ref} />;
}

Input.displayName = "Input";
