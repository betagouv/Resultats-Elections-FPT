import { createApp } from 'vue'
import { plugin as dsfrPlugin } from 'vue-dsfr'
import '@gouvfr/dsfr/dist/dsfr.min.css'
import App from './App.vue'

const app = createApp(App)

app.use(dsfrPlugin)

app.mount('#app')

