<script lang="ts">
  import type {} from "@primitiv-ui/web/svelte";

  function onChange(event: CustomEvent<{ value: number }>) {
    return event.detail.value;
  }
</script>

<primitiv-tabs onprimitiv-tabs-change={onChange}></primitiv-tabs>
