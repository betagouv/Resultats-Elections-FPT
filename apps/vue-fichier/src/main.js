import { createApp } from 'vue'
import '@gouvfr/dsfr/dist/dsfr.min.css'      // Import des styles du DSFR //
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css'  // Import des icônes "document" du DSFR //
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css'      // Import des icônes "system" du DSFR //
import '@gouvminint/vue-dsfr/styles'         // Import des styles globaux propre à VueDSFR //
import '@shared/styles/app.css'              // Import des styles de l'application //   

import App from './App.vue'

const app = createApp(App)
app.mount('#app-vue-fichier')
