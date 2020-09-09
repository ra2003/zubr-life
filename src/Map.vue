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
                            <vl-style-icon src="/img/icons/marker.png" :scale="0.4" :anchor="[0.5, 1]"></vl-style-icon>
                        </vl-style-box>
                    </vl-feature>
                </template>
            </vl-geoloc>
            <vl-layer-tile id="osm">
                <vl-source-osm></vl-source-osm>
            </vl-layer-tile>
            <vl-interaction-select
                :features.sync="selectedFeatures"
                @select="handleSelect"
                v-if="drawing === false">
                <template slot-scope="select">
                    <vl-style-box>
                        <vl-style-stroke color="#423e9e" :width="7"></vl-style-stroke>
                        <vl-style-circle :radius="15">
                            <vl-style-stroke color="#00A896" :width="7"></vl-style-stroke>
                            <vl-style-fill :color="[254, 178, 76, 0.7]"></vl-style-fill>
                        </vl-style-circle>
                    </vl-style-box>
                    <vl-style-box :z-index="1">
                        <vl-style-stroke color="#00A896" :width="1"></vl-style-stroke>
                    </vl-style-box>
                    <vl-overlay class="feature-popup"
                                v-for="feature in select.features"
                                :key="feature.id"
                                :id="feature.id"
                                :position="findPointOnSurface(feature.geometry)"
                                :auto-pan="true"
                                :auto-pan-animation="{ duration: 300 }">
                        <template>
                            <section class="card" v-if="feature.id !== 'position-feature'">
                                <header class="card-header">
                                    <p class="card-header-title">
                                        <span v-if="feature.properties.features">
                                            {{categories[feature.properties.features[0].properties.category]}}
                                        </span>
                                        <span v-else>
                                            {{categories[feature.properties.category]}}
                                        </span>
                                    </p>
                                    <a class="card-header-icon" title="Close"
                                       @click="selectedFeatures = selectedFeatures.filter(f => f.id !== feature.id)">
                                        <b-icon icon="close"></b-icon>
                                    </a>
                                </header>
                                <div class="card-content">
                                    <div class="content" v-if="feature.properties.features" style="padding-bottom: 10px;line-height: 22px">
                                        <div :key="item.id"
                                             v-for="(item,key) of feature.properties.features">
                                            <span v-if="item.properties.contact">
                                                Контакт: <span v-html="item.properties.contact"></span>
                                                <br>
                                            </span>
                                            <span v-if="item.properties.links.length > 0">
                                                Ссылки:
                                                <a :href="link.indexOf('@') !== -1 ? 'mailto:' + link : link"
                                                   target="_blank"
                                                   style="padding-left: 4px"
                                                   v-for="link of item.properties.links" :key="link">
                                                    {{link}}
                                                </a>
                                                <br>
                                            </span>
                                            <span v-if="item.properties.phones.length > 0">
                                                Телефоны:
                                                <a :href="'tel:' + phone"
                                                   :key="phone"
                                                   style="padding-left: 3px"
                                                   v-for="phone of item.properties.phones">{{phone}}</a>
                                                <br>
                                            </span>

                                            <span>Описание: {{item.properties.description}}</span>
                                            <br>
                                            <span v-if="item.properties.address">Адрес: {{item.properties.address}}</span>
                                            <hr v-if="key !== feature.properties.features.length - 1">
                                        </div>
                                    </div>
                                    <div class="content" v-else style="padding-bottom: 10px">
                                        <span v-if="feature.properties.contact">
                                            Контакт: <span v-html="feature.properties.contact"></span>
                                            <br>
                                        </span>
                                        <span v-if="feature.properties.links.length > 0">
                                            Ссылки:
                                            <a :href="item.indexOf('@') !== -1 ? 'mailto:' + item : item"
                                               target="_blank"
                                               style="padding-left: 4px"
                                               v-for="item of feature.properties.links" :key="item">
                                                {{item}}
                                            </a>
                                            <br>
                                        </span>
                                        <span v-if="feature.properties.phones.length > 0">
                                            Телефоны:
                                            <a :href="'tel:' + phone"
                                               :key="phone"
                                               style="padding-left: 3px"
                                               v-for="phone of feature.properties.phones">{{phone}}</a>
                                            <br>
                                        </span>

                                        <span>Описание: {{feature.properties.description}}</span>
                                        <br>
                                        <span v-if="feature.properties.address">Адрес: {{feature.properties.address}}</span>
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
            <vl-layer-vector v-for="(items, key) in map['proposal']" :key="key">
                <vl-source-cluster :distance="85" v-if="filter.categories.includes(key)">
                    <vl-source-vector :features.sync="items"></vl-source-vector>
                    <vl-style-func :factory="clusterStyleFunc(key, 'proposal')"/>
                </vl-source-cluster>
            </vl-layer-vector>
            <vl-layer-vector v-for="(items, key) in telegramChats" :key="key">
                <vl-source-cluster :distance="85" v-if="filter.categories.includes(key)">
                    <vl-source-vector :features.sync="items"></vl-source-vector>
                    <vl-style-func :factory="clusterStyleFunc(key, 'proposal')"/>
                </vl-source-cluster>
            </vl-layer-vector>
            <vl-layer-vector id="draw-pane">
                <vl-source-vector ident="draw-target" :features.sync="drawnFeatures"></vl-source-vector>
                <vl-style-box>
                    <vl-style-circle :radius="15">
                        <vl-style-fill color="white"></vl-style-fill>
                        <vl-style-stroke color="red"></vl-style-stroke>
                    </vl-style-circle>
                </vl-style-box>
            </vl-layer-vector>
            <vl-feature v-for="item of liveFeatures"
                        :key="item.id"
                        :properties="item.properties">
                <template slot-scope="feature">
                    <vl-geom-point :coordinates="item.geometry.coordinates"></vl-geom-point>
                    <vl-style-func :factory="pointStyle"/>
                </template>
            </vl-feature>
            <vl-interaction-draw source="draw-target"
                                 :condition="condition"
                                 :active="drawing"
                                 :type="'point'"></vl-interaction-draw>
        </vl-map>

        <div class="toolbar-panel" v-show="drawing === false">
            <div class="buttons has-addons toolbar-buttons">
                <b-button type="is-orange"
                          @click="requestModal = true"
                          size="is-medium"
                          outlined
                          icon-right="plus"/>
                <b-button type="is-orange"
                          outlined
                          size="is-medium"
                          @click="infoModal = true"
                          icon-right="exclamation"/>
                <b-button type="is-orange"
                          outlined
                          size="is-medium"
                          @click="filterModal = true"
                          icon-right="filter"/>
                <b-button type="is-orange"
                          outlined
                          size="is-medium"
                          @click="helpModal = true"
                          icon-right="question"/>
            </div>
        </div>
        <div class="logo-panel" style="width: 5em">
            <img src="/img/logos/zubr-text.png">
        </div>
        <div class="map-panel" v-show="drawing">
            <div class="panel-block">
                <table class="table is-fullwidth">
                    <tr v-show="drawnFeatures.length > 0">
                        <th>
                            <b-button type="is-success" icon-left="check" @click="finishDrawing">
                                Сохранить
                            </b-button>
                        </th>
                        <th>
                            <b-button type="is-info" @click="resetDrawnPoint">
                                Редактировать
                            </b-button>
                        </th>
                    </tr>
                    <tr>
                        <th colspan="2">
                            <b-button type="is-orange"
                                      @click="cancelDrawing"
                                      style="width: 100%">
                                Отмена
                            </b-button>
                        </th>
                    </tr>
                </table>
            </div>
        </div>
        <b-modal
            v-model="requestModal"
            has-modal-card
            trap-focus
            :destroy-on-hide="false"
            aria-role="dialog"
            aria-modal>
            <form action="" @submit.prevent="save">
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Запрос о помощи</p>
                        <button
                            type="button"
                            class="delete"
                            @click="requestModal = false"/>
                    </header>
                    <section class="modal-card-body">
                        <b-message>
                            По вопросам <a href="https://t.me/zubr_info_bot" target="_blank">@zubr_info_bot</a>
                        </b-message>
                        <b-field label="Тип">
                            <b-radio-button v-model="request.type"
                                            native-value="demand"
                                            type="is-orange">
                                <span>Просьба</span>
                            </b-radio-button>
                            <b-radio-button v-model="request.type"
                                            native-value="proposal"
                                            type="is-success">
                                <span>Предложение</span>
                            </b-radio-button>
                        </b-field>
                        <b-field label="Телефон" v-show="request.category !== 'telegram'">
                            <b-input
                                v-model="request.phone"
                                placeholder="Контактные данные"
                                required>
                            </b-input>
                        </b-field>
                        <b-field label="Email/Ссылка">
                            <b-input placeholder="Email/Ссылка" v-model="request.link">
                            </b-input>
                        </b-field>
                        <b-field label="Категория">
                            <b-select v-model="request.category" required>
                                <option v-for="(item,key) in categories"
                                        :key="key"
                                        :value="key">{{item}}
                                </option>
                            </b-select>
                        </b-field>
                        <b-field label="Адрес">
                            <b-input placeholder="адрес" v-model="request.address">
                            </b-input>
                        </b-field>
                        <b-field label="Контактное лицо">
                            <b-input placeholder="Контактное лицо" v-model="request.contact">
                            </b-input>
                        </b-field>
                        <b-field label="Месторасположение">
                            <b-radio-button v-model="location_type"
                                            :disabled="!(Array.isArray(deviceCoordinate) && deviceCoordinate.length === 2)"
                                            native-value="current_location"
                                            type="is-orange">
                                <span>Текущее местоположение</span>
                            </b-radio-button>
                            <b-radio-button v-model="location_type"
                                            native-value="set_point"
                                            type="is-orange">
                                <span>Метка на карте</span>
                            </b-radio-button>
                        </b-field>
                        <b-field label="Описание" required>
                            <b-input maxlength="300" type="textarea" v-model="request.description"></b-input>
                        </b-field>
                    </section>
                    <footer class="modal-card-foot">
                        <button class="button" type="button" @click="requestModal = false">Закрыть</button>
                        <button class="button is-primary" @submit.prevent="save">Сохранить</button>
                    </footer>
                </div>
            </form>
        </b-modal>
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
                             v-for="(item, key) of categories"
                             :key="key">
                            <b-checkbox v-model="filter.categories"
                                        :native-value="key">
                                {{item}}
                            </b-checkbox>
                        </div>
                        <div class="field"
                             v-for="(item, key) of additionalCategories"
                             :key="key">
                            <b-checkbox v-model="filter.categories"
                                        :native-value="key">
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
        <b-modal
            v-model="helpModal"
            has-modal-card
            trap-focus
            :on-cancel="closeHelpModal"
            :destroy-on-hide="false"
            aria-role="dialog"
            aria-modal>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title" style="text-align: center;font-size: 1.3rem;">Помощь</p>
                    <button
                        type="button"
                        class="delete"
                        @click="closeHelpModal"/>
                </header>
                <section class="modal-card-body">
                    <b-carousel :autoplay="false">
                        <b-carousel-item>
                            <section class="carousel-1">
                                <div style="margin: auto;width: 16em;">
                                    <img src="/img/logos/life.svg">
                                </div>
                                <p>
                                    Инициатива <strong>ZUBR.life</strong> была создана командой ZUBR для помощи людям,
                                    оказавшимся в затруднительном положении,
                                    связанном со своей гражданской позицией. На карте отображаются условными
                                    знаками <span style="color:#d74e4e">красного</span> цвета запросы о помощи
                                    и <span style="color:green">зеленого</span> цвета - предложения о помощи
                                    от частных компаний и физических лиц.
                                </p>
                            </section>
                        </b-carousel-item>
                        <b-carousel-item>
                            <section class="carousel-2">
                                <h3><strong>Используемые категории приложения</strong></h3>
                                <ul>
                                    <li>
                                        <u>telegram</u> — региональные чаты для коммуникации с жителями вашей местности;
                                    </li>
                                    <li>
                                        <u>жилье</u> — запросы и предложения о помощи с временным или постоянным жильем пострадавшим людям и людям, оказавшимся в сложной ситуации;
                                    </li>
                                    <li>
                                        <u>иное</u> — иные запросы и предложения о помощи, не включенные в основные категории карты;
                                    </li>
                                    <li>
                                        <u>медпомощь</u> — бесплатная или с частичной оплатой медицинская помощь от клиник и частных врачей;
                                    </li>
                                    <li>
                                        <u>образование</u> — частные учреждения образования и компании, предлагающие переобучение/переквалификацию;
                                    </li>
                                    <li>
                                        <u>продукты питания</u> — помощь продуктами питания от фермеров и кафе/ресторанов;
                                    </li>
                                    <li>
                                        <u>транспорт</u> — помощь с перевозкой людей/грузов, ремонт авто и велосипедов, пострадавших в период протестов
                                    </li>
                                </ul>
                            </section>
                        </b-carousel-item>
                        <b-carousel-item>
                            <section class="carousel-3">
                                <p>
                                    <b-button
                                        type="is-orange"
                                        size="is-small"
                                        outlined
                                        icon-left="plus"></b-button>
                                    - Вызов формы для заполнения запроса или отправки
                                    предложения о взаимопомощи.
                                    Указать свое место нахождения в форме можно через текущую геопозицию или на карте.
                                    Чем больше данных, тем оперативнее связь и помощь.
                                </p>
                                <p>
                                    <b-button type="is-orange"
                                              size="is-small"
                                              outlined
                                              icon-right="exclamation"/>
                                    - Информация и контактные данные основных инициатив по помощи
                                    как в Беларуси, так и за её пределами.
                                </p>
                                <p>
                                    <b-button type="is-orange"
                                              size="is-small"
                                              outlined
                                              icon-right="filter"/>
                                    - Фильтр отображения маркеров карты.
                                </p>
                            </section>
                        </b-carousel-item>
                    </b-carousel>
                </section>
            </div>
        </b-modal>
    </div>
