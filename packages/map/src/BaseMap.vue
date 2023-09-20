<template>
  <div class="wafer-map fill" v-loading="drawing" :class="fullClass"
       @mouseover="handleEnterMap"
       @mouseout="handleLeaveMap"
  >
    <section class="map-box" :style="mapBoxStyle">
      <div class="map-box-header">
        <div>&nbsp;<span v-if="mapOption.showTitle">{{ mapTitle }}</span></div>
        <div class="tool-box" v-show="showTool" v-if="mapOption.showTool !== false">
          <i :title="isFull ? '退出放大' : '放大显示'" :class="isFull ? 'el-icon-aim' : 'el-icon-full-screen'" @click="handleFullScreen"></i>
          <el-tooltip
            content="取消选择"
            class="inline-block"
            placement="top"
          >
            <i class="el-icon-refresh-right" @click.stop.prevent="clearSelectedDie"></i>
          </el-tooltip>

          <el-tooltip
            :content="showGrid ? '隐藏网格' : '显示网格'"
            class="inline-block"
            placement="top"
          >
            <i class="el-icon-s-grid" @click.stop.prevent="changeShowGrid" :class="showGrid ? '' : 'not-show'"></i>
          </el-tooltip>

          <el-tooltip
            v-if="mapOption.showHideTool !== false"
            content="显示点"
            class="inline-block"
            placement="top"
          >
            <svg-icon
              @click.stop.prevent="showHidedDie"
              iconClass="show"></svg-icon>
          </el-tooltip>

          <el-tooltip
            v-if="mapOption.showHideTool !== false"
            content="隐藏点"
            class="inline-block"
            placement="top"

          >
            <svg-icon
              @click.stop.prevent="hideDie"
              iconClass="hide"></svg-icon>
          </el-tooltip>

          <el-tooltip
            :content="zoneVisible ? '隐藏 Zone' : '显示 Zone'"
            class="inline-block"
            placement="top"
            v-if="mapOption.showZone"
          >
            <i
              @click.stop.prevent="toggleShowZone"
              class="el-icon-s-marketing"
              :style="{color: !zoneVisible ? '#c0c0c0' : ''}"
            ></i>
          </el-tooltip>
          <el-tooltip
            :content="showZoneAnalysis ? '隐藏 Zone 分析' : '显示 Zone 分析'"
            class="inline-block"
            placement="top"
          >
            <i
              @click.stop.prevent="toggleShowZoneAnalysis"
              class="el-icon-s-data"
              :style="{color: !showZoneAnalysis ? '#c0c0c0' : ''}"
              v-if="visibleZoneAnalysis"
            ></i>
          </el-tooltip>
          <el-tooltip :content="(showDetail?'关闭':'打开') + '详情面板'" class="inline-block" placement="top">
            <i @click.stop.prevent="openDetail" class="el-icon-s-fold" :style="{transform: showDetail ? 'rotate(180deg)' : ''}"></i>
          </el-tooltip>
        </div>
      </div>
      <div class="map-box-main" ref="container"></div>
      <div  class="map-box-footer">
        <div class="footer-left">
          <el-tooltip content="标尺" v-if="mapOption.showMapRuler">
            <RulerBox :ruler="ruler" :style="transformStyle"></RulerBox>
          </el-tooltip>
          <el-tooltip content="还原" class="inline-block">
            <i @click.stop.prevent="handleReset" class="el-icon-refresh-right"></i>
          </el-tooltip>
        </div>
        <div>&nbsp;</div>
      </div>
    </section>
    <base-detail
      v-show="showDetail"
      class="detail-box"
      :mapOption="mapOption"
      :mapProperty="mapProperty"
      :defectCodes="defectCodes"
      :aggregateField="aggregateField"
      :mapTitle="mapTitle"
      @onSelectDefectCode="onSelectDefectCode"
      @onSelectShape="onSelectShape"
      @onReverseAggColor="handleReverseAggColor"
      :colorGroup="sourceAggregateData.colorGroupShow || []"
      v-bind="$attrs"
      v-on="$listeners"
    ></base-detail>
  </div>
