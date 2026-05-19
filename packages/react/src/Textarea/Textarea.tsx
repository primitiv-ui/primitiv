import { TextareaProps } from "./types";

export function Textarea({ ref, ...rest }: TextareaProps) {
  return <textarea {...rest} ref={ref} />;
}

Textarea.displayName = "Textarea";
