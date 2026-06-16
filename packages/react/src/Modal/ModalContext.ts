import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import { ModalContextValue } from "./types";

const modalContextPair = createStrictContext<ModalContextValue>(
  "Component must be rendered as a child of Modal.Root",
  "ModalContext",
);

export const ModalContext: Context<ModalContextValue | null> =
  modalContextPair[0];
export const useModalContext: () => ModalContextValue = modalContextPair[1];

const ModalProvider = ModalContext.Provider;

export { ModalProvider };
