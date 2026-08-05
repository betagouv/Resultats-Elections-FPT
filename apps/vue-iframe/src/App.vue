<script setup>
import { computedAsync } from '@vueuse/core'
import GristContainer from '@shared/components/GristContainer.vue'
import valuesUtils from '@shared/utils/values.js'

/* GRIST */
const configurationName = 'iframeUrl'
const gristConfiguration = {
  name: configurationName,
  label: "Entrer l'url de l'iframe à afficher, attention à avoir un lien en https",
}

/* Iframe */
const iframeUrl = computedAsync(async () => {
  const url = await grist.getOption(configurationName)
  return valuesUtils.cleanUrl(url)
}, '')
const onConfiguration = (configurations) => updateViewFromConfiguration(configurations)
const onOptions = (options) => updateViewFromConfiguration(options)
const updateViewFromConfiguration = (configurations) => {
  for (const configuration of configurations) {
    if (configuration.name === configurationName) iframeUrl.value = valuesUtils.cleanUrl(configuration.value)
  }
}
</script>

<template>
  <GristContainer
    :configuration="gristConfiguration"
    @update:configuration="onConfiguration"
    @update:options="onOptions"
  >
    <iframe
      v-if="iframeUrl"
      class="vue-iframe"
      :src="iframeUrl"
      title="Contenu iframe"
    />
  </GristContainer>
</template>

<style lang="css" scoped>
.vue-iframe {
  display: block;
  width: 100%;
  height: 100vh;
  border: 0;
}
</style>
