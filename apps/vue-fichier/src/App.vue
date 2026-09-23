<script setup>
import { ref } from 'vue'
import { computedAsync } from '@vueuse/core'
import GristContainer from '@shared/components/GristContainer.vue'

const currentRecord = ref({})
const fileMapped = ref()
const badgeMapped = ref()

/* TABLE */
const tableColumnsInfos = computedAsync(async () => await grist.getOption('tableColumnInfos'), [])

/* GRIST */
const gristColumns = [
  {
    name: 'fichier',
    description: 'Colonne contenant le fichier',
  },
  {
    name: 'badge',
    description: 'Statut du PV',
  },
]

const onRecord = (record) => {
  currentRecord.value = record
}

const onRecords = (params) => {
  const { mapping } = params
  fileMapped.value = mapping['fichier']
  badgeMapped.value = mapping['badge']
}

const onConfiguration = (configurations) => updateViewFromConfiguration(configurations)
const onOptions = (options) => updateViewFromConfiguration(options)

const updateViewFromConfiguration = (configurations) => {
  for (const configuration of configurations) {
    if (configuration.name === 'tableColumnInfos') tableColumnsInfos.value = configuration.value
  }
}
</script>

<template>
  <GristContainer
    :columns="gristColumns"
    @update:record="onRecord"
    @update:records="onRecords"
    @update:configuration="onConfiguration"
    @update:options="onOptions"
  >
    <main class="fr-p-3w">
      <h1>Importer un PV</h1>
      <p>{{ currentRecord }}</p>
    </main>
  </GristContainer>
</template>
