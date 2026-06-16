import type { Context, Provider } from "react";
import { createStrictContext } from "../utils/index.ts";

import { ModalContextValue } from "./types";

const modalContextPair = createStrictContext<ModalContextValue>(
  "Component must be rendered as a child of Modal.Root",
  "ModalContext",
);

/** React context carrying the shared {@link ModalContextValue} for a modal. */
export const ModalContext: Context<ModalContextValue | null> =
  modalContextPair[0];
/** Hook returning the nearest {@link ModalContextValue}; throws outside `Modal.Root`. */
export const useModalContext: () => ModalContextValue = modalContextPair[1];

/** Context provider for {@link ModalContext}, rendered internally by `Modal.Root`. */
const ModalProvider: Provider<ModalContextValue | null> = ModalContext.Provider;

export { ModalProvider };
