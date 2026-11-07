<script lang="ts">
  // Everything here must compile against @primitiv-ui/web/svelte.
  import type {} from "@primitiv-ui/web/svelte";

  function onChange(event: CustomEvent<{ value: string; index: number }>) {
    const next: string = event.detail.value;
    return next;
  }
</script>

<primitiv-tabs value="one" orientation="vertical" activation-mode="manual" onprimitiv-tabs-change={onChange}>
  <primitiv-tabs-list label="Sections">
    <primitiv-tabs-trigger value="one" disabled>
      <button type="button">One</button>
    </primitiv-tabs-trigger>
  </primitiv-tabs-list>
  <primitiv-tabs-content value="one" onprimitiv-tabs-show={() => {}}>Panel</primitiv-tabs-content>
</primitiv-tabs>
