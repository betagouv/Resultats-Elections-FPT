<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'

/* INFORMATIONS */
const currentRecord = ref({})
const fieldsMapped = ref()
const titleMapped = ref()
const formModels = ref({})

/* TABLE */
const tableColumnsInfos = computedAsync(async () => {
  return await gristUtils.getTableColumnsInfos()
}, [])

/* FORMULAIRE */
const formInputs = computed(() => {
  if (tableColumnsInfos.value.length <= 0 || fieldsMapped.value.length <= 0) return []
  return fieldsMapped.value.map(field => {
    const infos = gristUtils.getColumnInfos(field, tableColumnsInfos.value)
    const type = gristUtils.getHtmlType(infos.type)
    return { infos, type, name: infos.colId }
  })
})

const formSelects = computedAsync(async () => {
  let options = {}
  for(let i = 0; i < formInputs.value.length; i++) {
    const isSelect = formInputs.value[i].type === 'select'
    if (!isSelect) continue
    options[formInputs.value[i].name] = await getSelectOptions(formInputs.value[i].infos.type)
  }
  return options
}, {})


const getSelectOptions = async (type) => {
  const tableId = type.replace('Ref:', '')
  const refRecords = await gristUtils.getTable(tableId)
  const options = []
  for(let i = 0; i < refRecords.id.length; i++) {
    options.push({
      text: refRecords.Nom_complet_acronyme[i],
      value: refRecords.id[i],
    })
  }
  return options
}


/* GRIST */
const gristColumns = [
  {
    name: 'title',
    description: 'Titre du formulaire',
  },
  {
    name: 'fields',
    description: 'Champs à modifier',
    allowMultiple: true,
  }
]

const onRecord = (record) => {
  currentRecord.value = record
}

const onRecords = (params) => {
  const { mapping } = params
  titleMapped.value = mapping['title']
  fieldsMapped.value = mapping['fields']
  for(let i = 0; i < fieldsMapped.value.length; i++) {
    formModels.value[fieldsMapped.value[i]] = null
  }
}
</script>

<template>
  <GristContainer @update:record="onRecord" @update:records="onRecords" :columns="gristColumns">
    <main class="fr-container fr-p-3w">
      <form>
        <h1 class="fr-h6">Modifier {{ currentRecord[titleMapped] }}</h1>
        <div v-for="input in inputs" :key="input.name">
          <DsfrInput
            v-if="input.type === 'text'"
            v-model="formInputs.name"
            :label="input.infos.label"
            :label-visible="true"
            :hint="input.infos.description"
          />
          <p v-else>{{ input }}</p>
        </div>
      </form>
    </main>
  </GristContainer>
</template>