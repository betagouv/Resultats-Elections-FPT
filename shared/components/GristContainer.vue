<script setup>
import { ref, computed } from 'vue'
const props = defineProps(['columns', 'configuration'])
const emit = defineEmits(['update:record', 'update:records'])

/* READY */
grist.ready({
  requiredAccess: 'full',
  columns: props.columns || [],
  onEditOptions: () => {
    openConfiguration()
  }
})

/* RECORDS */
grist.onRecord((record) => {
  emit('update:record', record)
})

grist.onRecords((table, mapping) => {
  emit('update:records', {table, mapping})
})

/* CONFIGURATION */
const configurationIsOpened = ref(false)
const configurationSaved = ref(false)
const configurationInput = ref('')
const configurationEmpty = computed(() => !props.configuration)

const openConfiguration = async () => {
  configurationIsOpened.value = true
  if (configurationEmpty.value) return
  configurationSaved.value = await grist.getOption(props.configuration.name)
  if (configurationSaved.value) configurationInput.value = configurationSaved.value
}
const closeConfiguration = () => {
  configurationIsOpened.value = false
  if(configurationEmpty.value) return
  const newConfiguration = {
    name: props.configuration.name,
    value: configurationInput.value,
  }
  grist.setOption(props.configuration.name, configurationInput.value)
  emit('update:configuration', newConfiguration)
}
</script>
<template>
  <main class="grist-container">
    <aside v-if="configurationIsOpened" class="grist-container__configuration fr-p-2w">
      <p>Panneau de configuration</p>
      <p v-if="configurationEmpty">Aucune configuration disponible</p>
      <div class="fr-mb-2w" v-else>
        <label>{{ configuration.label }} :
          <input v-model="configurationInput" type="text" :name="configuration.name" />
        </label>
      </div>
      <button @click="closeConfiguration">Fermer</button>
    </aside>
    <slot />
  </main>  
</template>

<style lang="css">
.grist-container__configuration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: 9;
}

.grist-container__configuration input {
  border: 1px solid purple;
}
</style>