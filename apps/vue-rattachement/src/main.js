import { createApp } from 'vue'
import '@gouvfr/dsfr/dist/dsfr.min.css'      // Import des styles du DSFR //
import '@gouvminint/vue-dsfr/styles'         // Import des styles globaux propre à VueDSFR //
import '@shared/styles/app.css'              // Import des styles de l'application //   

import App from './App.vue'

const app = createApp(App)
app.mount('#app-vue-rattachement')
