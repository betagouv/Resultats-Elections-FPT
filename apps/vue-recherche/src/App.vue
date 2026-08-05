<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { computedAsync } from '@vueuse/core'
import valuesUtils from '@shared/utils/values.js'
import gristUtils from '@shared/utils/grist.js'
import GristContainer from '@shared/components/GristContainer.vue'

const SearchResultItem = defineAsyncComponent(
  () => import('./components/SearchResultItem.vue')
)

const gristContainerRef = ref(null)
const currentRecord = ref({})
const allRecords = ref([])
const searchMapped = ref()
const badgeMapped = ref()
const descriptionMapped = ref()
const search = ref('')
const appliedSearch = ref('')

/* TABLE */
const tableColumnsInfos = computedAsync(async () => await grist.getOption('tableColumnInfos'), [])

/* SEARCH */
const filteredRecords = computed(() => {
  const value = appliedSearch.value.trim()
  if (value === '') return allRecords.value
  return allRecords.value.filter((record) =>
    valuesUtils.isInString(record[searchMapped.value], value)
  )
})
const isSearching = computed(() => appliedSearch.value.trim() !== '')
const hasNoResults = computed(() => appliedSearch.value.trim() !== '' && filteredRecords.value.length === 0)

const triggerSearch = () => {
  appliedSearch.value = search.value
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetSearch = () => {
  search.value = ''
  appliedSearch.value = ''
}

/* GRIST */
const gristColumns = [
  {
    name: 'ColumnSearch',
    description: 'Champ de recherche',
  },
  {
    name: 'ColumnBadge',
    optional: true,
  },
  {
    name: 'ColumnDescription',
    optional: true,
  },
]

const onRecord = (record) => {
  currentRecord.value = record
}

const onRecords = (params) => {
  const { table, mapping } = params
  allRecords.value = table
  searchMapped.value = mapping['ColumnSearch']
  badgeMapped.value = mapping['ColumnBadge']
  descriptionMapped.value = mapping['ColumnDescription']
}

const onConfiguration = (configurations) => updateViewFromConfiguration(configurations)
const onOptions = (options) => updateViewFromConfiguration(options)

const updateViewFromConfiguration = (configurations) => {
  for (const configuration of configurations) {
    if (configuration.name === 'tableColumnInfos') tableColumnsInfos.value = configuration.value
  }
}

const selectRecord = (id) => {
  gristContainerRef.value?.updateCursorPos(id)
}
</script>

<template>
  <GristContainer
    ref="gristContainerRef"
    class="app-cw-search"
    :columns="gristColumns"
    @update:record="onRecord"
    @update:records="onRecords"
    @update:configuration="onConfiguration"
    @update:options="onOptions"
  >
    <main class="vue-recherche fr-container fr-p-3w">
      <div class="vue-recherche__search fr-background-alt-grey fr-py-1w">
        <DsfrSearchBar
          v-model="search"
          large
          label="Rechercher"
          button-text="Rechercher"
          placeholder="Rechercher"
          @search="triggerSearch"
        />
      </div>
      <div v-if="isSearching" class="vue-recherche__results fr-mb-1w">
        <p v-if="hasNoResults" class="fr-mt-2w">Aucun résultat pour la recherche "{{ appliedSearch }}"</p>
        <p v-else class="fr-mb-0">{{ filteredRecords.length }} {{ filteredRecords.length === 1 ? 'résultat' : 'résultats' }} pour la recherche "{{ appliedSearch }}"</p>
        <DsfrButton
          label="Supprimer la recherche"
          icon="ri-delete-bin-line"
          :icon-only="true"
          @click="resetSearch"
          tertiary
        />
      </div>
      <ul class="fr-pl-0 app-list--unstyled">
        <SearchResultItem
          v-for="record in filteredRecords"
          :key="record.id"
          :title="record[searchMapped]"
          :description="descriptionMapped ? record[descriptionMapped] : ''"
          :badge="badgeMapped ? record[badgeMapped] : ''"
          :show-badge="!!badgeMapped"
          :is-selected="currentRecord.id === record.id"
          @select="selectRecord(record.id)"
        />
      </ul>
    </main>
  </GristContainer>
</template>

<style lang="css" scoped>
.vue-recherche {
  position: relative;
}

.vue-recherche__results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.vue-recherche__search {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: white;
}
</style>