</template>
<script>
    import predefined                from './features.json'
    import chats                     from './markers.json'
    import favourites                from './favourites'
    import {findPointOnSurface}      from 'vuelayers/lib/ol-ext'
    import {Fill, Style, Text, Icon} from 'ol/style';

    const categories           = {
        'telegram' : 'telegram',
        'housing'  : 'жилье',
        'other'    : 'иное',
        'health'   : 'медицинская помощь',
        'education': 'образование',
        'food'     : 'продукты питания',
        'transport': 'транспорт',
        'job'      : 'работа',
    };
    const additionalCategories = {
        'telegram_microdistrict': 'telegram - Микрорайон',
        'telegram_recall'       : 'telegram - Отзыв депутата',
    };


    const apiURL = process.env.VUE_APP_API_URL;

    function setCookie(name, value) {
        let options = {
            path     : '/',
            secure   : true,
            'max-age': 36000000,
            SameSite : 'strict'
        };

        if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString();
        }

        let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

        for (let optionKey in options) {
            updatedCookie += "; " + optionKey;
            let optionValue = options[optionKey];
            if (optionValue !== true) {
                updatedCookie += "=" + optionValue;
            }
        }

        document.cookie = updatedCookie;
    }

    function issetCookie(name) {
        return document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([.$?*|{}()[]\\\/+^])/g, '\\$1') + "=([^;]*)"
        )) !== null;
    }

    let map = {
        proposal: {}
    };

    for (let item of predefined) {
        if (!map['proposal'][item.properties.category]) {
            map['proposal'][item.properties.category] = [];
        }
        map['proposal'][item.properties.category].push(item)
    }

    export default {
        methods: {
            clusterStyleFunc(category, type) {
                return () => {
                    const cache = {}

                    return function __clusterStyleFunc(feature) {
                        const size = feature.get('features').length
                        let style  = cache[size]

                        if (!style) {
                            let params = {
                                font: '14px sans-serif',
                                fill: new Fill({
                                    color: 'black',
                                }),
                            };

                            if (size > 1) {
                                params['offsetX'] = 15;
                                params['offsetY'] = -15;

                                params['backgroundFill'] = new Fill({
                                    color: '#ffe980',
                                })
                                params['text']           = size.toString()
                            } else if (category === null && size === 1) {
                                category = feature.getProperties().features[0].getProperties().category;
                            }
                            if (category === null) {
                                category = 'other';
                            }
                            if (type === null) {
                                type = 'proposal';
                            }
                            let name = `${type}_${category}`;
                            if (category.substring(0, 8) === 'telegram') {
                                name = 'telegram'
                            }
                            style = new Style({
                                image: new Icon({
                                    scale  : 0.41,
                                    opacity: 0.75,
                                    src    : `/img/icons/${name}.png`,
                                }),
                                text : new Text(params),
                            })

                            cache[size] = style
                        }
                        return [style]
                    }
                }

            },
            pointStyle() {
                const cache = {}

                return function __pointStyle(feature) {
                    const size   = 1;
                    let style    = cache[size];
                    let category = feature.getProperties().category
                    let type     = feature.getProperties().type
                    let params   = {
                        font: '14px sans-serif',
                        fill: new Fill({
                            color: 'rgb(255,255,255)',
                        }),
                    };

                    if (type === null) {
                        type = 'proposal';
                    }
                    if (!style) {
                        let name = `${type}_${category}`;
                        if (category.substring(0, 8) === 'telegram') {
                            name = 'telegram'
                        }
                        style       = new Style({
                            image: new Icon({
                                scale  : 0.41,
                                opacity: 0.75,
                                src    : `/img/icons/${name}.png`,
                            }),
                            text : new Text(params),
                        })
                        cache[size] = style
                    }
                    return [style]
                }

            },
            closeHelpModal() {
                if (!issetCookie('onboarding')) {
                    setCookie('onboarding', true)
                }
                this.helpModal = false;
            },
            resetDrawnPoint() {
                this.drawnFeatures = [];
            },
            cancelDrawing() {
                this.drawing       = false
                this.drawnFeatures = [];
                this.location_type = '';
            },
            finishDrawing() {
                this.drawing       = false;
                this.requestModal  = true;
                this.location_type = 'set_point';
            },
            condition() {
                return this.drawnFeatures.length < 1;
            },
            interactionMode() {
                this.requestModal = false;
                this.drawing      = true;
            },
            findPointOnSurface,
            onUpdatePosition(coordinate) {
                this.deviceCoordinate = coordinate
                if (!this.location_type) {
                    this.location_type = 'current_location';
                }
            },
            save() {
                if (!this.location_type) {
                    this.$buefy.notification.open({
                        message : 'Выберите месторасположение',
                        type    : 'is-orange',
                        duration: 5000,
                    })
                    return;
                }
                if (!this.request.type) {
                    this.$buefy.notification.open({
                        message : 'Укажите тип',
                        type    : 'is-orange',
                        duration: 5000,
                    })
                    return;
                }
                this.createFeature();
            },
            createFeature() {
                let data = Object.assign({}, this.request)
                if (this.location_type === 'set_point') {
                    data.longitude = this.drawnFeatures[0].geometry.coordinates[0];
                    data.latitude  = this.drawnFeatures[0].geometry.coordinates[1];
                } else {
                    data.longitude = this.deviceCoordinate[0];
                    data.latitude  = this.deviceCoordinate[1];
                }

                fetch(apiURL + '/request',
                    {
                        method : 'POST',
                        headers: {'Content-Type': 'application/ld+json', 'Accept': 'application/ld+json'},
                        body   : JSON.stringify(data)
                    }
                )
                    .then(r => {
                        if (!r.ok) {
                            this.$buefy.notification.open({
                                message : 'Произошла ошибка',
                                type    : 'is-orange',
                                duration: 5000,
                            })
                            return;
                        }
                        r.json().then((r) => {
                            if (r.error) {
                                this.$buefy.notification.open({
                                    message : r.error,
                                    type    : 'is-orange',
                                    duration: 5000,
                                })
                                return;
                            }
                            this.drawnFeatures = [];
                            this.loadFeatures()
                            this.location_type = 'current_location';
                            this.$buefy.notification.open({
                                message : 'Успешно сохранено',
                                type    : 'is-success',
                                duration: 5000,
                            })
                            this.requestModal = false;

                        }).catch(e => {
                            this.$buefy.notification.open({
                                message : 'Произошла ошибка',
                                type    : 'is-orange',
                                duration: 5000,
                            })
                            throw e;
                        })


                    })
                    .catch(e => {
                        this.$buefy.notification.open({
                            message : 'Произошла ошибка,возможно есть проблемы с соединением, попробуйте воспользоваться VPN или ботом',
                            type    : 'is-orange',
                            duration: 5000,
                        })
                        throw e;
                    })
            },
            loadFeatures() {
                fetch(apiURL + '/requests',
                    {headers: {'Content-Type': 'application/ld+json'}}
                )
                    .then(r => r.json())
                    .then(r => {
                        this.remoteFeatures = r.data;
                    })
            },
            handleSelect(feature) {
                let properties = feature.getProperties();
                if (!properties) {
                    return;
                }
                if (!properties.category) {
                    return;
                }
                if (this.zoom < 14) {
                    this.zoom = 14;
                }
            },
        },
        filters: {
            formatContact(value) {
                return value.indexOf('http') !== 0 && value.indexOf(':') !== false
                    ? value.split(':')[1]
                    : value
            }
        },

        data() {
            return {
                center          : [27.568817138671978, 53.899078973945166],
                additionalCategories,
                zoom            : 9,
                map,
                categories,
                telegramChats   : chats['markers'].map(
                    item => {
                        return {
                            id        : item.link,
                            type      : 'Feature',
                            properties: {
                                links      : [item.link],
                                description: item.name,
                            },
                            geometry  : {
                                type       : 'Point',
                                coordinates: [item.lat, item.long]
                            }
                        }
                    }
                )
                ,
                selectedFeatures: [],
                remoteFeatures  : [],
                filterModal     : false,
                infoModal       : false,
                helpModal       : !issetCookie('onboarding'),
                requestModal    : false,
                deviceCoordinate: undefined,
                drawType        : undefined,
                progress        : true,
                drawnFeatures   : [],
                progressType    : 'is-primary',
                drawing         : false,
                location_type   : '',
                request         : {
                    type       : '',
                    category   : '',
                    phone      : '',
                    address    : '',
                    contact    : '',
                    link       : '',
                    description: '',
                },
                filter          : {
                    categories: [
                        'telegram',
                        'telegram_microdistrict',
                        'housing',
                        'health',
                        'food',
                        'education',
                        'other'
                    ]
                },
                favourites
            }
        },
        computed: {
            liveFeatures() {
                return this.remoteFeatures.filter(item => this.filter.categories.includes(item.properties.category));
            }
        },
        created() {
            this.loadFeatures();
        },
        mounted() {
            setInterval(this.loadFeatures, 45000)
        },
        watch   : {
            location_type(val) {
                if (val === 'set_point') {
                    this.interactionMode();
                } else {
                    this.drawnFeatures = [];
                }
            },
            deviceCoordinate(val, old) {
                if (old === undefined) {
                    this.zoom   = 14;
                    this.center = val
                }
            }
        }
    }
