import { createApp } from 'vue'
import '@gouvfr/dsfr/dist/dsfr.min.css'      // Import des styles du DSFR //
import '@gouvminint/vue-dsfr/styles'         // Import des styles globaux propre à VueDSFR //
import VueDsfr from '@gouvminint/vue-dsfr'   // Import (par défaut) de la bibliothèque //
import '@shared/styles/app.css'              // Import des styles de l'application //   

import App from './App.vue'

const app = createApp(App)
app.use(VueDsfr)                              // Enregistrement de la bibliothèque en tant que plugin //
app.mount('#app-vue-formulaire')