<script setup lang="ts">
// Type-level tests for @primitiv-ui/web/vue, checked by `pnpm typecheck`.
// Each @vue-expect-error must stay an error; everything else must compile.
import type {} from "@primitiv-ui/web/vue";

function onChange(event: CustomEvent<{ value: string; index: number }>) {
  const next: string = event.detail.value;
  return next;
}
</script>

<template>
  <primitiv-tabs value="one" orientation="vertical" activation-mode="manual" @primitiv-tabs-change="onChange">
    <primitiv-tabs-list label="Sections">
      <primitiv-tabs-trigger value="one" disabled>
        <button type="button">One</button>
      </primitiv-tabs-trigger>
    </primitiv-tabs-list>
    <primitiv-tabs-content value="one">Panel</primitiv-tabs-content>
  </primitiv-tabs>

  <!-- @vue-expect-error orientation is horizontal | vertical -->
  <primitiv-tabs orientation="diagonal" />

  <!-- @vue-expect-error activation-mode is automatic | manual -->
  <primitiv-tabs activation-mode="sometimes" />

  <!-- @vue-expect-error a trigger needs its value -->
  <primitiv-tabs-trigger />
</template>
