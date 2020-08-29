<template xmlns:>
  <div id="app" :class="[$options.name]">
    <!-- app map -->
    <vl-map v-if="mapVisible"
            class="map"
            ref="map"
            :load-tiles-while-animating="true"
            :load-tiles-while-interacting="true"
            @click="clickCoordinate = $event.coordinate"
            @postcompose="onMapPostCompose"
            data-projection="EPSG:4326" @mounted="onMapMounted">
      <!-- map view aka ol.View -->
      <vl-view ref="view" :center.sync="center" :zoom.sync="zoom"></vl-view>

      <!-- interactions -->
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
          <!--// select styles -->

          <!-- selected feature popup -->
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
                    <p>Адрес: {{feature.properties.address}}</p>
                    <p>Контакт: {{feature.properties.contact}}</p>
                  </div>
                </div>
              </section>
            </template>
          </vl-overlay>
          <!--// selected popup -->
        </template>
      </vl-interaction-select>
      <!--// interactions -->
      <!-- geolocation -->
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
      <!--// geolocation -->
      <vl-feature v-for="item of predefined"
                  :key="item.id"
                  :properties="item.properties">
        <template slot-scope="feature">
          <vl-geom-point :coordinates="item.coordinates"></vl-geom-point>
<!--          <vl-style-box>-->
<!--            <vl-style-icon v-if="item.properties.type === 'продукты питания'" src="./assets/icons/aid_food.png" :scale="0.5"></vl-style-icon>-->
<!--            <vl-style-icon v-else-if="item.properties.type === 'транспорт'" src="./assets/icons/aid_transport.png" :scale="0.5"></vl-style-icon>-->
<!--            <vl-style-icon v-else-if="item.properties.type === 'медицинская помощь'" src="./assets/icons/aid_doctor.png" :scale="0.5"></vl-style-icon>-->
<!--            <vl-style-icon v-else-if="item.properties.type === 'жилье'" src="./assets/icons/aid_housing.png" :scale="0.5"></vl-style-icon>-->
<!--            <vl-style-icon v-else-if="item.properties.type === 'telegram'" src="./assets/icons/tg.png" :scale="0.6"></vl-style-icon>-->
<!--            <vl-style-icon v-else src="./assets/icons/aid_other.png" :scale="0.5"></vl-style-icon>-->
<!--          </vl-style-box>-->
        </template>
      </vl-feature>
      <vl-feature id="marker" ref="marker" :properties="{ start: Date.now(), duration: 2500 }">
        <template slot-scope="feature">
          <vl-geom-point :coordinates="[-10, -10]"></vl-geom-point>
          <vl-style-box>
            <vl-style-icon src="./assets/flag.png" :scale="0.5" :anchor="[0.1, 0.95]" :size="[128, 128]"></vl-style-icon>
          </vl-style-box>
          <!-- overlay binded to feature -->
          <vl-overlay v-if="feature.geometry" :position="pointOnSurface(feature.geometry)" :offset="[10, 10]">
            <p class="is-light box content">
              Always opened overlay for Feature ID <strong>{{ feature.id }}</strong>
            </p>
          </vl-overlay>
        </template>
      </vl-feature>
      <!--// overlay marker -->

      <!-- base layers -->
      <vl-layer-tile v-for="layer in baseLayers" :key="layer.name" :id="layer.name" :visible="layer.visible">
        <component :is="'vl-source-' + layer.name" v-bind="layer"></component>
      </vl-layer-tile>
      <!--// base layers -->

      <!-- other layers from config -->
      <component v-for="layer in layers" :is="layer.cmp" v-if="layer.visible" :key="layer.id" v-bind="layer">
        <!-- add vl-source-* -->
        <component :is="layer.source.cmp" v-bind="layer.source">
          <!-- add static features to vl-source-vector if provided -->
          <vl-feature v-if="layer.source.staticFeatures && layer.source.staticFeatures.length"
                      v-for="feature in layer.source.staticFeatures" :key="feature.id"
                      :id="feature.id" :properties="feature.properties">
            <component :is="geometryTypeToCmpName(feature.geometry.type)" v-bind="feature.geometry"></component>
          </vl-feature>

          <!-- add inner source if provided (like vl-source-vector inside vl-source-cluster) -->
          <component v-if="layer.source.source" :is="layer.source.source.cmp" v-bind="layer.source.source">
            <!-- add static features to vl-source-vector if provided -->
            <vl-feature v-if="layer.source.source.staticFeatures && layer.source.source.staticFeatures.length"
                        v-for="feature in layer.source.source.staticFeatures" :key="feature.id"
                        :id="feature.id" :properties="feature.properties">
              <component :is="geometryTypeToCmpName(feature.geometry.type)" v-bind="feature.geometry"></component>
            </vl-feature>
          </component>
        </component>

        <component v-if="layer.style" v-for="(style, i) in layer.style" :key="i" :is="style.cmp" v-bind="style">
          <!-- create inner style components: vl-style-circle, vl-style-icon, vl-style-fill, vl-style-stroke & etc -->
          <component v-if="style.styles" v-for="(st, cmp) in style.styles" :key="cmp" :is="cmp" v-bind="st">
            <!-- vl-style-fill, vl-style-stroke if provided -->
            <vl-style-fill v-if="st.fill" v-bind="st.fill"></vl-style-fill>
            <vl-style-stroke v-if="st.stroke" v-bind="st.stroke"></vl-style-stroke>
          </component>
        </component>
        <!--// style -->
      </component>

      <vl-interaction-draw v-if="mapPanel.tab === 'draw' && drawType" source="draw-target" :type="drawType"></vl-interaction-draw>
      <vl-interaction-modify v-if="mapPanel.tab === 'draw'" source="draw-target"></vl-interaction-modify>
      <vl-interaction-snap v-if="mapPanel.tab === 'draw'" source="draw-target" :priority="10"></vl-interaction-snap>
      <!--// draw components -->
    </vl-map>
    <!--// app map -->
    <div class="map-panel">
      <b-collapse class="panel box is-paddingless" :open.sync="panelOpen">
        <div slot="trigger" class="panel-heading">
          <div class="columns">
            <div class="column is-11">
              <strong>Map panel</strong>
            </div>
            <div class="column">
              <b-icon :icon="panelOpen ? 'chevron-up' : 'chevron-down'" size="is-small"></b-icon>
            </div>
          </div>
        </div>
        <p class="panel-tabs">
          <a @click="showMapPanelTab('state')" :class="mapPanelTabClasses('state')">State</a>
          <a @click="showMapPanelTab('layers')" :class="mapPanelTabClasses('layers')">Layers</a>
          <a @click="showMapPanelTab('draw')" :class="mapPanelTabClasses('draw')">Draw</a>
        </p>

        <div class="panel-block" v-show="mapPanel.tab === 'state'">
          <table class="table is-fullwidth">
            <tr>
              <th>Map center</th>
              <td>{{ center }}</td>
            </tr>
            <tr>
              <th>Map zoom</th>
              <td>{{ zoom }}</td>
            </tr>
            <tr>
              <th>Device coordinate</th>
              <td>{{ deviceCoordinate }}</td>
            </tr>
            <tr>
              <th>Selected features</th>
              <td>{{ selectedFeatures.map(f => f.id) }}</td>
            </tr>
          </table>
        </div>

        <div class="panel-block" v-for="layer in layers" :key="layer.id" @click="showMapPanelLayer"
             :class="{ 'is-active': layer.visible }"
             v-show="mapPanel.tab === 'layers'">
          <b-switch :key="layer.id" v-model="layer.visible">
            {{ layer.title }}
          </b-switch>
        </div>

        <div class="panel-block draw-panel" v-show="mapPanel.tab === 'draw'">
          <div class="buttons">
            <button v-for="control in drawControls" :key="control.type || -1" @click="drawType = control.type"
                    :class="drawType && drawType === control.type ? 'is-info' : ''" class="button">
              <b-icon :icon="control.icon"></b-icon>
              <span>{{ control.label }}</span>
            </button>
          </div>
        </div>
      </b-collapse>
    </div>
    <!--// map panel, controls -->

    <!-- base layers switch -->
    <div class="base-layers-panel">
      <div class="buttons has-addons">
        <button class="button is-light" @click="toast()">Запрос о помощи</button>
        <button class="button is-light" @click="showModalAll = true">
          <img src="./assets/icons/all_mini.png">Инициативы
        </button>
      </div>
    </div>
    <b-modal
      v-model="showModal"
      has-modal-card
      trap-focus
      :destroy-on-hide="false"
      aria-role="dialog"
      aria-modal>
      <form action="">
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">Запрос о помощи</p>
            <button
              type="button"
              class="delete"
              @click="showModal = false"/>
          </header>
          <section class="modal-card-body">
            <b-field label="Контактные данные">
              <b-input
                placeholder="Контактные данные"
                required>
              </b-input>
            </b-field>
            <b-field label="Категория">
              <b-select placeholder="Выберите категорию" rounded>
                <option>медицинская помощь</option>
                <option>транспорт</option>
              </b-select>
            </b-field>
            <b-field label="Содержание">
              <b-input maxlength="200" type="textarea"></b-input>
            </b-field>
          </section>
          <footer class="modal-card-foot">
            <button class="button" type="button" @click="showModal = false">Закрыть</button>
            <button class="button is-primary">Сохранить</button>
          </footer>
        </div>
      </form>
    </b-modal>
    <b-modal
      v-model="showModalAll"
      has-modal-card
      trap-focus
      :destroy-on-hide="false"
      aria-role="dialog"
      aria-modal>
      <form action="">
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">Запрос о помощи</p>
            <button
              type="button"
              class="delete"
              @click="showModal = false"/>
          </header>
          <footer class="modal-card-foot">
            <button class="button" type="button" @click="showModalAll = false">Закрыть</button>
            <button class="button is-primary">Сохранить</button>
          </footer>
        </div>
      </form>
    </b-modal>
    <!--// base layers -->
  </div>
