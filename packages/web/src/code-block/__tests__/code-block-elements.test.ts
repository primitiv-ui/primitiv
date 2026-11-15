import { defineCodeBlock, type ElementRegistry } from "../elements";
import { BLOCK, COPY_BUTTON } from "./code-block.fixtures";

const writeText = vi.fn((_text: string) => Promise.resolve());

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => {
  document.body.replaceChildren();
  writeText.mockClear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** Let the clipboard's promise and the element's reconcile run. */
const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve();
};

async function mount(html: string) {
  defineCodeBlock();
  document.body.innerHTML = html;
  await settle();
}

const element = () => document.querySelector("primitiv-code-block-copy") as HTMLElement & { copied: boolean };
const button = () => element().querySelector("button") as HTMLButtonElement;
const glyph = (state: string) => button().querySelector(`[data-copy-state="${state}"]`) as SVGElement;

describe("defineCodeBlock", () => {
  it("defines exactly the copy control's tag name on the registry it is given", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: () => undefined,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineCodeBlock(registry);

    // Assert
    expect(defined).toEqual(["primitiv-code-block-copy"]);
  });
});

describe("<primitiv-code-block-copy>", () => {
  it("copies the block's code as the reader sees it: no line numbers, no trailing newline", async () => {
    // Arrange
    await mount(BLOCK);

    // Act
    button().click();
    await settle();

    // Assert
    expect(writeText).toHaveBeenCalledExactlyOnceWith("const a = 1;\nconst b = 2;");
  });

  it("shows its copied state once the clipboard has the text, then reverts after two seconds", async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await mount(BLOCK);

    // Act
    button().click();
    await settle();

    // Assert
    expect(element().hasAttribute("copied")).toBe(true);
    expect(element().copied).toBe(true);
    expect(button().getAttribute("data-copied")).toBe("");
    expect(button().getAttribute("aria-label")).toBe("Copied");
    expect(glyph("copied").hasAttribute("hidden")).toBe(false);
    expect(glyph("idle").hasAttribute("hidden")).toBe(true);

    // Act
    vi.advanceTimersByTime(1999);
    await settle();

    // Assert
    expect(element().hasAttribute("copied")).toBe(true);

    // Act
    vi.advanceTimersByTime(1);
    await settle();

    // Assert
    expect(element().hasAttribute("copied")).toBe(false);
    expect(button().hasAttribute("data-copied")).toBe(false);
    expect(button().getAttribute("aria-label")).toBe("Copy code");
    expect(glyph("copied").hasAttribute("hidden")).toBe(true);
    expect(glyph("idle").hasAttribute("hidden")).toBe(false);
  });

  it("restarts the two seconds when copied again", async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await mount(BLOCK);
    button().click();
    await settle();
    vi.advanceTimersByTime(1500);

    // Act
    button().click();
    await settle();
    vi.advanceTimersByTime(1500);
    await settle();

    // Assert
    expect(element().hasAttribute("copied")).toBe(true);
  });

  it("reads its copied label from copied-label", async () => {
    // Arrange
    await mount(BLOCK.replace("<primitiv-code-block-copy>", '<primitiv-code-block-copy copied-label="Copiado">'));

    // Act
    button().click();
    await settle();

    // Assert
    expect(button().getAttribute("aria-label")).toBe("Copiado");
  });

  it("follows copied-label as it changes while copied", async () => {
    // Arrange
    await mount(BLOCK);
    element().copied = true;
    await settle();

    // Act
    element().setAttribute("copied-label", "Kopiert");
    await settle();

    // Assert
    expect(button().getAttribute("aria-label")).toBe("Kopiert");
  });

  it("restores the label the button had when it was copied, not a stale one", async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await mount(BLOCK);
    button().setAttribute("aria-label", "Copy snippet");

    // Act
    button().click();
    await settle();
    vi.advanceTimersByTime(2000);
    await settle();

    // Assert
    expect(button().getAttribute("aria-label")).toBe("Copy snippet");
  });

  it("leaves a text button's name to its visible text", async () => {
    // Arrange
    await mount(
      `<div><primitiv-code-block-copy><button type="button"><span data-copy-state="idle">Copy</span><span data-copy-state="copied" hidden>Copied</span></button></primitiv-code-block-copy><pre><code>x</code></pre></div>`,
    );

    // Act
    button().click();
    await settle();

    // Assert
    expect(button().hasAttribute("aria-label")).toBe(false);
    expect(glyph("copied").hasAttribute("hidden")).toBe(false);
  });

  it("copies the code its for names, wherever it is", async () => {
    // Arrange
    await mount(
      `<primitiv-code-block-copy for="elsewhere"><button type="button">Copy</button></primitiv-code-block-copy>` +
        `<pre><code>not this</code></pre><pre id="elsewhere"><code>this one\n</code></pre>`,
    );

    // Act
    button().click();
    await settle();

    // Assert
    expect(writeText).toHaveBeenCalledExactlyOnceWith("this one");
  });

  it("copies a <code> its for names directly", async () => {
    // Arrange
    await mount(
      `<primitiv-code-block-copy for="snippet"><button type="button">Copy</button></primitiv-code-block-copy><code id="snippet">npm i</code>`,
    );

    // Act
    button().click();
    await settle();

    // Assert
    expect(writeText).toHaveBeenCalledExactlyOnceWith("npm i");
  });

  it("copies the shown panel's code in a tabbed block, skipping hidden ones", async () => {
    // Arrange
    await mount(
      `<div><div>${COPY_BUTTON}</div>` +
        `<div hidden><pre><code>npm i</code></pre></div>` +
        `<div><pre><code>pnpm add</code></pre></div></div>`,
    );

    // Act
    button().click();
    await settle();

    // Assert
    expect(writeText).toHaveBeenCalledExactlyOnceWith("pnpm add");
  });

  it("announces the copy as a cancelable primitiv-code-block-copy, which a listener can veto", async () => {
    // Arrange
    await mount(BLOCK);
    const seen: unknown[] = [];
    element().addEventListener("primitiv-code-block-copy", (event) => {
      seen.push((event as CustomEvent).detail);
      event.preventDefault();
    });

    // Act
    button().click();
    await settle();

    // Assert
    expect(seen).toEqual([{ text: "const a = 1;\nconst b = 2;" }]);
    expect(writeText).not.toHaveBeenCalled();
    expect(element().hasAttribute("copied")).toBe(false);
  });

  it("does nothing, and throws nothing, where there is no clipboard or no code", async () => {
    // Arrange
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const thrown: unknown[] = [];
    const onError = (event: ErrorEvent) => thrown.push(event.error);
    window.addEventListener("error", onError);
    await mount(BLOCK + `<section>${COPY_BUTTON.replace("<primitiv-code-block-copy>", '<primitiv-code-block-copy id="lonely">')}</section>`);

    // Act
    button().click();
    (document.querySelector("#lonely button") as HTMLButtonElement).click();
    await settle();
    window.removeEventListener("error", onError);

    // Assert
    expect(thrown).toEqual([]);
    expect(element().hasAttribute("copied")).toBe(false);
  });

  it("copies nothing when there is no code to copy, or its for names none", async () => {
    // Arrange
    await mount(
      `<primitiv-code-block-copy><button type="button">Copy</button></primitiv-code-block-copy>` +
        `<primitiv-code-block-copy for="missing"><button type="button">Copy</button></primitiv-code-block-copy>` +
        `<primitiv-code-block-copy for="empty"><button type="button">Copy</button></primitiv-code-block-copy><div id="empty"></div>`,
    );

    // Act
    for (const each of document.querySelectorAll("button")) each.click();
    await settle();

    // Assert
    expect(writeText).not.toHaveBeenCalled();
  });

  it("leaves keys to the button, which turns Enter and Space into a press itself", async () => {
    // Arrange
    await mount(BLOCK);

    // Act
    button().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();

    // Assert
    expect(writeText).not.toHaveBeenCalled();
  });

  it("follows copied set from outside, by attribute or property", async () => {
    // Arrange
    await mount(BLOCK);

    // Act
    element().copied = true;
    await settle();

    // Assert
    expect(button().getAttribute("data-copied")).toBe("");

    // Act
    element().removeAttribute("copied");
    await settle();

    // Assert
    expect(button().hasAttribute("data-copied")).toBe(false);
    expect(element().copied).toBe(false);
  });

  it("stops its timer when it leaves the page", async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await mount(BLOCK);
    button().click();
    await settle();
    const control = element();

    // Act
    control.remove();
    vi.advanceTimersByTime(2000);

    // Assert — still copied: nothing ran against a detached control
    expect(control.hasAttribute("copied")).toBe(true);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    // Act
    await mount(BLOCK);

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
  });

  it("reports a control without exactly one element child once, and leaves it alone", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(`<div><primitiv-code-block-copy><button type="button">A</button><button type="button">B</button></primitiv-code-block-copy><pre><code>x</code></pre></div>`);
    (document.querySelector("button") as HTMLButtonElement).click();
    await settle();

    // Assert
    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0]![0])).toContain("<primitiv-code-block-copy> needs exactly one element child");
    expect(writeText).not.toHaveBeenCalled();
  });
});
