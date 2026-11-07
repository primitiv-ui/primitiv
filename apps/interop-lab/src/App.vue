<script setup lang="ts">
// Vue 3 rendering the raw elements: `:value` binds the property, `@` listens to
// the kebab-case event, and controlled use goes through preventDefault.
import { ref } from "vue";

import { fixtureFromUrl, TABS } from "./fixture";

const fixture = fixtureFromUrl();
const value = ref(fixture.value ?? "one");
const renders = ref(0);

function onChange(event: CustomEvent<{ value: string }>) {
  event.preventDefault();
  value.value = event.detail.value;
}
</script>

<template>
  <div :dir="fixture.dir ?? undefined">
    <primitiv-tabs
      :value="value"
      :orientation="fixture.orientation ?? undefined"
      :activation-mode="fixture.mode ?? undefined"
      @primitiv-tabs-change="onChange"
    >
      <primitiv-tabs-list label="Sections">
        <primitiv-tabs-trigger
          v-for="tab in TABS"
          :key="tab.value"
          :value="tab.value"
          :disabled="fixture.disabled.includes(tab.value) ? '' : undefined"
        >
          <button type="button">{{ tab.label }}</button>
        </primitiv-tabs-trigger>
      </primitiv-tabs-list>
      <primitiv-tabs-content v-for="tab in TABS" :key="tab.value" :value="tab.value">{{ tab.panel }}</primitiv-tabs-content>
    </primitiv-tabs>
    <output data-testid="state">{{ value }}</output>
    <button type="button" data-testid="rerender" @click="renders++">Re-render {{ renders }}</button>
  </div>
</template>
