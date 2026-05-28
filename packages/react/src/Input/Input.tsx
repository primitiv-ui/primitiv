import { InputProps } from "./types";

export function Input(props: InputProps) {
  return <input {...props} />;
}

Input.displayName = "Input";