</template>

<script>
  import { kebabCase, range, random, camelCase } from 'lodash'
  import { findPointOnSurface, createStyle } from 'vuelayers/lib/ol-ext'
  import predefined from './features'

  const easeInOut = t => 1 - Math.pow(1 - t, 3)

  const methods = {
    camelCase,
    toast () {
      this.showModal = true
    },
    pointOnSurface: findPointOnSurface,
    geometryTypeToCmpName (type) {
      return 'vl-geom-' + kebabCase(type)
    },
    /**
     * Cluster layer style function factory
     * @return {ol.StyleFunction}
     */
    clusterStyleFunc () {
      const cache = {}

      return function __clusterStyleFunc (feature) {
        const size = feature.get('features').length
        let style = cache[size]

        if (!style) {
          style = createStyle({
            imageRadius: 10,
            strokeColor: '#fff',
            fillColor: '#3399cc',
            text: size.toString(),
            textFillColor: '#fff',
          })
          cache[size] = style
        }
        return [style]
      }
    },
    onUpdatePosition (coordinate) {
      this.deviceCoordinate = coordinate
    },
    onMapPostCompose ({ vectorContext, frameState }) {
      if (!this.$refs.marker || !this.$refs.marker.$feature) return

      const feature = this.$refs.marker.$feature
      if (!feature.getGeometry() || !feature.getStyle()) return

      const flashGeom = feature.getGeometry().clone()
      const duration = feature.get('duration')
      const elapsed = frameState.time - feature.get('start')
      const elapsedRatio = elapsed / duration
      const radius = easeInOut(elapsedRatio) * 35 + 5
      const opacity = easeInOut(1 - elapsedRatio)
      const fillOpacity = easeInOut(0.5 - elapsedRatio)

      vectorContext.setStyle(createStyle({
        imageRadius: radius,
        fillColor: [119, 170, 203, fillOpacity],
        strokeColor: [119, 170, 203, opacity],
        strokeWidth: 2 + opacity,
      }))

      vectorContext.drawGeometry(flashGeom)
      vectorContext.setStyle(feature.getStyle()(feature)[0])
      vectorContext.drawGeometry(feature.getGeometry())

      if (elapsed > duration) {
        feature.set('start', Date.now())
      }

      this.$refs.map.render()
    },
    onMapMounted () {
    },
    // map panel
    mapPanelTabClasses (tab) {
      return {
        'is-active': this.mapPanel.tab === tab,
      }
    },
    showMapPanelLayer (layer) {
      layer.visible = !layer.visible
    },
    showMapPanelTab (tab) {
      this.mapPanel.tab = tab
      if (tab !== 'draw') {
        this.drawType = undefined
      }
    },
  }

  export default {
    name: 'vld-demo-app',
    methods,
    data () {
      return {
        predefined,
        center: [ 27.568817138671978, 53.899078973945166 ],
        zoom: 11,
        clickCoordinate: undefined,
        selectedFeatures: [],
        deviceCoordinate: undefined,
        showModal: false,
        showModalAll: false,
        mapPanel: {
          tab: 'state',
        },
        panelOpen: true,
        mapVisible: true,
        drawControls: [
          {
            type: 'point',
            label: 'Draw Point',
            icon: 'map-marker',
          },
          {
            type: 'line-string',
            label: 'Draw LineString',
            icon: 'minus',
          },
          {
            type: 'polygon',
            label: 'Draw Polygon',
            icon: 'square-o',
          },
          {
            type: 'circle',
            label: 'Draw Circle',
            icon: 'circle-thin',
          },
          {
            type: undefined,
            label: 'Stop drawing',
            icon: 'times',
          },
        ],
        drawType: undefined,
        drawnFeatures: [],
        baseLayers: [
          {
            name: 'osm',
            title: 'OpenStreetMap',
            visible: true,
          },
        ],
        // layers config
        layers: [
          // Circles
          {
            id: 'circles',
            title: 'Circles',
            cmp: 'vl-layer-vector',
            visible: false,
            source: {
              cmp: 'vl-source-vector',
              staticFeatures: range(0, 100).map(i => {
                let coordinate = [
                  random(-50, 50),
                  random(-50, 50),
                ]

                return {
                  type: 'Feature',
                  id: 'random-cirlce-' + i,
                  geometry: {
                    type: 'Circle',
                    coordinates: coordinate,
                    radius: random(Math.pow(10, 5), Math.pow(10, 6)),
                  },
                }
              }),
            },
          },
          // Vector layer with clustering
          {
            id: 'cluster',
            title: 'Cluster',
            cmp: 'vl-layer-vector',
            renderMode: 'image',
            visible: false,
            // Cluster source (vl-source-cluster) wraps vector source (vl-source-vector)
            source: {
              cmp: 'vl-source-cluster',
              distance: 50,
              source: {
                cmp: 'vl-source-vector',
                // features defined as array of GeoJSON encoded Features
                // to not overload Vue and DOM
                features: range(0, 10).map(i => {
                  let coordinate = [
                    random(-50, 50),
                    random(-50, 50),
                  ]

                  return {
                    type: 'Feature',
                    id: 'random-' + i,
                    geometry: {
                      type: 'Point',
                      coordinates: coordinate,
                    },
                  }
                }),
              },
            },
            style: [
              {
                cmp: 'vl-style-func',
                factory: this.clusterStyleFunc,
              },
            ],
          },
        ],
      }
    },
  }
</script>

<style lang="sass">
  @import ~bulma/sass/utilities/_all

  html, body, #app
    width: 100%
    height: 100%
    margin: 0
    padding: 0

  .vld-demo-app
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
