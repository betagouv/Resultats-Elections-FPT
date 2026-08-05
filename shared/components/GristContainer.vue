<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'

/* SETTINGS */
const props = defineProps(['columns', 'configuration'])
const emit = defineEmits(['update:record', 'update:records'])

/* READY */
grist.ready({
  requiredAccess: 'full',
  columns: props.columns || [],
  allowSelectBy: true,
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

grist.onOptions((options) => {
  if (!options) return
  const optionsArray = Object.entries(options).map(([name, value]) => ({name, value}))
  emit('update:options', optionsArray)
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
  updateConfiguration()
}

const updateConfiguration = () => {
  let newConfiguration = []
  if (props.configuration.name) newConfiguration.push({name: props.configuration.name, value: configurationInput.value})
  newConfiguration.push({name: 'tableColumnInfos', value: tableColumnInfos.value})
  emit('update:configuration', newConfiguration)
}

/* CURSOR POS */
const updateCursorPos = (cursorPos) => {
  grist.setCursorPos({ rowId: cursorPos })
}
defineExpose({updateCursorPos})

/* Table column infos cache */
const isLoading = ref(false)
const tableColumnInfos = computedAsync(async () => await grist.getOption('tableColumnInfos'), [])
const saveTableColumnInfos = async () => {
  isLoading.value = true
  const infos = await gristUtils.getTableColumnsInfos()
  tableColumnInfos.value = infos
  grist.setOption('tableColumnInfos', infos)
  isLoading.value = false
}
</script>
<template>
  <main class="grist-container">
    <aside v-if="configurationIsOpened" class="grist-container__configuration fr-p-2w">
      <h2>Panneau de configuration</h2>
      <button @click="closeConfiguration">Fermer le panneau de configuration</button>
      <p class="fr-text--xs fr-mt-1w">Après avoir cliquer sur "Fermer le panneau de configuration", vous devrez cliquer sur le bouton "Enregistrer" de Grist pour que les modifications soient prises en compte.</p>
      <hr>
      <div class="fr-my-2w">
        <h3>1. Configuration de la vue personnalisée</h3>
        <p v-if="configurationEmpty">Aucune configuration disponible</p>
        <div class="fr-mb-2w" v-else>
          <label>{{ configuration.label }} :
            <br/>
            <input v-model="configurationInput" type="text" :name="configuration.name" style="width: 100%;"/>
          </label>
        </div>
      </div>
      <div class="fr-my-2w">
        <h3>2. Informations de la table</h3>
        <p>Les informations de la table sont enregistrées pour être utilisées dans la vue personnalisée.</p>
        <button @click="saveTableColumnInfos" :disabled="isLoading">{{ isLoading ? 'Chargement en cours...' : 'Actualiser les informations' }}</button>
        <pre>{{ tableColumnInfos || 'Aucune information de la table enregistrée' }}</pre>
      </div>
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
  background-color: var(--background-contrast-blue-france);
  z-index: 9;
  overflow-y: scroll;
}

.grist-container__configuration input,
.grist-container__configuration button {
  border: 1px solid black;
}
</style>