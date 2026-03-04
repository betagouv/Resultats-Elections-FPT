<script setup>
import { ref, computed } from 'vue'
import GristContainer from '@shared/components/GristContainer.vue'

const buttonMapped = ref()
const messageMapped = ref()
const titleMapped = ref()
const currentRecord = ref({})
const isLoading = ref(false)

/* GRIST */
const gristColumns = [
  {
    name: 'title',
    description: 'Titre',
  },
  {
    name: 'message',
    description: 'Message',
  },
  {
    name: 'button',
    description: 'Bouton',
  },
]

const onRecord = (record) => {
  currentRecord.value = record
}

const onRecords = (records) => {
  const { mapping } = records
  buttonMapped.value = mapping['button']
  messageMapped.value = mapping['message']
  titleMapped.value = mapping['title']
}

/* BUTTON */
const actionType = computed(() => currentRecord.value[buttonMapped.value].type || 'primary')
const triggerAction = async () => {
  isLoading.value = true
  try {
    const recordAction = currentRecord.value[buttonMapped.value].action
    const actionArray = JSON.parse(JSON.stringify(recordAction))
    await grist.docApi.applyUserActions([actionArray])
  } catch (error) {
    alert('Une erreur est survenue : ' + error.message)
  } finally {
    isLoading.value = false
  }
}
</script>
<template>
  <GristContainer :columns="gristColumns" @update:record="onRecord" @update:records="onRecords">
    <main class="fr-p-3w">
      <h1>{{ currentRecord[titleMapped] }}</h1>
      <p v-if="messageMapped">{{ currentRecord[messageMapped] }}</p>
      <DsfrButton 
        v-if="buttonMapped"
        :label="currentRecord[buttonMapped].label"
        :disabled="currentRecord[buttonMapped].isDisabled || isLoading" 
        :[actionType]="true"
        @click="triggerAction"
      />
    </main>
  </GristContainer>
</template>