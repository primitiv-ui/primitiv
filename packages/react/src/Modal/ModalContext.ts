import { createStrictContext } from "../utils/index.ts";

import { ModalContextValue } from "./types";

export const [ModalContext, useModalContext] =
  createStrictContext<ModalContextValue>(
    "Component must be rendered as a child of Modal.Root",
    "ModalContext",
  );

const ModalProvider = ModalContext.Provider;

export { ModalProvider };
