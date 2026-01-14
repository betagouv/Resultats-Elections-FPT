<script setup>
const props = defineProps(['columns'])
const emit = defineEmits(['update:record', 'update:records'])


/* GRIST */
grist.ready({
  requiredAccess: 'full',
  columns: props.columns || []
})

grist.onRecord((record) => {
  emit('update:record', record)
})

grist.onRecords((table, mapping) => {
  emit('update:records', {table, mapping})
})

</script>
<template>
  <main>
    <slot />
  </main>  
</template>