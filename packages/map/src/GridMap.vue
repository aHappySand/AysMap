<template>
  <div class="wafer-map-page fill">
    <div class="flow-grid">
      <div class="grid-container" :key="changeKey">
        <div
          v-for="split in splitList.slice((num - 1) * size, num * size)"
          :class="['grid-split', `grid-split-${split.splitField}`]"
          :key="split.key"
          :style="split.style"
          ref="splits"
        >
          <BaseMap
            ref="map"
            :base-data="split.baseData"
            :map-property="split.mapProperty"
            :map-option="_mapOption"
            :sourceAggregateData="split.aggregateData"
            :sourceDefectData="split.defectData"
            :zoneBorderDies="split.zoneBorderDies"
            :statGroup="split.statInfo"
            :component-data="split.componentData"
            :stat-style="split.statStyle"
            :show-fields="split.showWaferFields"
            :show-defect-fields="split.showDefectFields"
            :zoneAnalysisData="split.zoneAnalysisData"
            @onShowDetail="split.onShowDetail"
            @toggleShowZone="split.toggleShowZone"
            v-on="$listeners"
            v-bind="$attrs"
          ></BaseMap>
        </div>
        <div v-if="count === 0" class="empty">暂无数据</div>
      </div>
      <div class="pagination-container" v-if="count > 1">
        <el-pagination :current-page.sync="num" :page-size="size" :total="splitList.length" layout="total, prev, next, jumper"></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { flowMap } from './utils/map';
import BaseMap from './BaseMap.vue';

export default {
  name: 'ZGridMap',
  components: {
    BaseMap,
  },
  props: {
    mapOption: {
      type: Object,
      default: () => ({
        type: 0,
      })
    },
    sourceData: Object,
    row: {
      type: Number,
      default: 1,
    },
    col: {
      type: Number,
      default: 1,
    }
  },
  watch: {
    sourceData: {
      handler() {
        this.initData();
      }
    },
  },
  data() {
    this.splitList = [];

    return {
      objMap: null,
      size: 1,
      num: 1,
      changeKey: Math.random(),
      count: -1,
      _mapOption: null,
    };
  },

  created() {
    this.initData();
  },

  computed: {

  },
  methods: {
    onShowDetail(val) {
      // this.mapOption && (this.mapOption.detailVisiable = val);
    },
    handleToggleShowZone(val) {
      // this.mapOption && (this.mapOption.zoneVisible = val);
    },
    /**
       * 初始化处理数据
       */
    initData() {
      const mapOption = this.mapOption;

      this.objMap = flowMap(this.sourceData, mapOption);
      const columns = this.col;
      const rows = this.row;

      const style = {
        width: `${100 / columns}%`,
        height: `${100 / rows}%`,
      };
      this.num = 1;

      const splitList = this.objMap.getGridData();
      this._mapOption = this.objMap.options;
      splitList.forEach(item => {
        item.style = style;
        item.onShowDetail = this.onShowDetail;
        item.toggleShowZone = this.handleToggleShowZone;
      });
      this.changeKey = Math.random();
      this.splitList = splitList;
      this.size = columns * rows;
      this.count = splitList.length;
    },
    handleResize() {
      if (this.$refs.map) {
        const maps = Array.isArray(this.$refs.map) ? this.$refs.map : [this.$refs.map];
        maps.forEach(map => map.handleResize());
      }
    },
    drawView() {
      this.initData();
    },
    emptyView() {
      this.splitList = [];
    },
  },
};
</script>

<style lang="less" scoped>
  .wafer-map-page {
    display: flex;
    flex-direction: column;

    &> div{
      flex: 1;
    }
  }

  .flow-grid {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .grid-container {
      width: 100%;
      height: 100%;
      flex-grow: 1;
      display: flex;
      flex-wrap: wrap;
      overflow: hidden;
    }
    .pagination-container {
      flex-basis: 30px;
      flex-shrink: 1;
      text-align: right;
    }
  }
</style>
