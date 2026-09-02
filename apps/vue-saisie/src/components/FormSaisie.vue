<script setup>
import FormField from './FormField.vue'

defineProps(['displayView', 'title', 'requiredInputs', 'votesInputs', 'syndicatsInputs', 'votesLegend', 'syndicatsLegend', 'formModels', 'hasNoCandidat', 'isLoading'])
const emit = defineEmits(['back', 'save', 'update:field'])
</script>

<template>
  <DsfrAlert v-if="displayView === 'success'" type="success" :title="`Scrutin ${title} enregistré`" description="Retrouver les informations du scrutin dans le résumé à gauche." />
  <DsfrAlert v-if="displayView === 'error'" type="error" title="Une erreur technique est survenue" description="Merci de recommencer votre saisie, nous nous excusons pour la gène occasionnée." />
  <div v-if="displayView !== 'form'" class="fr-grid-row fr-grid-row--center fr-my-2w">
    <DsfrButton @click="emit('back')" secondary>Revenir au formulaire</DsfrButton>
  </div>
  <form v-if="displayView === 'form'" class="fr-mb-2w">
    <h1 class="fr-h6">Modifier le scrutin {{ title }}</h1>
    <fieldset class="fr-fieldset fr-mb-2w">
      <div class="fr-fieldset__element">
        <div v-for="input in requiredInputs" :key="input.name" class="fr-mb-2w">
          <FormField :input="input" :model-value="formModels[input.name]" @update:model-value="(value) => emit('update:field', input.name, value)" />
        </div>
      </div>
    </fieldset>
    <fieldset class="fr-fieldset fr-mb-2w">
      <legend class="fr-fieldset__legend">{{ votesLegend }} :</legend>
      <div class="fr-fieldset__element">
        <div class="fr-grid-row fr-grid-row--gutters">
          <div v-for="input in votesInputs" :key="input.name" class="fr-col-12 fr-mb-2w">
            <FormField :input="input" :model-value="formModels[input.name]" :disabled="hasNoCandidat" @update:model-value="(value) => emit('update:field', input.name, value)" />
          </div>
        </div>
      </div>
    </fieldset>
    <fieldset class="fr-fieldset fr-mb-2w">
      <legend class="fr-fieldset__legend">{{ syndicatsLegend }} :</legend>
      <div class="fr-fieldset__element">
        <div class="fr-grid-row fr-grid-row--gutters">
          <div v-for="input in syndicatsInputs" :key="input.name" class="fr-col-6 fr-mb-2w">
            <FormField :input="input" :model-value="formModels[input.name]" :disabled="hasNoCandidat" @update:model-value="(value) => emit('update:field', input.name, value)" />
          </div>
        </div>
      </div>
    </fieldset>
    <DsfrButton @click="emit('save')" :disabled="isLoading">Enregistrer les modifications</DsfrButton>
  </form>
</template>
