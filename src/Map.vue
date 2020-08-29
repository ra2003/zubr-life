<template>
    <div class="map-main" id="map">
        <vl-map :load-tiles-while-animating="true"
                :load-tiles-while-interacting="true"
                class="map">
            <vl-view :zoom.sync="zoom"
                     :enable-rotation="false"
                     :center.sync="center"
            ></vl-view>
            <vl-layer-tile id="osm">
                <vl-source-osm></vl-source-osm>
            </vl-layer-tile>
            <vl-feature v-for="item of predefined"
                        :key="item.id"
                        :properties="item.properties">
                <template slot-scope="feature">
                    <vl-geom-point :coordinates="item.coordinates"></vl-geom-point>
                    <vl-style-box>
                        <vl-style-icon v-if="item.properties.type === 'продукты питания'" src="./assets/img/icons/prop_food.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'транспорт'" src="./assets/img/icons/prop_transport.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'медицинская помощь'" src="./assets/img/icons/prop_health.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'жилье'" src="./assets/img/icons/prop_housing.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'telegram'" src="./assets/img/icons/tg.png" :scale="0.6"></vl-style-icon>
                        <vl-style-icon v-else src="./assets/img/icons/prop_other.png" :scale="0.5"></vl-style-icon>
                    </vl-style-box>
                </template>
            </vl-feature>
            <vl-interaction-select :features.sync="selectedFeatures" v-if="drawType == null">
                <template slot-scope="select">
                    <!-- select styles -->
                    <vl-style-box>
                        <vl-style-stroke color="#423e9e" :width="7"></vl-style-stroke>
                        <vl-style-fill :color="[254, 178, 76, 0.7]"></vl-style-fill>
                        <vl-style-circle :radius="5">
                            <vl-style-stroke color="#423e9e" :width="7"></vl-style-stroke>
                            <vl-style-fill :color="[254, 178, 76, 0.7]"></vl-style-fill>
                        </vl-style-circle>
                    </vl-style-box>
                    <vl-style-box :z-index="1">
                        <vl-style-stroke color="#d43f45" :width="2"></vl-style-stroke>
                        <vl-style-circle :radius="5">
                            <vl-style-stroke color="#d43f45" :width="2"></vl-style-stroke>
                        </vl-style-circle>
                    </vl-style-box>
                    <vl-overlay class="feature-popup" v-for="feature in select.features"
                                :key="feature.id" :id="feature.id"
                                :position="pointOnSurface(feature.geometry)"
                                :auto-pan="true"
                                :auto-pan-animation="{ duration: 300 }">
                        <template>
                            <section class="card">
                                <header class="card-header">
                                    <p class="card-header-title">
                                        <span v-if="feature.properties">{{feature.properties.type}}</span>
                                    </p>
                                    <a class="card-header-icon" title="Close"
                                       @click="selectedFeatures = selectedFeatures.filter(f => f.id !== feature.id)">
                                        <b-icon icon="close"></b-icon>
                                    </a>
                                </header>
                                <div class="card-content">
                                    <div class="content" v-if="feature.properties">
                                        <p v-if="feature.properties.url">
                                            Ссылка: <a :href="feature.properties.url" target="_blank">
                                            {{feature.properties.url}}
                                        </a>
                                        </p>
                                        <p>Описание: {{feature.properties.text}}</p>
                                        <p v-if="feature.properties.address">Адрес: {{feature.properties.address}}</p>
                                        <p>Контакт: {{feature.properties.contact}}</p>
                                    </div>
                                </div>
                            </section>
                        </template>
                    </vl-overlay>
                </template>
            </vl-interaction-select>
        </vl-map>
        <div class="base-layers-panel">
            <div class="buttons has-addons">
                <button class="button is-light">Запрос о помощи</button>
                <button class="button is-light">
                    <img src="./assets/img/icons/all_mini.png">Инициативы
                </button>
            </div>
        </div>
    </div>
</template>
<script>
    import predefined             from './features'
    import { findPointOnSurface } from 'vuelayers/lib/ol-ext'

    export default {
        data () {
            return {
                center          : [27.568817138671978, 53.899078973945166],
                zoom            : 10,
                predefined,
                selectedFeatures: [],
                drawType        : undefined,
            }
        },
        methods: {
            pointOnSurface: findPointOnSurface,
        },
    }
</script>
<style lang="sass">
    @import ~bulma/sass/utilities/_all

    html, body, #map
        width: 100%
        height: 100%
        margin: 0
        padding: 0

    .map-main
        position: relative

        .map
            height: 100%
            width: 100%

        .map-panel
            padding: 0

            .panel-heading
                box-shadow: 0 .25em .5em transparentize($dark, 0.8)

            .panel-content
                background: $white
                box-shadow: 0 .25em .5em transparentize($dark, 0.8)

            .panel-block
                &.draw-panel
                    .buttons
                        .button
                            display: block
                            flex: 1 1 100%

            +tablet()
                position: absolute
                top: 0
                right: 0
                max-height: 500px
                width: 22em

        .base-layers-panel
            position: absolute
            left: 50%
            bottom: 20px
            transform: translateX(-50%)

        .feature-popup
            position: absolute
            left: -50px
            bottom: 12px
            width: 20em
            max-width: none

            &:after, &:before
                top: 100%
                border: solid transparent
                content: ' '
                height: 0
                width: 0
                position: absolute
                pointer-events: none

            &:after
                border-top-color: white
                border-width: 10px
                left: 48px
                margin-left: -10px

            &:before
                border-top-color: #cccccc
                border-width: 11px
                left: 48px
                margin-left: -11px

            .card-content
                max-height: 20em
                overflow: auto

            .content
                word-break: break-all
</style>
