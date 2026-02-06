<script setup>
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import StatusBadge from '@shared/components/StatusBadge.vue'
import valuesUtils from '@shared/utils/values.js'
import gristUtils from '@shared/utils/grist.js'
import writeXlsxFile from 'write-excel-file'
import pictoDocumentFill from '@shared/picto/document-fill.svg'
import GristContainer from '@shared/components/GristContainer.vue'

const titleMapped = ref()
const badgeMapped = ref()
const dataMapped = ref([])
const errorsMapped = ref([])
const actionMapped = ref()

/* CONFIGURATION */
const configurationButtonName = 'save-button'
const gristConfiguration = {
  name: configurationButtonName,
  label: 'Pour afficher le bouton pour "Enregister les données" de la fiche écrivez oui, sinon laissez vide',
}
const showDownloadButton = computedAsync(async () => {
  const configuration = await grist.getOption(configurationButtonName)
  return configuration === 'oui'
}, false)

/* RECORD */
const currentRecord = ref({})
const isNotFilled = computed(() => {
  const badge = currentRecord.value[badgeMapped.value]
  return badge ? badge.toLowerCase() === 'à renseigner' : false
})

/* TABLE */
const tableColumnsInfos = computedAsync(async () => {
  return await gristUtils.getTableColumnsInfos()
}, [])

/* GRIST */
const gristColumns = [
  {
    name: 'title',
    description: 'Titre de ma carte',
  },
  {
    name: 'badge',
    description: 'Badge',
    optional: true,
  },
  {
    name: 'data',
    description: 'Données saisies',
    allowMultiple: true,
  },
  {
    name: 'errors',
    description: 'Contrôles de cohérences',
    allowMultiple: true,
    optional: true,
  },
  {
    name: 'action',
    description: 'Action',
    optional: true,
  }
]

const onRecord = (record) => {
  currentRecord.value = record
}

const onRecords = (params) => {
  const { mapping } = params
  titleMapped.value = mapping['title']
  badgeMapped.value = mapping['badge']
  dataMapped.value = mapping['data']
  errorsMapped.value = mapping['errors']
  actionMapped.value = mapping['action']
}

const onConfiguration = (configuration) => {
  showDownloadButton.value = configuration.value === 'oui'
}

/* FUNCTIONS */
const getPrettyValue = (value) => {
  return valuesUtils.prettify(value)
} 

const getPrettyLabel = (label) => {
  const columnInfo = tableColumnsInfos.value.find(column => column.colId === label)
  return columnInfo ? columnInfo.label : null
}

/* MODAL */
const opened = ref(false)
const triggerAction = async () => {
  const recordAction = currentRecord.value[actionMapped.value].action
  const actionArray = JSON.parse(JSON.stringify(recordAction))
  const updatedRecord = await grist.docApi.applyUserActions([actionArray])
  if (updatedRecord) opened.value = false
}

/* EXPORT */
const isDownloadingFile = ref(false)
const downloadExcel = async () => {
  const data = generateExcelData()
  isDownloadingFile.value = true
  const title = currentRecord.value[titleMapped.value].replace(/ /g, '-')
  const fileName = `informations-${title}.xlsx`
  await writeXlsxFile(data, {
    fileName: fileName
  })
  isDownloadingFile.value = false
}

const generateExcelData = () => {
  const excelData = []
  const headersColumns = dataMapped.value.map(data => {
    return { value: getPrettyLabel(data) }
  })
  const rows = []
  const cellToSplit = {
    columnIndex: null,
    list: []
  }
  const row = dataMapped.value.map((data, index) => {
    const columnInfo = gristUtils.getColumnInfos(data, tableColumnsInfos.value)
    const value = currentRecord.value[data]
    const isList = typeof value === 'object' && value
    if (isList) {
      cellToSplit.columnIndex = index
      cellToSplit.list = value
    }
    return {
      type: getExcelType(columnInfo.type),
      value: isList ? null : value, 
    }
  })
  if (cellToSplit.columnIndex !== null) {
    for(const value of cellToSplit.list) {
      const cloneRow = row.map((cell, index) => {
        const isCellToUpdate = index === cellToSplit.columnIndex
        const newValue = isCellToUpdate ? value : cell.value
        return {
          type: cell.type,
          value: newValue,
        }
      })
      rows.push(cloneRow)
    }
  } else rows.push(row)
 
  excelData.push(headersColumns)
  excelData.push(...rows)
  return excelData
}

const getExcelType = (type) => {
  if (type === 'Int' || type === 'Numeric') return Number
  if (type === 'Bool') return Boolean
  else return String
}
</script>
<template>
  <GristContainer @update:record="onRecord" @update:records="onRecords" :columns="gristColumns" :configuration="gristConfiguration" @update:configuration="onConfiguration">
    <main v-if="currentRecord.id" class="fr-p-3w">
      <DsfrTile
        v-if="isNotFilled"
        :title="currentRecord[titleMapped]"
        :img-src="pictoDocumentFill"
        description="À renseigner dans le formulaire à droite"
        title-tag="p"
        to="/"
      />
      <div v-else-if="tableColumnsInfos.length > 0">
        <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--top fr-mb-3w">
          <div class="fr-col-6">
            <h1 data-js="title" class="fr-mb-1w fr-h6">{{ currentRecord[titleMapped] }}</h1>
            <StatusBadge :label="currentRecord[badgeMapped]" />
          </div>
          <div class="fr-col-6 fr-grid-row fr-grid-row--right">
            <DsfrButton 
              v-if="showDownloadButton" 
              icon="fr-icon-download-line"
              secondary 
              :label="isDownloadingFile ? 'Téléchargement en cours...' : 'Télécharger les données (Excel)'" 
              @click="downloadExcel" />
          </div>
        </div>
        <ul class="fr-pl-0 fr-mb-3w app-list--unstyled">
          <li v-for="error in errorsMapped" :key="error" class="fr-pb-0 fr-mb-1w">
            <DsfrAlert v-if="currentRecord[error]" type="error" titleTag="p" :description="currentRecord[error]" />
          </li>
        </ul>
        <ul class="fr-pl-0 fr-mb-3w app-list--unstyled">
          <li v-for="data in dataMapped" :key="data" class="fr-pb-0 fr-mb-1w">
            <div v-if="currentRecord[data] && typeof currentRecord[data] === 'object' && currentRecord[data].length > 0">
              <p class="fr-mb-0">{{ getPrettyLabel(data) }} :</p>
              <ul v-if="currentRecord[data].length > 0" class="fr-pl-0 fr-mb-3w app-list--unstyled">
                <li v-for="item in currentRecord[data]" :key="item">{{ getPrettyValue(item) }}</li>
              </ul>
            </div>
            <p v-else class="fr-mb-0">{{ getPrettyLabel(data) }} : {{ getPrettyValue(currentRecord[data]) }}</p>
          </li>
        </ul>
        <DsfrButton v-if="currentRecord[actionMapped]" :label="currentRecord[actionMapped].button" @click="opened = true" />
      </div>
      <div v-else>
        <p>Chargement en cours...</p>
      </div>
      <DsfrModal
        v-if="currentRecord[actionMapped]"
        v-model:opened="opened"
        :title="currentRecord[actionMapped].button"
        @close="opened = false"
      >
        <template #default>
          <p>{{ currentRecord[actionMapped].description }}</p>
          <DsfrButton v-if="!currentRecord[actionMapped].isDisabled" label="Oui" @click="triggerAction" />
        </template>
      </DsfrModal>
    </main>
  </GristContainer>
</template>