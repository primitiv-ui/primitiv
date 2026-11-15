import { TriggerController } from "../internal/TriggerController.ts";

/** What the copy controller asks of its host: copy the block's code. */
export type CodeBlockCopyControllerHost = {
  copy(): void;
};

/**
 * The copy control's DOM behaviour: a press on its one trigger asks the host to
 * copy. A `<button>` turns Enter and Space into that press itself, so there is
 * no key handling of its own.
 */
export class CodeBlockCopyController extends TriggerController {
  readonly #host: CodeBlockCopyControllerHost;

  constructor(root: HTMLElement, host: CodeBlockCopyControllerHost) {
    super(root);
    this.#host = host;
  }

  protected onTriggerClick(): void {
    this.#host.copy();
  }

  protected onTriggerKeydown(): void {}
}
