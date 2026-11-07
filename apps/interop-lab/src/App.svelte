<script lang="ts">
  // Svelte 5 rendering the raw elements: attributes and properties bind
  // directly, `onprimitiv-tabs-change` listens to the raw event, and controlled
  // use goes through preventDefault.
  import type {} from "@primitiv-ui/web/svelte";

  import { fixtureFromUrl, TABS } from "./fixture";

  const fixture = fixtureFromUrl();
  // The URL is untyped; the element's attributes are not.
  const orientation = (fixture.orientation ?? undefined) as "horizontal" | "vertical" | undefined;
  const mode = (fixture.mode ?? undefined) as "automatic" | "manual" | undefined;
  const dir = (fixture.dir ?? undefined) as "ltr" | "rtl" | undefined;

  let value = $state(fixture.value ?? "one");
  let renders = $state(0);

  function onChange(event: CustomEvent<{ value: string; index: number }>) {
    event.preventDefault();
    value = event.detail.value;
  }
</script>

<div {dir}>
  <primitiv-tabs {value} {orientation} activation-mode={mode} onprimitiv-tabs-change={onChange}>
    <primitiv-tabs-list label="Sections">
      {#each TABS as tab (tab.value)}
        <primitiv-tabs-trigger value={tab.value} disabled={fixture.disabled.includes(tab.value) || undefined}>
          <button type="button">{tab.label}</button>
        </primitiv-tabs-trigger>
      {/each}
    </primitiv-tabs-list>
    {#each TABS as tab (tab.value)}
      <primitiv-tabs-content value={tab.value}>{tab.panel}</primitiv-tabs-content>
    {/each}
  </primitiv-tabs>
  <output data-testid="state">{value}</output>
  <button type="button" data-testid="rerender" onclick={() => renders++}>Re-render {renders}</button>
</div>