</script>
<style lang="sass">
    @use "sass:map"
    @import ~bulma/sass/utilities/_all

    $orange: hsl(24, 85%, 48%) !default
    $link-hover: $orange
    $success: #00A896


    $colors: mergeColorMaps($colors, ("orange" : ($orange, $white), "primary" : ($orange, $primary-invert), "success" : ($success, $success-invert)))

    @import ~buefy/src/scss/buefy-build

    .toolbar-buttons
        background-color: $white

        button
            margin-bottom: 0 !important

    .carousel-arrow .icon.has-icons-left
        left: 0.5rem

    .carousel-arrow .icon.has-icons-right
        right: 0.5rem

    .carousel-1
        word-break: break-word
        padding-bottom: 2em
        +desktop
            padding: 0 1em 2.3em 2.3em

    .carousel-2
        padding-bottom: 2em
        word-break: break-word
        +desktop
            padding: 0 0 2em 2.7em

    .carousel-3
        padding-bottom: 2em
        word-break: break-word
        line-height: 28px
        +desktop
            padding: 0 0 2em 3em

    html, body, #map
        width: 100%
        height: 100%
        margin: 0
        padding: 0

    .map-main
        position: relative

        .logo-panel
            padding: 0
            position: absolute
            top: 1em
            right: 1em

        .map
            height: 100%
            width: 100%

        .map-panel
            padding: 0
            position: absolute
            top: 40px
            left: 50%
            transform: translateX(-50%)

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
            bottom: 130px
            width: 197px
            transform: translateX(-50%)

            +desktop
                bottom: 40px

        .feature-popup
            position: absolute
            left: -47px
            bottom: 12px
            max-width: none
            width: 50vh
            z-index: 2

            &:after, &:before
                top: 100%
                border: solid transparent
                content: ' '
                height: 0
                width: 0
                position: absolute
                pointer-events: none
                left: -30px

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
                word-break: keep-all

            +desktop
                width: 23em
</style>
