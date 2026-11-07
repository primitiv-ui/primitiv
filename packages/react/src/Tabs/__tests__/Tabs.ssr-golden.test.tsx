/**
 * NAMED EXCEPTION to the strict red-green rule (RFC 0033 §6.3, accepted
 * 2026-11-07). This file passes on its first run by design: it records the
 * server-rendered markup of Tabs *before* `@primitiv-ui/react` Tabs moves onto
 * the web implementation's TabsController, so the move must reproduce it byte
 * for byte. No other Tabs test renders to a string, so nothing else would catch
 * a change in server output. Delete it one release after the move ships.
 */
import { renderToString } from "react-dom/server";

import { Tabs } from "..";

function triggers(disabled: string[] = []) {
  return ["one", "two", "three"].map((value) => (
    <Tabs.Trigger key={value} value={value} disabled={disabled.includes(value)}>
      {value}
    </Tabs.Trigger>
  ));
}

function panels() {
  return ["one", "two", "three"].map((value) => (
    <Tabs.Content key={value} value={value}>
      Panel {value}
    </Tabs.Content>
  ));
}

const cases = {
  uncontrolled: (
    <Tabs.Root defaultValue="two">
      <Tabs.List label="Sections">{triggers()}</Tabs.List>
      {panels()}
    </Tabs.Root>
  ),
  controlled: (
    <Tabs.Root value="three" onValueChange={() => {}}>
      <Tabs.List label="Sections">{triggers()}</Tabs.List>
      {panels()}
    </Tabs.Root>
  ),
  "no active tab": (
    <Tabs.Root>
      <Tabs.List label="Sections">{triggers()}</Tabs.List>
      {panels()}
    </Tabs.Root>
  ),
  "vertical, manual, right to left": (
    <Tabs.Root defaultValue="one" orientation="vertical" activationMode="manual" dir="rtl">
      <Tabs.List ariaLabelledBy="heading">{triggers()}</Tabs.List>
      {panels()}
    </Tabs.Root>
  ),
  disabled: (
    <Tabs.Root defaultValue="one">
      <Tabs.List label="Sections">{triggers(["two"])}</Tabs.List>
      {panels()}
    </Tabs.Root>
  ),
  "lazy mount": (
    <Tabs.Root defaultValue="one" lazyMount>
      <Tabs.List label="Sections">{triggers()}</Tabs.List>
      {panels()}
    </Tabs.Root>
  ),
  "asChild and consumer props": (
    <Tabs.Root defaultValue="one" className="root" data-testid="tabs">
      <Tabs.List label="Sections" className="list">
        <Tabs.Trigger value="one" className="trigger" onClick={() => {}} onKeyDown={() => {}}>
          one
        </Tabs.Trigger>
        <Tabs.Trigger value="two" asChild>
          <a href="/two">two</a>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one" className="panel">
        Panel one
      </Tabs.Content>
      <Tabs.Content value="two">Panel two</Tabs.Content>
    </Tabs.Root>
  ),
};

describe("Tabs server-rendered markup (refactor guard)", () => {
  it.each(Object.entries(cases))("is unchanged: %s", (_name, element) => {
    // Arrange & Act
    const html = renderToString(element);

    // Assert
    expect(html).toMatchSnapshot();
  });
});
