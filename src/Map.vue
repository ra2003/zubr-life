<template>
    <div class="map-main" id="map">
        <vl-map :load-tiles-while-animating="true"
                :load-tiles-while-interacting="true"
                class="map">
            <vl-view :zoom.sync="zoom"
                     :enable-rotation="false"
                     :center.sync="center"
            ></vl-view>
            <vl-geoloc @update:position="onUpdatePosition">
                <template slot-scope="geoloc">
                    <vl-feature v-if="geoloc.position" id="position-feature">
                        <vl-geom-point :coordinates="geoloc.position"></vl-geom-point>
                        <vl-style-box>
                            <vl-style-icon src="./assets/marker.png" :scale="0.4" :anchor="[0.5, 1]"></vl-style-icon>
                        </vl-style-box>
                    </vl-feature>
                </template>
            </vl-geoloc>
            <vl-layer-tile id="osm">
                <vl-source-osm></vl-source-osm>
            </vl-layer-tile>
            <vl-feature v-for="item of liveFeatures"
                        :key="item.id"
                        :properties="item.properties">
                <template slot-scope="feature">
                    <vl-geom-point :coordinates="item.coordinates"></vl-geom-point>
                    <vl-style-box>
                        <vl-style-icon v-if="item.properties.type === 'продукты питания'" src="./assets/img/icons/prop_food.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'транспорт'" src="./assets/img/icons/prop_transport.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'медицинская помощь'" src="./assets/img/icons/prop_health.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'жилье'" src="./assets/img/icons/prop_housing.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else-if="item.properties.type === 'telegram'" src="./assets/img/icons/tg.png" :scale="0.5"></vl-style-icon>
                        <vl-style-icon v-else src="./assets/img/icons/prop_other.png" :scale="0.5"></vl-style-icon>
                    </vl-style-box>
                </template>
            </vl-feature>
            <vl-interaction-select :features.sync="selectedFeatures" v-if="drawType == null">
                <template slot-scope="select">
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
                    <vl-overlay class="feature-popup"
                                v-for="feature in select.features"
                                :key="feature.id"
                                :id="feature.id"
                                :position="pointOnSurface(feature.geometry)"
                                :auto-pan="true"
                                :auto-pan-animation="{ duration: 300 }">
                        <template>
                            <section class="card" v-if="feature.id !== 'position-feature'">
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
                                        <p>Контакт: <span v-html="feature.properties.contact"></span></p>
                                    </div>
                                </div>
                            </section>
                            <section class="card" v-else>
                                <div class="card-content">
                                    <div class="content">
                                        Ваше текущее местоположение
                                    </div>
                                </div>

                            </section>
                        </template>
                    </vl-overlay>
                </template>
            </vl-interaction-select>
        </vl-map>

        <div class="toolbar-panel">
            <div class="buttons has-addons">
                <b-button type="is-success"
                          size="is-medium"
                          icon-right="plus"/>
                <b-button type="is-info"
                          size="is-medium"
                          @click="infoModal = true"
                          icon-right="exclamation"/>
                <b-button type="is-warning"
                          size="is-medium"
                          @click="filterModal = true"
                          active
                          icon-right="filter"/>
            </div>
        </div>
        <div class="map-panel">
            <b-button type="is-primary"
                      size="is-medium"
                      rounded
                      icon-right="question"/>
        </div>
        <b-modal
            v-model="filterModal"
            has-modal-card
            trap-focus
            :destroy-on-hide="false"
            aria-role="dialog"
            aria-modal>
            <form action="">
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Фильтры</p>
                        <button
                            type="button"
                            class="delete"
                            @click="filterModal = false"/>
                    </header>
                    <section class="modal-card-body">
                        <strong>Категории: </strong>
                        <br>
                        <br>
                        <div class="field"
                             v-for="item of types"
                             :key="item">
                            <b-checkbox v-model="filter.types"

                                        :native-value="item">
                                {{item}}
                            </b-checkbox>
                        </div>
                    </section>
                    <footer class="modal-card-foot">
                        <button class="button" type="button" @click="filterModal = false">Закрыть</button>
                    </footer>
                </div>
            </form>
        </b-modal>
        <b-modal
            v-model="infoModal"
            has-modal-card
            trap-focus
            :destroy-on-hide="false"
            aria-role="dialog"
            aria-modal>
            <form action="">
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Дополнительно</p>
                        <button
                            type="button"
                            class="delete"
                            @click="infoModal = false"/>
                    </header>
                    <section class="modal-card-body">
                        <div v-for="(favourite, key) in favourites" :key="key">
                            <p><strong>{{key}}:</strong></p>
                            <ul>
                                <li v-for="item of favourite" :key="item.text">
                                    <span v-if="item.url.length > 1">
                                        {{item.text}}
                                        <br>
                                    <a :href="url" target="_blank" v-for="url of item.url"
                                       :key="url">
                                        {{url | formatContact}}
                                    </a>

                                    </span>
                                    <span v-else>
                                        <a :href="url" target="_blank" v-for="url of item.url"
                                           :key="url">
                                        {{item.text}}
                                    </a>
                                    </span>

                                </li>
                            </ul>
                        </div>
                        <ul>
                            <li>

                            </li>
                        </ul>
                    </section>
                    <footer class="modal-card-foot">
                        <button class="button" type="button" @click="infoModal = false">Закрыть</button>
                    </footer>
                </div>
            </form>
        </b-modal>
    </div>
</template>
<script>
    import predefined           from './features'
    import favourites           from './favourites'
    import {findPointOnSurface} from 'vuelayers/lib/ol-ext'

    const types = [
        'telegram',
        'жилье',
        'иное',
        'медицинская помощь',
        'продукты питания',
        'транспорт'
    ];
    export default {
        filters : {
            formatContact(value) {
                return value.indexOf('http') !== 0 && value.indexOf(':') !== false ? value.split(':')[1] : value
            }
        },
        data() {
            return {
                center          : [27.568817138671978, 53.899078973945166],
                zoom            : 9,
                predefined,
                types,
                selectedFeatures: [],
                filterModal     : false,
                infoModal       : false,
                deviceCoordinate: undefined,
                drawType        : undefined,
                filter          : {
                    types: [
                        'telegram',
                        'жилье',
                        'медицинская помощь',
                        'продукты питания',
                    ]
                },
                favourites
            }
        },
        methods : {
            pointOnSurface: findPointOnSurface,
            onUpdatePosition(coordinate) {
                this.deviceCoordinate = coordinate
            },
        },
        computed: {
            liveFeatures() {
                return this.predefined.filter(item => this.filter.types.includes(item.properties.type));
            }
        }
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
            position: absolute
            top: 0
            right: 0
            max-height: 500px
            width: 5em

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

        .toolbar-panel
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
