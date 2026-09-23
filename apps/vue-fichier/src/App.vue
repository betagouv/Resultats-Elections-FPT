<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import GristContainer from '@shared/components/GristContainer.vue'
import ImportFile from './components/ImportFile.vue'

const currentRecord = ref({})
const fileMapped = ref()
const badgeMapped = ref()
const scrutinMapped = ref()

/* OPTIONS */
const tableColumnsInfos = computedAsync(async () => await grist.getOption('tableColumnInfos'), [])
const fileName = computedAsync(async () => await grist.getOption(configurationName), '')

/* CONFIGURATION */
const configurationName = 'fileName'
const gristConfiguration = {
  name: configurationName,
  label: 'Nom du fichier à importer (ex: "le PV")',
}

/* VUE */
const title = computed(() => {
  if (!currentRecord?.value[scrutinMapped?.value] || !fileName?.value) return ''
  return `${fileName.value} de ${currentRecord.value[scrutinMapped.value]}`
})

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
  {
    name: 'scrutin',
    description: 'Scrutin',
  },
]

const onRecord = (record) => {
  currentRecord.value = record
}

const onRecords = (params) => {
  const { mapping } = params
  fileMapped.value = mapping['fichier']
  badgeMapped.value = mapping['badge']
  scrutinMapped.value = mapping['scrutin']
}

const onConfiguration = (configurations) => updateViewFromConfiguration(configurations)
const onOptions = (options) => updateViewFromConfiguration(options)

const updateViewFromConfiguration = (configurations) => {
  for (const configuration of configurations) {
    if (configuration.name === 'tableColumnInfos') tableColumnsInfos.value = configuration.value
    if (configuration.name === configurationName) fileName.value = configuration.value || 'Importer un PV'
  }
}
</script>

<template>
  <GristContainer
    :columns="gristColumns"
    :configuration="gristConfiguration"
    @update:record="onRecord"
    @update:records="onRecords"
    @update:configuration="onConfiguration"
    @update:options="onOptions"
  >
    <main class="fr-p-3w">
      <h1 class="fr-h6">{{ title }} :</h1>
      <ImportFile :row-id="currentRecord.id" :file-column="fileMapped" />
      <pre>{{ currentRecord }}</pre>
    </main>
  </GristContainer>
</template>
