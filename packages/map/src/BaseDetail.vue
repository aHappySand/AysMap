<template>
    <!-- 详情：基本、分析值、统计值 -->
    <section class="info" v-show="showDetail">
        <!-- 基本 -->
        <div class="info-box" v-if="mapOption.showProduct">
            <div class="title">基本详情</div>
            <div class="content">
                <p>产品：{{ mapProperty.productId }}</p>
                <p v-if="!mapOption.showTitle && mapTitle">标题：{{ mapTitle }}</p>
            </div>
        </div>

        <template v-if="defectCodes.length">
            <!-- 图例 -->
            <div class="info-box">
                <div class="title">Defect</div>
                <div class="content">
                    <checkbox :keyPre="id" :options="options" v-model="selectedCode">
                    </checkbox>
                </div>
            </div>
        </template>

        <!-- 分析值 -->
        <div class="info-box" v-if="showOverlay">
<!--            <div class="title flex-wrap">-->
<!--                <span>{{_isWaferMap ? '分析值' : 'Overlay'}}</span>-->
<!--                <el-button v-if="mapOption.hasReverseAggColor" size="mini" round @click.prevent="handleReverseAggColor">反转颜色</el-button>-->
<!--            </div>-->
            <div class="content">
                <p class="bold">{{aggregateField}}</p>
                <p v-for="{ colorFormat, min, max, from, fromText, to, toText, value, valueText} in colorGroup">
                    <span class="inline-block color-pic" :style="`background-color:${colorFormat};margin-right:3px`"></span>
                    <template v-if="value">{{ valueText || value }}</template>
                    <template v-else>{{ fromText || min || from }} - {{ toText || max||to }}</template>
                </p>
            </div>
        </div>

        <template v-if="mapOption.showStats || mapOption.showTotalDefects || mapOption.showOtherStat">
            <!-- 图例 -->
            <div class="info-box">
                <div class="title">统计值</div>
                <div class="content">
                    <p
                      v-for="(value, key) in statGroup"
                      :key="key"
                      :style="statStyle"
                    >
                        {{ key }}: {{ value }}
                    </p>
                </div>
            </div>
        </template>

        <template v-if="setting && setting.length > 0">
            <!-- 图例 -->
            <div class="info-box">
                <div class="title">设置</div>
                <div class="content">
                    <el-select v-model="shapeVal" @change="selectShape">
                        <el-option v-for="item in setting" :key="item.value" :label="item.label" :value="item.value">
                            <span v-html="item.icon"></span> {{item.label}}
                        </el-option>
                    </el-select>
                </div>
            </div>
        </template>

    </section>
</template>

<script>

import Checkbox from './checkbox';
import { isWaferMap } from './utils/map';

export default {
  name: 'base-detail',
  components: {
    Checkbox
  },
  props: {
    id: {
      type: String,
      default: 'svg-box',
    },
    mapOption: {
      type: Object,
      default: () => ({}),
    },
    mapProperty: {
      type: Object,
      default: () => ({}),
    },
    /**
             * 包含defectCode，shape，color
             */
    defectCodes: {
      type: Array,
      default: () => [],
    },
    canSetShape: {
      type: Boolean,
      default: true,
    },
    colorGroup: {
      type: Array,
      default: () => [],
    },
    statGroup: {
      type: Object,
      default: () => ({}),
    },
    aggregateField: {
      type: String,
      default: '',
    },
    statStyle: {
      type: Object,
      default: () => ({}),
    },
    setting: {
      type: Array,
      default: () => [],
    },
    shape: {
      type: String,
      default: 'cross'
    },
    mapTitle: {
      type: String,
      default: '',
    }
  },
  data() {
    const selectedCode = this.defectCodes.map((item) => item.defectCode);
    return {
      // 是否显示详情
      showDetail: true,
      selectedCode,
      shapeVal: this.shape,
      reverseAggColor: false,
    };
  },
  computed: {
    options() {
      return this.setOptions();
    },
    showOverlay() {
      return (this._isWaferMap || this.mapOption.enableOverlay) && this.colorGroup && this.colorGroup.length;
    },
    _isWaferMap() {
      return isWaferMap(this.mapOption.mapType);
    }
  },

  watch: {
    selectedCode: {
      deep: true,
      handler(newCode) {
        this.selectDefectCode(newCode);
      },
    }
  },

  created() {

  },

  mounted() {
  },

  methods: {
    setOptions() {
      const opt = [];
      this.defectCodes.forEach((item) => {
        opt.push({
          value: item.defectCode,
          label: `<svg style="height: 1em; width: 1em;fill: ${item.colorShow}" aria-hidden="true" class="svg-icon"><use xlink:href="#icon-${item.shapeShow}"></use></svg> ${item.defectCode}`,
        });
      });
      return opt;
    },
    selectShape(val) {
      this.setOptions();
      this.$emit('onSelectShape', val);
    },
    onChange(v) {

    },
    selectDefectCode(vals) {
      this.$emit('onSelectDefectCode', vals);
    },
    handleReverseAggColor() {
      this.reverseAggColor = !this.reverseAggColor;
      this.$emit('onReverseAggColor', this.reverseAggColor);
    }
  },
};
</script>

<style lang="less" scoped>
    .wafer-map-detail {
        display: flex;
        flex: 1;

        section {
            border: 1px solid #ccc;
            flex: 1;
        }
    }

    @border: 1px solid #ccc;

    .info {
        overflow: auto;
        padding: 2px;
        text-align: left;

        .info-title {
            cursor: pointer;
            font-weight: bold;
        }

        .bold {
            font-weight: bold;
        }

        .info-box {
            border: @border;
            border-radius: 3px;
            margin-bottom: 10px;

            .title {
                padding: 2px 5px;
                border-bottom: $border;
                background: #eee;
            }

            .content {
                padding: 5px;
                /*overflow: auto;*/
                white-space: nowrap;
                .color-pic {
                    width: 10px;
                    height: 10px;
                }

                p {
                  line-height: 24px;
                }
            }
        }

        .flex-wrap {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            align-items: center;
        }
    }
    .inline-block {
      display: inline-block;
    }
    /deep/ .el-button--mini, .el-button--mini.is-round {
        padding: 4px 8px;
    }
</style>