</template>

<script>
import { isDefectMap, isWaferMap } from './utils/map';
import BaseDetail from './BaseDetail';
import { registerPlugin } from '../../../src/utils/config';
import MapTip from './MapTip';
import RulerBox from './config/RulerBox';

import { drawMap } from './utils/pxDraw';

registerPlugin({
  type: 'use',
  instance: MapTip,
});

export default {
  name: 'base-map',
  components: {
    BaseDetail,
    RulerBox,
  },
  props: {
    mapProperty: {
      type: Object,
      required: true,
      default: () => ({})
    },
    /**
       * **父组件中 不要放在data里面**
       * 按zone区分的base数据，是为了方便查找
       * {
       *   zoneId: {
       *     diex_diey: {
              "leftx": -149.6525,
              "topy": 8.0375,
              "diey": 27,
              "diex": 1,
              "zoneId": 1,
              "colorCode": "#247ba0",
              "bottomy": 2.7325,
              "zoneName": "Zone 1",
              "rightx": -144.8975
       *     },
       *     diex_diey: {},
       *   }
       * }
       */
    baseData: {
      type: Object,
      required: true,
    },
    isBaseDataChange: Boolean,
    /**
       * sourceAggregateData
       */
    sourceAggregateData: {
      type: Object,
      default: () => ({}),
    },
    isAggregateDataChange: Boolean,
    sourceDefectData: {
      type: Array,
      default: () => [],
    },
    zoneAnalysisData: Array,
    zoneBorderDies: Array,
    zoneData: {
      type: Object,
      default: () => ({}),
    },
    mapOption: {
      required: true,
      type: Object,
      default: () => ({}),
    },
    componentData: {
      type: Object,
      default: () => ({}),
    },
    // die 上面显示信息
    showFields: {
      type: Array,
      default: () => [
        {
          display: 'Die_X',
          field: 'diex',
        },
        {
          display: 'Die_Y',
          field: 'diey',
        },
      ],
    },
    showDefectFields: {
      type: Array,
      default: () => {
        const fields = ['coorx',
          'coory',
          'diex',
          'diey',
          'defectCode',
          'defectSize'
        ];

        return fields.map((name) => ({
          display: name.replace(/^(\w)/, (itm) => itm.toUpperCase()),
          field: name,
        }));
      },
    },
    showDieGrid: {
      type: Boolean,
      default: true,
    },
    // 是否可以框选
    canBoxChoose: {
      type: Number,
      default: 1, // 0不可以，1单次框选，2多次框选
    },
    // 是否可以单个选择
    canSingleChoose: {
      type: Boolean,
      default: true,
    },
    // 是否显示image defect 标记
    showDefectImg: {
      type: Boolean,
      default: true,
    },
    // 是否显示defect Die标记
    showDefectDie: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    this._watch = {
      detailVisiable: this.handleDetailVisiable,
      zoneVisible: this.handleZoneVisible,
      zoneAnalysisVisible: this.handleZoneAnalysisVisible,
    };

    this.id = `dmap${this.$lodash.uniqueId()}`;
    this.objDraw = null;

    return {
      showTool: true, // 操作当前map时显示工具栏
      drawing: true,
      // 是否显示详情
      showDetail: this.mapOption.detailVisiable,
      zoneVisible: this.mapOption.zoneVisible,
      showZoneAnalysis: this.mapOption.zoneAnalysisVisible,
      showSetting: true, // 是否显示形状设置

      enableOverlay: this.mapOption.enableOverlay,
      showGrid: this.showDieGrid,

      tips: {
        info: [],
        position: {
          left: '0px',
          top: '0px',
        },
        visiable: false,
      },
      isFull: false,
    };
  },

  computed: {
    mapBoxStyle() {
      let rightWidth = 0;
      if (this.showDetail) {
        rightWidth += 180;
      }
      if (this.zoneVisible) {
        rightWidth += 200;
      }

      if (rightWidth > 0) {
        if (this.$el && this.$el.getBoundingClientRect().width < rightWidth + 50) {

        }
      }
      return {
        display: 'inline-block',
        width: rightWidth === 0 ? '100%' : `calc(100% - ${rightWidth}px)`
      };
    },
    fullClass() {
      return this.isFull ? 'full-view' : '';
    },
    transformStyle() {
      if (!this.mapOption.reverseDieX && !this.mapOption.reverseDieY) return;
      let scale = '';
      if (this.mapOption.reverseDieX && this.mapOption.reverseDieY) {
        scale = 'scale(-1, -1)';
      } else if (this.mapOption.reverseDieX) {
        scale = 'scale(-1, 1)';
      } else if (this.mapOption.reverseDieY) {
        scale = 'scale(1, -1)';
      }
      return {
        transform: scale,
      };
    },
    setting() {
      return this.showSetting
        ? ['circle', 'cross', 'ring', 'square', 'star', 'triangle', 'invertedTriangle'].map((val) => {
          const firstUp = val.replace(/^(\w)/, (item) => item.toUpperCase());
          return {
            value: val,
            label: firstUp,
            icon: `<svg style="height: 1em; width: 1em;fill: #f55858" aria-hidden="true" class="svg-icon"><use xlink:href="#icon-${val}"></use></svg> `,
          };
        }) : [];
    },
    ruler() {
      return this.mapProperty.posX ? (this.mapProperty.posX + this.mapProperty.posY) : 'RU';
    },
    defectCodes() {
      const dcodes = {};
      this.sourceDefectData.forEach(data => {
        data.defectCodes && data.defectCodes.forEach(item => {
          dcodes[item.defectCode] = item;
        });
      });
      return Array.from(Object.values(dcodes));
    },
    zoneAnalysis() {
      const field = this.sourceAggregateData.aggregateField;
      return this.mapOption.zoneAnalysis && this.mapOption.zoneAnalysis[field] || field;
    },
    aggregateField() {
      const field = this.sourceAggregateData.aggregateField;
      if (this.hasComponentData && field) {
        const series = this.componentData.option.series?.series?.find(item => item.name === field);
        if (series) {
          return series.aliasName || field;
        }
      }
      return field;
    },
    hasComponentData() {
      return !!(this.componentData && this.componentData.option);
    },
    componentMapOption() {
      return this.hasComponentData ? (this.componentData.option.mapOption || this.componentData.option.MapOption) : null;
    },
    componentDetailVisiable() {
      return (this.componentMapOption) ? this.componentMapOption.detailVisiable : null;
    },
    componentZoneVisible() {
      return (this.componentMapOption) ? this.componentMapOption.zoneVisible : null;
    },
    componentZoneAnalysisVisible() {
      return (this.componentMapOption) ? this.componentMapOption.zoneAnalysisVisible : null;
    },
    _isWaferMap() {
      return isWaferMap(this.mapOption.mapType);
    },
    _isDefectMap() {
      return isDefectMap(this.mapOption.mapType);
    },
    mapTitle() {
      if (this._isWaferMap) {
        if (this.sourceAggregateData.splitField) {
          return this.sourceAggregateData.splitField
            .replace(this.mapProperty.productId, '')
            .replace(/^_/, '');
        }
      } else {
        if (this.sourceDefectData && this.sourceDefectData.length === 1) {
          const defectData = this.sourceDefectData[0];
          return defectData.splitField
            .replace(defectData.productId, '')
            .replace(/^_/, '');
        }
      }
      return '';
    },
    // 是否需要zone分析
    visibleZoneAnalysis() {
      return this.mapOption.showZoneAnalysis !== false && (this._isWaferMap || (!this._isWaferMap && this.enableOverlay));
    },
  },

  watch: {
    isBaseDataChange(val) {
      if (val) {
        this._debounceRedraw();
      }
    },
    isAggregateDataChange(val) {
      if (val) {
        this._debounceRedraw();
      }
    },
    showDieGrid: {
      handler(val) {
        this.showGrid = val;
        this.changeDieGrid = true;
        this.drawDieStroke();
      }
    },
    showDefectImg: {
      handler() {
        this.hideShowDefectImg();
      }
    },
    'mapOption.detailVisiable': {
      handler(val) {
        this._watch.detailVisiable(val);
      },
    },
    'mapOption.zoneVisible': {
      handler(val) {
        this._watch.zoneVisible(val);
      }
    },
    'mapOption.zoneAnalysisVisible': {
      handler(val) {
        this._watch.zoneAnalysisVisible(val);
      }
    },
    componentDetailVisiable: {
      handler(val) {
        this._watch.detailVisiable(val);
      },
    },
    componentZoneVisible: {
      handler(val) {
        this._watch.zoneVisible(val);
      }
    },
    componentZoneAnalysisVisible: {
      handler(val) {
        this._watch.zoneAnalysisVisible(val);
      }
    },
    showDefectDie: {
      handler() {
        this.hideShowDefectDie();
      }
    }
  },

  created() {
    this._debounceResize = this.$lodash.debounce(() => {
      this.handleReset();
    }, 300);

    this._debounceRedraw = this.$lodash.debounce(() => {
      this.startDraw();
    }, 300);
  },

  mounted() {
    this.$nextTick(() => {
      this.drawMapWidthSize();
    });
  },

  activated() {
    // 页面还未加载完，查看其他页面，然后再回来时，页面的map没有，需要重新draw
  },

  deactivated() {
    this.hideDieInfo();
  },
  methods: {
    startDraw() {
      this.drawing = true;
      this.objDraw = drawMap(this.getDrawOption());
      this.drawing = false;
      this.$emit('drawFinish');
    },
    handleFullScreen() {
      this.isFull = !this.isFull;
      let layoutParent = null;
      let parent = this.$parent;
      let w = 4;
      while (w > 0 && parent) {
        if (parent.$options._componentTag === 'FlowLayout') {
          layoutParent = parent;
          break;
        }
        parent = parent.$parent;
        w--;
      }
      if (layoutParent) {
        if (this.isFull) {
          layoutParent.$el.classList.add('map-full');
        } else {
          layoutParent.$el.classList.remove('map-full');
        }
      }


      this.handleResize();
    },
    handleDetailVisiable(val) {
      if (val != this.showDetail) {
        this.showDetail = val;
        this.handleResize();
      }
    },
    getDrawOption() {
      const container = this.$refs.container;
      if (!container) return;
      return {
        instance: this,
        ...this.$data,
        ...this.$props,
        $el: container,
      };
    },
    /**
       * 取消选择的die
       */
    clearSelectedDie() {
      this.objDraw && this.objDraw.cancelSelectedDie();
    },
    handleReverseAggColor(data) {
      this.$emit('onReverseAggColor', data, this.componentData);
    },
    handleZoneVisible(val) {
      if (val !== this.zoneVisible) {
        this.zoneVisible = val;
        this.toggleShowZone();
      }
    },
    handleZoneAnalysisVisible(val) {
      if (val !== this.showZoneAnalysis) {
        this.showZoneAnalysis = val;
        this._debounceResize();
      }
    },
    handleEnterMap() {
      this.showTool = true;
    },
    handleLeaveMap() {
      this.showTool = false;
      this.hideDieInfo();
    },
    hideDieInfo() {
      this.$mapTip.close();
    },
    showDieInfo({ rectData, showFields, e }) {
      showFields = showFields || this.showFields;
      if (!showFields?.length || !rectData) return;

      const tspans = showFields.map(f => {
        const v = rectData[f.field] ?? '';
        return `${f.display}: ${v}`;
      });

      this.$mapTip({
        tips: tspans,
        position: {
          left: e.pageX,
          top: e.pageY,
        }
      });
    },
    /**
       * 计算 container size ,据此
       */
    drawMapWidthSize() {
      new Promise((resolve, reject) => {
        this.$lodash.debounce(this.startDraw, 1)();
      });
    },
    hideShowDefectImg() {

    },
    /**
       * 根据 showZone 重新绘制 zone
       */
    redrawZone() {

    },
    /**
       * 打开详情面板
       */
    openDetail() {
      this.showDetail = !this.showDetail;
      this.$set(this.mapOption, 'detailVisiable', this.showDetail);
      this.$emit('onShowDetail', this.showDetail);
      this.handleResize();
    },
    toggleShowZone() {
      this.zoneVisible = !this.zoneVisible;
      this.$set(this.mapOption, 'zoneVisible', this.zoneVisible);
      this.$emit('toggleShowZone', this.zoneVisible);
      this.objDraw && this.objDraw.showHideZone();
    },
    toggleShowZoneAnalysis() {
      this.showZoneAnalysis = !this.showZoneAnalysis;
      this.$set(this.mapOption, 'zoneAnalysisVisible', this.showZoneAnalysis);
      if (this.componentMapOption) {
        this.$set(this.componentMapOption, 'zoneAnalysisVisible', this.showZoneAnalysis);
      }
      this.$emit(
        'toggleShowZoneAnalysis',
        this.showZoneAnalysis,
        this.componentData
      );
      if (this.showZoneAnalysis && !this.zoneAnalysisData?.length) {
        const aggregateField = this.zoneAnalysis;
        const arr = aggregateField.split('(');
        const data = {
          valueField: arr[1].substring(0, arr[1].length - 1),
          aggregateType: arr[0],
          aggregateField,
        };
        this.getZoneAnalysis(data);
      }
      this.handleResize();
    },
    handleResize() {
      const { zoneChart } = this.$refs;
      zoneChart && zoneChart.handleResize();
      this.$nextTick(() => {
        this._debounceResize();
      });
    },
    /**
       * 进行 zone 分析
       */
    getZoneAnalysis(data) {
      this.$emit('getZoneAnalysis', data, this.componentData);
    },
    onSelectShape(val) {
      this.defectMapShape = val;
    },
    // 选择defectCode
    onSelectDefectCode(vals) {
      this.defectMapData = this.sourceDefectData.map((zData) => {
        const data = zData.data.filter((item) => vals.findIndex(v => item.defectCode == v) !== -1);
        return {
          ...zData,
          data
        };
      });
      this.objDraw && this.objDraw.showHideDefect(this.defectMapData);
      this.$emit('onSelectDefectCode', vals);
    },
    /**
       * 是否显示网格
       */
    changeShowGrid() {
      this.showGrid = !this.showGrid;
      this.objDraw && this.objDraw.showHideDieBorder();
    },
    /**
       * 显示被隐藏的die
       */
    showHidedDie() {
      this.objDraw && this.objDraw.showHideDie(true);
    },
    /**
       * 隐藏选择的die
       */
    hideDie() {
      this.objDraw && this.objDraw.showHideDie(false);
    },
    showOrHideDie(hide) {
      if (this.drawObj) {
        this.drawObj.showOrHideDie(hide);
      }
    },
    hideShowDefectDie() {

    },
    handleReset() {
      const opt = this.getDrawOption();
      this.objDraw && opt && this.objDraw.resetOptions(opt);
    },
    destroy() {
      this.objDraw && this.objDraw.destroy();
    }
  },
  beforeDestroy() {
    this.destroy();
  }
};
</script>

<style lang="less" scoped>
  .wafer-map {
    display: flex;
    flex: 1;
    background-color: #fff;

    section {
      border: 1px solid #ccc;
      flex: 1;
    }

    .tool-box {
      i,svg {
        cursor: pointer;
      }

      .inline-block {
        margin-left: 10px;
      }
    }
  }

  .footer-left {
    display: flex;
    align-content: center;
    align-items: center;
  }
  .detail-box {
    max-width: 180px;
    height: calc(100% - 6px);
    overflow: auto;
  }

  .zone-analysis {
    max-width: 40%;
  }

  .map-box-header, .map-box-footer {
    position: relative;
    height: 30px;
    display: flex;
    justify-content: space-between;
    z-index: 2;
    align-items: center;
    align-content: center;
  }

  .map-box-main {
    height: calc(100% - 60px);
    position: relative;
    overflow: hidden;
  }

  @border: 1px solid #ccc;
  .svg-icon {
    fill: #1296db;
  }
  .not-show {
    fill: #c0c0c0;
    color: #c0c0c0;
  }
</style>
