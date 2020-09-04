import Vue       from 'vue'
import Buefy     from 'buefy'
import VueLayers from 'vuelayers'
import 'vuelayers/lib/style.css'
import App       from './Map.vue'
import * as Sentry from "@sentry/browser";
import { Vue as VueIntegration } from "@sentry/integrations";


Vue.config.productionTip = false
Vue.use(Buefy, {
    defaultIconPack: 'fa',
    defaultLocale: 'ru-RU'
})
Vue.use(
    VueLayers,
    {
        dataProjection: 'EPSG:4326',
    },
)

/* eslint-disable no-new */
new Vue({
    el    : '#app',
    render: h => h(App),
})

Sentry.init({
    dsn: "https://c847e26be2e94ac7b26915bde2e72cce@o419101.ingest.sentry.io/5305774",
    integrations: [new VueIntegration({ Vue, attachProps: true })],
});
