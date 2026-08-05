<script setup>
import { ref, computed, onMounted } from 'vue'
import valuesUtils from '@shared/utils/values.js'
import gristUtils from '@shared/utils/grist.js'

const props = defineProps(['selectedIds','scrutinName','allowAlreadyLinked','collectiviteSearchName'])
const emit = defineEmits(['select'])

const search = ref('')
const appliedSearch = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const refListAll = ref(null)

const isSearching = computed(() => appliedSearch.value.trim() !== '')
const hasNoResults = computed(() => isSearching.value && searchResults.value.length === 0)

/* Reset */
const reset = () => {
  search.value = ''
  appliedSearch.value = ''
  searchResults.value = []
  isLoading.value = false
}
onMounted(() => { reset() })

/* Search */
const triggerSearch = async () => {
  searchResults.value = []
  appliedSearch.value = ''

  const searchValue = search.value.trim().toLowerCase()
  if (searchValue.length < 3) return

  isLoading.value = true
  appliedSearch.value = search.value.trim()
  refListAll.value = await gristUtils.getTable('Table_collectivites')

  const names = refListAll.value[props.collectiviteSearchName]
  const foundIndexes = []
  names.forEach((name, index) => {
    let isFound = valuesUtils.isInString(name, searchValue)
    if (isFound && props.selectedIds.length > 0) {
      isFound = !props.selectedIds.includes(refListAll.value.id[index])
    }
    if (isFound) foundIndexes.push(index)
  })

  const columnScrutinName = `Scrutin_${props.scrutinName}_Nom`
  searchResults.value = foundIndexes.map((index) => {
    const name = names[index]
    const scrutins = refListAll.value[columnScrutinName][index]
    const alreadyLinked = scrutins !== null && scrutins !== '' && scrutins !== 0
    const disabledMessage = alreadyLinked ? `Est déjà rattachée : ${scrutins}` : ''
    return {
      id: refListAll.value.id[index],
      name,
      disabled: props.allowAlreadyLinked ? false : !!disabledMessage,
      hint: props.allowAlreadyLinked
        ? (alreadyLinked && scrutins ? `Est déja rattachée : ${scrutins}` : '')
        : disabledMessage,
      checked: false,
    }
  })

  isLoading.value = false
}

const selectCollectivite = (result) => {
  if (result.disabled || props.selectedIds.includes(result.id)) return
  emit('select', { id: result.id, name: result.name })
  searchResults.value = searchResults.value.filter((item) => item.id !== result.id)
}
</script>

<template>
  <fieldset class="fr-fieldset">
    <legend class="fr-fieldset__legend--regular fr-fieldset__legend">
      Rechercher une collectivité à ajouter :
      <span class="fr-hint-text">Indiquer (au minimum) les 3 premières lettres du nom</span>
    </legend>
    <div class="fr-fieldset__element">
      <DsfrSearchBar
        v-model="search"
        large
        label="Ajouter une collectivité :"
        button-text="Rechercher"
        placeholder="Nom de la collectivité"
        @search="triggerSearch"
      />
    </div>
    <div v-if="isLoading" class="fr-fieldset__element fr-mb-0">
      <p>Recherche en cours...</p>
    </div>
    <div v-else-if="isSearching" class="fr-fieldset__element collectivite-search__results">
      <p v-if="hasNoResults" class="fr-mb-0">Aucun résultat pour la recherche "{{ appliedSearch }}"</p>
      <p v-else class="fr-mb-0">{{ searchResults.length }} {{ searchResults.length === 1 ? 'résultat' : 'résultats' }} pour la recherche "{{ appliedSearch }}"</p>
      <DsfrButton
        label="Supprimer la recherche"
        icon="ri-delete-bin-line"
        :icon-only="true"
        tertiary
        @click="reset"
      />
    </div>
    <div v-if="searchResults.length > 0" class="fr-fieldset__element">
      <div
        v-for="result in searchResults"
        :key="result.id"
        class="fr-mb-2w"
      >
        <DsfrCheckbox
          :model-value="result.checked"
          :name="`search-${result.id}`"
          :value="result.id"
          :label="result.name"
          :hint="result.hint"
          :disabled="result.disabled"
          @update:model-value="(checked) => checked && selectCollectivite(result)"
        />
      </div>
    </div>
  </fieldset>
</template>

<style lang="css" scoped>
.collectivite-search__results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
</style>
