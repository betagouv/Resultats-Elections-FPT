import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Configuration des ports par app
// port 5173 utilisé pour les anciennes applications html
const portMap = {
  'vue-fiche': 5174,
}

// Détection du mode pour choisir l'app
const getAppConfig = (mode) => {
  const appName = mode || 'vue-fiche'
  const port = portMap[appName] || 5173

  return {
    root: `apps/${appName}`,
    outDir: `dist/${appName}`,
    port: port
  }
}

export default defineConfig(({ mode }) => {
  const appConfig = getAppConfig(mode)

  return {
    plugins: [vue()],
    root: appConfig.root,
    build: {
      outDir: `../../${appConfig.outDir}`,
      emptyOutDir: true
    },
    server: {
      port: appConfig.port,
      strictPort: false
    },
    resolve: {
      alias: {
        '@': `${__dirname}${appConfig.root}/src`,
        '@shared': `${__dirname}shared`
      }
    }
  }
})
