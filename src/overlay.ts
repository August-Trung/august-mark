import { createApp } from 'vue'
import OverlayApp from './OverlayApp.vue'
// NOTE: Overlay intentionally does NOT use Vuetify or its global styles
// to keep the window fully transparent without any background overrides.

const app = createApp(OverlayApp)
app.mount('#app')
