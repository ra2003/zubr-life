import Vue       from 'vue'
import Buefy     from 'buefy'
import 'buefy/dist/buefy.css'
// import VueLayers modules
import VueLayers from 'vuelayers'
// import VueLayers styles
import 'vuelayers/lib/style.css'
import App       from './Map.vue'

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
