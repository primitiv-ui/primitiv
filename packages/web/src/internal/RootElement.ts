import { ElementBase, owned } from "./element.ts";

/** What a root element hosts: a controller it connects and disconnects with itself. */
type Connectable = { connect(): void; disconnect(): void };

/** Ids generated so far, shared by every root so no two ever collide. */
let generatedIds = 0;

/**
 * The lifecycle every component's root element shares (RFC 0033 §5.4, D11).
 *
 * The root never caches its parts, so markup that arrives later is picked up on
 * the next reconcile. One `MutationObserver` is the only trigger after connect:
 * it sees parts arriving and leaving and every attribute in
 * {@link PrimitivRootElement.reconcileOn | `reconcileOn`}, and it already
 * delivers a task's changes as one callback, so no further batching is needed.
 * The root's own writes (role, aria-*, ids, data-*) stay out of that list, so
 * reconciling never re-triggers itself. Leaving the document stops all
 * listening; a move (an `hx-preserve`, a framework reparenting) is a disconnect
 * followed by a connect, so handlers never stack.
 *
 * A subclass supplies its controller, the attributes it reads, and the
 * reconcile that writes its parts' ARIA. Internal — not an entry point.
 */
export abstract class PrimitivRootElement extends ElementBase {
  #generatedId: string | undefined;
  readonly #observer = new MutationObserver(() => {
    this.reconcile();
    this.#settleChange();
  });
  /** A user's value change was applied and its native `change` is still owed. */
  #changeOwed = false;

  /** The behaviour this root hosts, listening while the root is connected. */
  protected abstract readonly controller: Connectable;

  /** The attributes, on the root or any part, whose change needs a reconcile. */
  protected abstract readonly reconcileOn: readonly string[];

  /** Write every part's ARIA and state from the root's reflected attributes. */
  protected abstract reconcile(): void;

  connectedCallback(): void {
    this.controller.connect();
    this.#observer.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [...this.reconcileOn],
    });
    this.reconcile();
  }

  disconnectedCallback(): void {
    this.controller.disconnect();
    this.#observer.disconnect();
  }

  /** The root's id, or one generated once, which the parts' ids derive from. */
  protected rootId(): string {
    // Stryker disable next-line UpdateOperator: equivalent — counting down yields ids just as unique.
    return this.id || (this.#generatedId ??= `${this.localName}-${++generatedIds}`);
  }

  /** The reading direction, from `:dir()`, so an inherited `dir` attribute applies (D8). */
  protected direction(): "ltr" | "rtl" {
    // Stryker disable next-line StringLiteral: equivalent — core tests only for "rtl", so any other string reads as left-to-right.
    return this.matches(":dir(rtl)") ? "rtl" : "ltr";
  }

  /** This root's `selector` parts, never those of a nested root of the same kind. */
  protected parts(selector: string): HTMLElement[] {
    return owned(this, selector, this.localName);
  }

  /**
   * Announce a user-driven change as a bubbling, cancelable `type` event fired
   * before it applies, so a listener can veto it — the elements' equivalent of
   * React's controlled mode (D7). Returns `false` when it was vetoed.
   */
  protected announce(type: string, detail: unknown): boolean {
    return this.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail }));
  }

  /**
   * Announce a user's change to the value this root submits with a form, as
   * {@link announce} does, and owe a native `change` once it has applied. The
   * change is fired after the reconcile the applied value triggers, so the
   * hidden form inputs already hold it: a `change` listener, `hx-trigger="change"`
   * or `new FormData()` reads the value the user chose, which the cancelable
   * event, fired before it applies, cannot offer. A vetoed change owes nothing.
   */
  protected announceValue(type: string, detail: unknown): boolean {
    const applied = this.announce(type, detail);
    this.#changeOwed ||= applied;
    return applied;
  }

  /** Fire the native `change` a just-applied value is owed. */
  #settleChange(): void {
    if (!this.#changeOwed) return;
    this.#changeOwed = false;
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
