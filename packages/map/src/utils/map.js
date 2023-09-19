import { cloneDeep } from 'lodash-es';
import { parseColorArr, arrToHex } from './color';
// eslint-disable-next-line import/extensions


export const defectMarkers = [
  {
    marker: 0,
    shape: 'circle',
  },
  {
    marker: 1,
    shape: 'cross',
  },
  {
    marker: 2,
    shape: 'ring',
  },
  {
    marker: 3,
    shape: 'square',
  },
  {
    marker: 4,
    shape: 'star',
  },
  {
    marker: 5,
    shape: 'triangle',
  },
  {
    marker: 6,
    shape: 'invertedTriangle',
  },
  // {
  //   marker: 7,
  //   shape: 'diamond',
  // },
  // {
  //   marker: 8,
  //   shape: 'plus',
  // }
];

/**
 * 获取字体设置样式
 * 0 - Title, 1 - CategoryAxis, 2 - ValueAxis, 3 - Legend, 4 - DataLabel
 * @param {fontType} fontType
 * @param {fonts} fonts: component 的 fonts 字段
 * @param {name} {具体格式的字段 name}
 * @param {returnAll} {是否返回找到的所有格式, 针对每个有 name 的 fontStyle, 返回找到的所有的 style, 最后返回一个对象, 即 returnAll 找到的 Style 默认有 name }
 * @returns
 */
export function getStyle({
  fontType, fonts, name = '', returnAll = false
}) {
  let style = {};
  const styles = fonts.filter(item => item.fontType === fontType);
  const len = styles && styles.length || 0;
  if (returnAll && len) {
    for (const s of styles) {
      style[s.name] = { ...s };
    }
    return style;
  }
  if (len && name && fonts.some(item => item.name === name)) {
    style = styles.find(item => item.name === name);
  } else {
    style = styles[0];
  }
  return style || {};
}

export const shapeToMarker = (shape) => {
  shape = shape.toLowerCase();
  const item = defectMarkers.find(dm => dm.shape === shape);
  return item ? item.marker : 0;
};

export const markerToShape = (marker) => {
  marker = +marker;
  const item = defectMarkers.find(dm => dm.marker === marker);
  return item ? item.shape : 'circle';
};


/**
 * 格式化数字为千分位分隔
 * @param {传入数字} v
 * @returns
 */
export function formatThousand(v) {
  const vArr = String(v).split('.');
  vArr[0] = vArr[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  return vArr.join('.');
}

/**
 * 获取两个特定字符串之间的字符
 * @param {字符串} text
 * @param {开始字符} start
 * @param {结束字符} end
 * @returns
 */
export function getMatch(text, start = '', end = '') {
  const reg = new RegExp(`/${start}(\\S*)${end}/`);
  return text.match(reg) && text.match(reg)[1];
}

export function formatPattern(pattern, v) {
  /**
   *  { "#.00", "显示两位小数。"},
   { "0.00", "显示两位小数。"},
   { "#,#", "四舍五入保留整数位，整数位间隔3位用英文逗号分隔。"},
   { "E2", "科学计数法并且尾数四舍五入保留2位小数，符号采用大写E。尾数保留3位小数使用E3，以此类推。"},
   { "n", "四舍五入保留2位小数，整数部分间隔3位用英文逗号分隔。")},
   { "n1", "四舍五入保留1位小数，整数部分间隔3位用英文逗号分隔。保留2位小数使用n2，以此类推。"},
   { "e", "科学计数法并且精确到1位小数，符号采用小写e。"},
   { "e1", "科学计数法并且尾数四舍五入保留1位小数，符号采用小写e。尾数保留2位小数使用e2，以此类推。"},
   { "f", "四舍五入保留2位小数，小数位不够2位的用0填充"},
   { "f1", "四舍五入保留1位小数，小数位不够1位的用0填充。保留2位小数使用f2，以此类推"},
   { "0%", "百分比并且四舍五入保留整数位。")},
   { "0.0%", "百分比并且四舍五入保留1位小数，小数位不够使用0填充。"},
   { "0.00%", "百分比并且四舍五入保留2位小数，小数位不够使用0填充。"},
   { "$0.00", "货币格式并且四舍五入保留两位小数，符号为$。保留的小数位数根据小数点后面0的个数而定，位数不够的使用0填充。"},
   { "$0", "货币格式并且四舍五入保留整数，符号为$"},
   { "c", "货币格式并且四舍五入保留2位小数，整数部分间隔3位用英文逗号分隔，符号为￥，保留的小数位数根据c后面数字而定。"},
   { "c1", "货币格式并且四舍五入保留1位小数，整数部分间隔3位用英文逗号分隔，符号为￥。"},
   { "c2", "货币格式并且四舍五入保留2位小数，整数部分间隔3位用英文逗号分隔，符号为￥。"}
   */
  const value = Number(v);
  const notNumber = isNaN(value);
  if (pattern && (v || v === 0) && !notNumber) {
    // value 为数值且 有 格式化字符串
    switch (pattern) {
      case '#.00':
        // eslint-disable-next-line radix
        return (parseInt(value * 100) / 100).toFixed(2);
      case '0.00':
        // eslint-disable-next-line radix
        return (parseInt(value * 100) / 100).toFixed(2);
      case '#,#':
        return formatThousand(Math.round(value));
      case 'n':
        return formatThousand((Math.round(value * 100) / 100).toFixed(2));
      case 'e':
        return Number(value.toFixed(1)).toExponential();
      case 'f':
        return value.toFixed(2);
      case '0%':
        return `${Math.round(value * 100)}%`;
      case '0.0%':
        return `${(Math.round(value * 100 * 10) / 10).toFixed(1)}%`;
      case '0.00%':
        return `${(Math.round(value * 100 * 100) / 100).toFixed(2)}%`;
      case '$0':
        return `$${Math.round(value)}`;
      case 'c1':
        return `￥${formatThousand(Number(value.toFixed(1)))}`;
      case 'c2':
        return `￥${formatThousand(Number(value.toFixed(2)))}`;
      default: {
        // E2 科学计数法并且尾数四舍五入保留2位小数，符号采用大写E。尾数保留3位小数使用E3，以此类推
        if (pattern.includes('E')) {
          const EL = getMatch(pattern, 'E');
          if (EL) {
            return value.toExponential(Number(EL)).replace(/e/, 'E');
          }
        }

        // n1 四舍五入保留1位小数，整数部分间隔3位用英文逗号分隔。保留2位小数使用n2，以此类推。
        if (pattern.includes('n')) {
          const nL = getMatch(pattern, 'n');
          if (nL) {
            const pow = Math.pow(10, Number(nL));
            return formatThousand(Math.round(value * pow) / pow);
          }
        }

        // "e1", "科学计数法并且尾数四舍五入保留1位小数，符号采用小写e。尾数保留2位小数使用e2，以此类推。
        if (pattern.includes('e')) {
          const eL = getMatch(pattern, 'e');
          if (eL) {
            return value.toExponential(Number(eL));
          }
        }

        // "f1", "四舍五入保留1位小数，小数位不够1位的用0填充。保留2位小数使用f2，以此类推"
        if (pattern.includes('f')) {
          const fL = getMatch(pattern, 'f');
          if (fL) {
            return value.toFixed(Number(fL));
          }
        }

        // "$0.00", "货币格式并且四舍五入保留两位小数，符号为$。保留的小数位数根据小数点后面0的个数而定，位数不够的使用0填充。"
        if (pattern.includes('$0.')) {
          const match = getMatch(pattern, '$0.');
          const oL = match && match.length || 0;
          if (oL) {
            return `$${value.toFixed(oL)}`;
          }
        }

        // "0.000%", "百分比格式并且四舍五入保留两位小数，符号为%。保留的小数位数根据小数点后面0的个数而定，位数不够的使用0填充。"
        if (pattern.includes('%')) {
          const match = getMatch(pattern, '0.', '%');
          const oL = match && match.length || 0;
          if (oL) {
            return `${((value * 100 * 10 * oL) / (10 * oL)).toFixed(oL)}%`;
          }
        }

        // "c", "货币格式并且四舍五入保留2位小数，整数部分间隔3位用英文逗号分隔，符号为￥，保留的小数位数根据c后面数字而定。"
        if (pattern.includes('c')) {
          const cL = getMatch(pattern, 'c');
          if (cL) {
            return `￥${formatThousand(Number(value.toFixed(cL)))}`;
          }
        }

        // "p", "百分比格式并且四舍五入保留两位小数，符号为%。保留的小数位数根据c后面数字而定，位数不够的使用0填充。"
        if (pattern.includes('p')) {
          const pL = getMatch(pattern, 'p');
          if (pL) {
            const nPL = pL == 0 ? 1 : pL;
            return `${((value * 100 * 10 * nPL) / (10 * nPL)).toFixed(pL)}%`;
          }
        }
      }
    }
  }
  return v;
}

export function formatTextByPattern(textPattern, value) {
  const text = (textPattern || '').match(/{(\S*)}/) && (textPattern || '').match(/{(\S*)}/)[1];
  const pattern = (text || '').substr(2);
  return pattern ? formatPattern(pattern, value) : value;
}

/**
 * 将客户端的颜色 格式化为web端的颜色
 * @param color
 * @returns {any}
 */
export function convertToWebColor(color) {
  if (!color) return color;
  const rgbaX = /^#([\w\d]{2})([\w\d]{6})/;
  const match = color.match(rgbaX);
  if (match) {
    return `#${match[2]}${match[1]}`;
  }
  return color;
}

// 生成颜色值，如果不够，再随机生成
export function randomColor() {
  return [
    '#247ba0',
    '#70c1b3',
    '#b2dbbf',
    '#f3ffbd',
    '#b19cea',
    '#50914f',
    '#BBFFFF',
    '#ffe066',
    '#2ec4b6',
    '#24e71d',
    '#f8940b',
    '#457bd9',
    '#AEEEEE',
    '#a8dadc',
    '#96CDCD',
    '#ffb4a2',
    '#a5ffd6',
    '#00F5FF',
    '#00a8e8',
    '#003459',
    '#9bc53d',
    '#5bc0eb',
    '#2a9d8f',
    '#f4a261',
    '#7b9cad',
    '#114b5f',
    '#1E90FF',
    '#525174',
    '#9c89b8',
    '#f0a6ca',
    '#06d6a0',
    '#00FF7F',
    '#843b62',
    '#fe938c',
    '#6fffe9',
    '#88d498',
  ];
}

/**
 * mapType:
 * 0: Wafer Map
 * 1: Defect Map
 * 2: Bin Map
 */

/**
 * 判断是否为wafer Map，可能出现一个大类分为几个小类，使用方法统一处理
 * @param mapType
 */
export function isWaferMap(mapType) {
  // eslint-disable-next-line eqeqeq
  return mapType == 0 || mapType == 2;
}

export function isDefectMap(mapType) {
  // eslint-disable-next-line eqeqeq
  return mapType == 1;
}

export function isBinMap(mapType) {
  // eslint-disable-next-line eqeqeq
  return mapType == 2;
}

export function binMapValueFields(valueFields) {
  const valueField = valueFields.valueField;
  const aliasName = valueFields.aliasName;
  const aggregateField = `max(${valueField})`;
  const aggregateFieldAlias = valueField === aliasName ? aggregateField : aliasName;
  return [{
    groupColors: null,
    name: aggregateField,
    aliasName: aggregateFieldAlias,
    valueField,
    aggregateType: 'max',
    isSecondaryAxis: false,
    secondaryAxisTitle: null,
    showLabel: false,
    isCustomized: false,
    seriesType: 'WaferMapOption',
    specs: []
  }];
}

export function formatOptionSeries(valueFields) {
  return valueFields.map(vf => ({
    groupColors: [],
    name: vf.aggregateField,
    aliasName: vf.aliasName,
    valueField: vf.value[0],
    aggregateType: vf.value[1],
    isSecondaryAxis: false,
    secondaryAxisTitle: null,
    showLabel: false,
    isCustomized: false,
    seriesType: 'WaferMapOption',
    specs: [],
  }));
}

/**
 * binMap 值列 默认的字段名
 * @type {string[]}
 */
export const binFields = ['hbin', 'hardbin', 'bin', 'sbin', 'softbin'];

export const mapOverlayStatItems = [
  {
    label: 'Pass Clean',
    prop: 'passClean',
  },
  {
    label: 'Kill Ratio',
    prop: 'killRatio',
  },
  {
    label: 'Pass Defects',
    prop: 'passDefects',
  },
  {
    label: 'Capture Rate',
    prop: 'captureRate'
  },
  {
    label: 'Fail Clean',
    prop: 'failClean'
  },
  {
    label: 'Hit Rate',
    prop: 'hitRate'
  },
  {
    label: 'Fail Defects',
    prop: 'failDefects'
  },
  {
    label: 'Yield Impact',
    prop: 'yieldImpact'
  },
];

export const defectStatItems = [
  {
    label: 'Total Defects',
    prop: 'totalDefects',
    key: 'showTotalDefects',
  },
  {
    label: 'Defect Ratio',
    prop: 'defectRatio',
    key: 'showDefectRatio',
  },
];

export const mapStatItems = mapOverlayStatItems.concat(defectStatItems);

export function isNumber(val) {
  return val !== null && val !== '' && isFinite(val);
}

function parseNumber(num) {
  if (isNumber(num)) {
    return Number(num);
  }
  // throw Error(num + '类型错误');
  return num;
}


/**
 * defect marker 形状
 */
function switchDefectMarker(marker) {
  marker = Number(marker);
  const dm = defectMarkers.find(item => item.marker === marker);
  // eslint-disable-next-line no-mixed-operators
  return dm && dm.shape || 'circle';
}

const waferMapOption = {
  diexField: 'die_x', //
  dieyField: 'die_y', //
  productField: '', // product_id
  showMapRuler: true,
  colorGroups: [],
  detailVisiable: true,
  zoneConfigMap: {
    // PD0004A: "22222"
  },
  statisticsInfos: [
    // 结构
    // {
    //     type: "min",
    //     column: "test_start_time",
    //     isCustom: false,
    //     alias: null,
    //     title: "yyyy"
    // }
  ],
  toolTips: [
    {
      name: 'Die_X',
      enable: true
    },
    {
      name: 'Die_Y',
      enable: true
    },
    {
      name: '值',
      enable: true
    },
    {
      name: 'Zone Name',
      enable: true
    }
  ],
  zoneAnalysis: {},
  zoneVisible: true, // 自定义的选项
  zoneAnalysisVisible: false,
  gridLineVisible: true,
  reverseDieX: false,
  reverseDieY: false,
  showZone: false,
  showStats: false,
  showAggDataLable: false,
  aggDataLableFontSize: 12,
  isAggDataLableAutoSize: false,
  showProduct: true,
  showValueFieldName: true,
  colorModel: 1,
  coorXField: null,
  coorYField: null,
  mapType: 0,
  defectColorField: null,
  useDefaultColor: false,
  defaultColor: '#43a6f1',
  colorFieldIsNumberic: false,
  defectMarkerField: null,
  useDefaultMarker: false,
  defaultMarker: 0,
  markerFieldIsNumberic: false,
  defectMarkerSizeField: null,
  markerSizeFieldIsNumberic: false,
  useDefaultSize: true,
  defaultSize: 0,
  defectStatsTypes: [],
  overlayColorMode: 1,
  enableOverlay: false,
  showOverlayStats: false,
  overlayValueField: null,
  showTotalDefects: false,
  showDefectRatio: false,
  bindCodeField: null,
  defectColors: [],
  defectMakers: [],
  defectMakerSizes: [],
  defectMaxSize: 15000000,
  chartControlType: 0,
  hasReverseAggColor: true,
};

const defectMapOption = {
  diexField: 'die_x', //
  dieyField: 'die_y', //
  productField: '', // product_id
  showMapRuler: true,
  colorGroups: [],
  detailVisiable: true,
  zoneConfigMap: {
    // PD0004A: "1111"
  },
  statisticsInfos: [
    // {
    //     type: "min",
    //     column: "test_end_time",
    //     isCustom: false,
    //     alias: "min(test_end_time)",
    //     title: "min(test_end_time)"
    // }
  ],
  toolTips: [
    {
      name: 'CoorX',
      enable: true
    },
    {
      name: 'CoorY',
      enable: true
    },
    {
      name: 'Die_X',
      enable: true
    },
    {
      name: 'Die_Y',
      enable: true
    },
    {
      name: 'ColorField',
      enable: true
    },
    {
      name: 'ShapeField',
      enable: true
    },
    {
      name: 'SizeField',
      enable: true
    }
  ],
  zoneAnalysis: {},
  zoneVisible: true, // 自定义的选项
  zoneAnalysisVisible: false,
  gridLineVisible: true,
  reverseDieX: false,
  reverseDieY: false,
  showZone: false,
  showStats: false,
  showAggDataLable: false,
  aggDataLableFontSize: 10,
  isAggDataLableAutoSize: false,
  showProduct: true,
  showValueFieldName: true,
  colorModel: 0,
  coorXField: 'die_x', //
  coorYField: 'die_y', //
  mapType: 1,
  defectColorField: '', // hbin_code
  useDefaultColor: false,
  defaultColor: '#43a6f1',
  colorFieldIsNumberic: true,
  defectMarkerField: '', // hbin_code
  useDefaultMarker: false,
  defaultMarker: 0,
  markerFieldIsNumberic: true,
  defectMarkerSizeField: '', // hbin_name
  markerSizeFieldIsNumberic: false,
  useDefaultSize: true,
  defaultSize: 0,
  defectStatsTypes: [
    'Pass Defects',
    'Yield Impact',
    'Hit Rate'
  ],
  overlayColorMode: 0,
  enableOverlay: false,
  showOverlayStats: false,
  overlayValueField: '', // min(hbin_code)
  showTotalDefects: false,
  showDefectRatio: false,
  bindCodeField: '', // hbin_code
  defectColors: [
    // {
    //     min: 1,
    //     max: 21.4,
    //     fieldValue: null,
    //     color: "#247ba0",
    //     isNumbericField: true
    // },
  ],
  defectMakers: [
    // {
    //     min: 1,
    //     max: 21.4,
    //     fieldValue: null,
    //     shape: 0,
    //     isNumbericField: true
    // },
  ],
  defectMakerSizes: [
    // {
    //     fieldValue: "BIN_2L_FULL_SIZE_NORMAL_BRIGHT_FAIL",
    //     size: 5,
    //     isNumbericField: false
    // },
  ],
  defectMaxSize: 15000000,
  chartControlType: 0,
  series: [],
  showOtherStat: false,
  noEdit: true,
  hasReverseAggColor: true,
};

// 分析页面 map的配置
export const analysisMapOption = {
  zoneVisible: false, // 自定义的选项
  showZone: false,
  diexField: 'DIE_X',
  dieyField: 'DIE_Y',
  colorModel: 2,

  hasReverseAggColor: false, // 自定义的选项
  detailVisiable: false,
  toolTips: [
    {
      name: 'Die_X',
      enable: true
    },
    {
      name: 'Die_Y',
      enable: true
    },
    {
      name: '值',
      enable: true
    },
  ],
};

export const emptyZoneId = '_$_';

/**
 * 解析flow map数据
 * @param jsonData
 * @param options
 * @returns {*}
 */
export function flowMap(jsonData, options = {}) {
  return getMap(jsonData, options);
}

// 解析map数据
// eslint-disable-next-line no-shadow
export function dealMap(jsonData, options = {}) {
  options.mapType = 0;
  return getMap(jsonData, options).mapDatas;
}

// eslint-disable-next-line no-shadow
export function dealWaferMap(jsonData, options = {}) {
  options = Object.assign({}, analysisMapOption, options || {},);
  options.mapType = 0;
  return getMap(jsonData, options);
}

// eslint-disable-next-line no-shadow
export function dealDefectMap(jsonData, optons = {}) {
  optons.mapType = 1;
  return getMap(jsonData, optons);
}


function translateColor(color) {
  const rgbaX = /^#([\w\d]{2})([\w\d]{6})/;
  const match = color.match(rgbaX);
  if (match) {
    return `#${match[2]}${match[1]}`;
  }
  return color;
}

function formatBaseData(data, diameter, centerx, centery, zoneData, hasCenter, options) {
  const r = diameter / 2;

  let minX = Number.MAX_SAFE_INTEGER;
  let minY = Number.MAX_SAFE_INTEGER;
  let maxX = Number.MIN_SAFE_INTEGER;
  let maxY = Number.MIN_SAFE_INTEGER;
  let minDieX = Number.MAX_SAFE_INTEGER;
  let minDieY = Number.MAX_SAFE_INTEGER;
  let maxDieX = Number.MIN_SAFE_INTEGER;
  let maxDieY = Number.MIN_SAFE_INTEGER;

  let startDie = null;
  let endDie = null;

  data.forEach((item) => {
    if (item.leftx < minX) {
      minX = item.leftx;
    }
    if (item.rightx > maxX) {
      maxX = item.rightx;
    }

    if (item.topy > maxY) {
      maxY = item.topy;
    }
    if (item.bottomy < minY) {
      minY = item.bottomy;
    }

    if (item.diex < minDieX) {
      minDieX = item.diex;
    }

    if (item.diey < minDieY) {
      minDieY = item.diey;
    }
    if (item.diex > maxDieX) {
      maxDieX = item.diex;
    }

    if (item.diey > maxDieY) {
      maxDieY = item.diey;
    }

    if (hasCenter) {
      if (options.reticleDie.minX === item.diex && options.reticleDie.minY === item.diey) {
        startDie = item;
      }
      if (options.reticleDie.maxX === item.diex && options.reticleDie.maxY === item.diey) {
        endDie = item;
      }
    }
  });
  let leftD; let rightD; let topD; let
    bottomD;

  // 上下左右边界 die 到 圆弧之间的空白距离
  // eslint-disable-next-line prefer-const
  leftD = r - Math.abs(minX);
  // eslint-disable-next-line prefer-const
  rightD = r - Math.abs(maxX);
  // eslint-disable-next-line prefer-const
  topD = r - Math.abs(maxY);
  // eslint-disable-next-line prefer-const
  bottomD = r - Math.abs(minY);

  const coordinates = {
    minX: r + minX,
    maxX: r + maxX,
    minY: r - maxY,
    maxY: r - minY,
    leftD,
    rightD,
    topD,
    bottomD,
    minDieX,
    minDieY,
    maxDieX,
    maxDieY,
    startDie,
    endDie,
  };
  const zoneDie = {};
  // 中心die
  const centerDie = options.centerDie || { diex: 0, diey: 0 };

  // 坐标转换，原始数据坐标系原点为圆心，坐标在四个象限。转换为画图所需：坐标原点在左上角，所有坐标均在四象限。
  // originXX 为转换后的坐标。画 die 以左上角点为起点开始画。
  data.forEach((item, idx) => {
    item.originLeftX = startDie ? item.leftx - startDie.leftx : r + (item.leftx - centerx);
    item.originTopY = startDie ? -item.topy + startDie.topy : r - (item.topy - centery);
    item.index = idx;

    // eslint-disable-next-line eqeqeq
    if (centerDie.diex == item.diex && centerDie.diey == item.diey) {
      item.isCenter = true;
    }

    if (!item.colorCode && item.zoneId && zoneData && zoneData[item.zoneId]) {
      item.colorCode = zoneData[item.zoneId].colorCode;
    }

    // 按zoneId分区，方便查找边界die具体要描哪条边
    let zoneId = '0';
    if (item.zoneId) {
      zoneId = item.zoneId;
    }
    if (!zoneDie[zoneId]) {
      zoneDie[zoneId] = {};
    }
    const k = `${item.diex}_${item.diey}`;
    zoneDie[zoneId][k] = item;
  });

  return { data, coordinates, zoneDie };
}
function zoneColors(zoneData) {
  const randColor = randomColor();
  const len = randColor.length;
  const zones = {};
  zoneData = cloneDeep(zoneData);
  zoneData.forEach((item, index) => {
    if (!item.colorCode) {
      item.colorCode = randColor[index % len];
    } else {
      item.colorCode = translateColor(item.colorCode);
    }
    zones[item.zoneId] = item;
  });
  return zones;
}

export const commonUnits = [
  { unit: 'nm', base: 1 },
  { unit: 'μm', base: 1000 },
  { unit: 'mm', base: 1000 },
  { unit: 'cm', base: 10 },
  { unit: 'dm', base: 10 },
  { unit: 'm', base: 10 },
];

export const changeUnit = (form, newUnit, oldUnit) => {
  const keys = [
    'diameter',
    'originDiex',
    'originDiey',
    'dieWidth',
    'dieHeight',
    'originShotx',
    'originShoty',
    'shotWidth',
    'shotHeight',
  ];

  const newIndex = commonUnits.findIndex((unit) => unit.unit === newUnit);
  const oldIndex = commonUnits.findIndex((unit) => unit.unit === oldUnit);
  if (newIndex !== oldIndex) {
    const maxIndex = Math.max(newIndex, oldIndex);
    const minIndex = Math.min(newIndex, oldIndex);
    let multiple = 1;

    for (let index = maxIndex; index > minIndex; index--) {
      multiple *= commonUnits[index].base;
    }

    const toBig = newIndex > oldIndex;
    keys.forEach(key => {
      if (form[key]) {
        // 小单位转大单位
        if (toBig) {
          // eslint-disable-next-line operator-assignment
          form[key] = form[key] / multiple;
        } else {
          // eslint-disable-next-line operator-assignment
          form[key] = form[key] * multiple;
        }
      }
    });
  }
};

export const dealMapConfig = (configInfo) => {
  if (configInfo.mapInfoEntities) {
    const infos = cloneDeep(configInfo);
    changeUnit(infos, 'nm', infos.units);
    const dies = infos.mapInfoEntities;
    delete infos.mapInfoEntities;

    // 中心die
    let centerDie = null;
    // eslint-disable-next-line no-prototype-builtins
    if (infos.hasOwnProperty('originCenterx')) {
      centerDie = {
        diex: infos.centerx,
        diey: infos.centery,
      };
    }
    const options = { centerDie };

    const result = formatBaseData(dies, infos.diameter, infos.centerx, infos.centery, null, null, options);
    result.mapProperty = Object.assign(infos, result.coordinates);
    delete result.coordinates;
    return result;
  }
  return configInfo;
};

export const dealMapZoneConfig = (configInfo) => {
  if (configInfo.mapZoneResps) {
    const infos = cloneDeep(configInfo);
    const dies = infos.mapZoneResps;
    delete infos.mapZoneResps;


    // 中心die
    let centerDie = null;
    // eslint-disable-next-line no-prototype-builtins
    if (infos.hasOwnProperty('originCenterx')) {
      centerDie = {
        diex: infos.centerx,
        diey: infos.centery,
      };
    }
    const options = { centerDie };

    const zoneData = zoneColors(infos.zoneInfoResps);

    const result = formatBaseData(dies, infos.diameter, infos.centerx, infos.centery, zoneData, null, options);
    for (const id in result.zoneDie) {
      let count = 0;
      // eslint-disable-next-line no-unused-vars
      for (const die in result.zoneDie[id]) {
        count++;
      }
      // eslint-disable-next-line no-unused-expressions
      zoneData[id] && (zoneData[id].dieCount = count);
    }
    result.zoneData = zoneData;
    result.mapProperty = Object.assign(infos, result.coordinates);
    delete result.coordinates;

    return result;
  }
  return configInfo;
};


/**
 * 将 aggregateFieldAlias 转为 级联 所需的 value 的格式  ['a', 'b']
 */
export function aggregateAliasToValue(aggregate) {
  let value = [];
  if (aggregate) {
    const arr = aggregate.split('(');
    if (arr.length === 2) {
      arr[1] = arr[1].substring(0, arr[1].length - 1);
    }
    value = arr.reverse();
  }
  return value;
}


export function getMap(jsonMap, options) {
  if (!jsonMap || !jsonMap.mapData) {
    jsonMap = {
      mapData: [],
      zoneConfigData: [],
      defectStatisticsData: [],
      aggregateData: [],
      defectMapData: []
    };
    // throw new Error('数据格式错误');
  }

  const defaultOptions = {
    // reticle die的边界          //目前都是单个产品，如果是多个，坐标可能不同，需要传数组的方式，暂不考虑多产品的情况
    reticleDie: {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    },
    showTitle: true,
    dieColor: 'rgba(193,193,193,0.51)',
    crossDieColor: 'rgba(127,221,255,0.51)',
    circleColor: '#eaeaea',
    selectedColor: '#0000ff', // 选中时边框的颜色
    selectedStrokeWidth: 1, // 选中时的宽度
    circleStroke: 1,
    zoneStroke: 1,
    dieStroke: 0.5,
    defectMapShape: 'cross',


    defaultDefectColor: '#58b0f1',
    defaultDefectMarker: 'circle', // defect 默认形状，圆
    defaultDefectSize: 3,
  };

  const showFieldsParams = [
    {
      name: 'Die_X',
      display: 'Die_X',
      field: 'diex',
    },
    {
      name: 'Die_Y',
      display: 'Die_Y',
      field: 'diey',
    },
    {
      name: '值',
      display: 'Value',
      field: 'value',
    },
    {
      name: 'Zone Name',
      display: 'Zone',
      field: 'zoneName',
    },
    {
      name: 'CoorX',
      display: 'CoorX',
      field: 'coorx',
    },
    {
      name: 'CoorY',
      display: 'CoorY',
      field: 'coory',
    },
    {
      name: 'ColorField',
      display: 'Color',
      field: 'colorFormat',
    },
    {
      name: 'ShapeField',
      display: 'Shape',
      field: 'shapeShow',
    },
    {
      name: 'SizeField',
      display: 'Size',
      field: 'size',
    },
  ];

  const defaultFonts = {
    fontType: 4,
    fontFamily: 'Microsoft Yahei UI',
    fontSize: 12,
    fontWeight: 'Bold',
    fontStyle: 'Normal',
    textPattern: '{V:0.00}',
    horizontalAlignment: 0,
    verticalAlignment: 1,
    textWrapping: 1,
    name: ''
  };

  let
    jsonData = {};
  let mapDatas = [];
  let mapOptions = {};
  let defectMapData = [];
  let defectStatisticsData = [];
  let aggregateData = [];
  let fonts = null;

  function initData(data, options) {
    if (options.fonts) {
      fonts = options.fonts;
    }
    const mapType = options && options.mapType || 0;
    const mapOpt = isWaferMap(mapType) ? waferMapOption : defectMapOption;
    if (!options.toolTips || !options.toolTips.length) {
      options.toolTips = mapOpt.toolTips;
    }
    mapOptions = Object.assign({}, defaultOptions, mapOpt, options);

    mapOptions.colorShow = convertToWebColor(mapOptions.defaultColor);// TODO::验证

    const colorFields = ['dieColor', 'crossDieColor', 'circleColor', 'selectedColor', 'defaultDefectColor', 'defaultColor'];
    colorFields.forEach(field => {
      if (mapOptions[field]) {
        mapOptions[`${field}Show`] = parseColorArr(mapOptions[field]);
      }
    });

    (mapOptions.defectMakers || []).forEach(item => {
      item.shapeShow = switchDefectMarker(item.shape);
    });
    jsonData = data;
    mapDatas = [];
    defectMapData = jsonData.defectMapData;
    defectStatisticsData = jsonData.defectStatisticsData;
    aggregateData = jsonData.aggregateData;

    return jsonData;
  }

  function sortDefectCode(codeSet) {
    return Array.from(codeSet)
      .sort((a, b) => {
        let ca = a;
        let cb = b;
        if (isNumber(a)) {
          ca = Number(a);
          cb = Number(b);
        } else {
          if (a.indexOf('#')) {
            const aArr = a.split('#');
            const bArr = b.split('#');
            return Number(aArr[0]) == Number(bArr[0])
              ? (Number(aArr[1]) > Number(bArr[1]) ? 1 : -1)
              : (Number(aArr[0]) > Number(bArr[0]) ? 1 : -1);
          }
        }
        return ca > cb ? 1 : -1;
      });
  }

  function getBaseByProduct(productId) {
    return mapDatas.find(item => item.property.productId === productId);
  }


  function formatGroupNumber(group, type) {
    if (group.isChange) return;

    group.forEach(c => {
      if (c.min !== null) {
        c.min = Number(c.min);
      }
      if (c.max !== null) {
        c.max = Number(c.max);
      }

      if (type === 'color') {
        c.colorFormat = convertToWebColor(c.color);
        c.colorShow = parseColorArr(c.colorFormat);
      } else if (type === 'shape') {
        c.shapeShow = c.shapeShow.replace(/^\w/, (c) => c.toLowerCase());
      }
    });

    // 添加转换标志
    Object.defineProperty(group, 'isChange', {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }

  function _dealDefectMapData() {
    const colors = (randomColor()).map(c => parseColorArr(c));

    const len = colors.length;

    const codeMap = {};


    /**
     * @param cg colorGroup 或 shapeGroup
     * @param groupField defect data
     * @param changeNum
     * @param type
     */
    const getColorOrShape = (cg, groupField, changeNum, type) => {
      const cgf = cg.find((item) => {
        if (!changeNum) {
          if (item.min !== null) {
            item.min = Number(item.min);
          }
          if (item.max !== null) {
            item.max = Number(item.max);
          }
        }
        if (isNumber(item.min) || isNumber(item.max)) {
          return item.min <= groupField && item.max >= groupField;
        }
        return item.fieldValue === groupField;
      });

      if (type === 'color') {
        return cgf ? [cgf.colorShow, cgf.colorFormat] : [mapOptions.defaultDefectColorShow, mapOptions.defaultDefectColor];
      } if (type === 'size') {
        return cgf ? cgf.size : mapOptions.defaultDefectSize;
      }
      return cgf ? cgf.shapeShow : mapOptions.defaultDefectMarker;
    };


    const mapDefaultColor = mapOptions.defaultColorShow;
    const mapDefaultMarker = switchDefectMarker(mapOptions.defaultMarker);
    const { coorXField, coorYField } = mapOptions;

    defectMapData.forEach((defectData) => {
      const colorGroup = !mapOptions.useDefaultColor && mapOptions.defectColors && mapOptions.defectColors.length ? mapOptions.defectColors : (defectData.colorGroup || []);
      const shapeGroup = !mapOptions.useDefaultMarker && mapOptions.defectMakers && mapOptions.defectMakers.length ? mapOptions.defectMakers : (defectData.shapeGroup || []);
      const sizeGroup = !mapOptions.useDefaultSize ? mapOptions.defectMakerSizes : [];

      formatGroupNumber(colorGroup, 'color');
      formatGroupNumber(shapeGroup, 'shape');
      formatGroupNumber(sizeGroup, 'size');

      const mapData = getBaseByProduct(defectData.productId);
      if (mapData) {
        const { startDie, diameter } = mapData.property;
        const r = diameter / 2;

        const defectCodes = {};

        defectData.data.forEach((item, index) => {
          // eslint-disable-next-line no-prototype-builtins
          if (!item.hasOwnProperty('defectCode')) {
            if (item.shapeGroupField && item.colorGroupField) {
              // TODO::此处这样处理是有问题，应该按照最后计算出来的形状，颜色组合，但是怎么显示信息就不好处理
              item.defectCode = `${item.shapeGroupField}#${item.colorGroupField}`;
            } else if (item.shapeGroupField || item.colorGroupField) {
              item.defectCode = item.shapeGroupField || item.colorGroupField;
            } else {
              item.defectCode = 'None';
            }
          }
          const dieid = `${item[coorXField]}_${item[coorYField]}`;
          // 处理关联的die
          const die = mapData.data[dieid];
          if (die) {
            die.hasDefect = true;
          }

          let defectColor;
          let colorFormat;
          let defectMarker;
          let defectSize;
          // 取  color
          if (!mapOptions.useDefaultColor) { // 自定义颜色
            const defectColors = getColorOrShape(colorGroup,
              item.colorGroupField, index, 'color');
            defectColor = defectColors[0];
            colorFormat = defectColors[1];
          } else {
            defectColor = mapDefaultColor || mapOptions.defaultDefectColorShow;
            colorFormat = mapOptions.defaultColor || mapOptions.defaultDefectColor;
          }
          // 取 marker
          if (!mapOptions.useDefaultMarker) {
            defectMarker = getColorOrShape(shapeGroup,
              item.shapeGroupField, index, 'shape');
          } else {
            defectMarker = mapDefaultMarker || mapOptions.defaultDefectMarker;
          }

          // 取 marker size
          if (!mapOptions.useDefaultSize) {
            defectSize = getColorOrShape(sizeGroup,
              item.sizeGroupField, index, 'size');
          } else {
            defectSize = mapOptions.defaultSize || mapOptions.defaultDefectSize;
          }
          // Defect Map的坐标是中心，Y轴朝下，X轴朝右
          item.originLeftX = startDie ? item.coorx - startDie.leftx : r - (-item.coorx);
          item.originTopY = startDie ? item.coory - startDie.topy : r - item.coory;

          item.colorShow = defectColor;
          item.colorFormat = colorFormat;
          item.shapeShow = defectMarker;
          item.size = defectSize;

          defectCodes[item.defectCode] = item;
          codeMap[item.defectCode] = item;
        });

        defectData.defectCodes = defectCodes;
        defectData.colorGroup = colorGroup;
        defectData.shapeGroup = shapeGroup;
        defectData.sizeGroup = sizeGroup;
      }
    });

    const totalDefectCodes = sortDefectCode(Object.keys(codeMap))
      .map((val, index) => {
        const cm = codeMap[val];
        return {
          defectCode: val,
          colorShow: cm.colorFormat ? cm.colorFormat : arrToHex(colors[index % len]),
          shapeShow: cm.shapeShow || switchDefectMarker(cm.shapeGroupField),
        };
      });
    defectMapData.forEach(defectData => {
      if (defectData.defectCodes) {
        defectData.defectCodes = sortDefectCode(Object.keys(defectData.defectCodes)).map(code =>
          totalDefectCodes.find(item => item.defectCode === code));
      } else {
        defectData.defectCodes = [];
      }
    });
    return totalDefectCodes;
  }

  // 处理mapData，需要转换坐标
  // eslint-disable-next-line no-unused-vars
  function _formatBaseData(data, prop, centerx, centery, centerDie) {
    const r = prop.diameter / 2;
    const dieW = prop.dieWidth;
    const dieH = prop.dieHeight;

    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    let maxDieX = 1;
    let maxDieY = 1;

    const hasCenter = mapOptions.reticleDie.minX !== 0;
    let startDie = null;
    let endDie = null;
    const zoneDie = {};

    data.forEach((item, idx) => {
      if (item.leftx < minX) {
        minX = item.leftx;
      }
      if (item.rightx > maxX) {
        maxX = item.rightx;
      }

      if (item.topy > maxY) {
        maxY = item.topy;
      }
      if (item.bottomy < minY) {
        minY = item.bottomy;
      }

      if (item.diex > maxDieX) {
        maxDieX = item.diex;
      }

      if (item.diey > maxDieY) {
        maxDieY = item.diey;
      }

      if (hasCenter) {
        if (mapOptions.reticleDie.minX === item.diex && mapOptions.reticleDie.minY === item.diey) {
          startDie = item;
        }
        if (mapOptions.reticleDie.maxX === item.diex && mapOptions.reticleDie.maxY === item.diey) {
          endDie = item;
        }
      }

      // 坐标转换，原始数据坐标系原点为圆心，坐标在四个象限。转换为画图所需：坐标原点在左上角，所有坐标均在四象限。
      // originXX 为转换后的坐标。画 die 以左上角点为起点开始画。
      item.originLeftX = r + (item.leftx - centerx);
      item.originTopY = r - (item.topy - centery);

      // 翻转x轴
      if (mapOptions.reverseDieX) {
        item.originLeftX += (r - item.originLeftX) * 2 - dieW;
      }
      // 翻转y轴
      if (mapOptions.reverseDieY) {
        item.originTopY += (r - item.originTopY) * 2 - dieH;
      }

      item.index = idx;

      // if(centerDie && item.diex == centerDie.diex && item.diey == centerDie.diey){
      //     item.isCenter = true;
      // }

      // 按zoneId分区，方便查找边界die具体要描哪条边
      let zoneId = emptyZoneId;
      if (item.zoneId) {
        zoneId = item.zoneId;
      }
      if (!zoneDie[zoneId]) {
        zoneDie[zoneId] = {};
      }
      const k = `${item.diex}_${item.diey}`;
      zoneDie[zoneId][k] = item;
    });
    let leftD; let rightD; let topD; let
      bottomD;

    // 上下左右边界 die 到 圆弧之间的空白距离
    // eslint-disable-next-line prefer-const
    leftD = r - Math.abs(minX);
    // eslint-disable-next-line prefer-const
    rightD = r - Math.abs(maxX);
    // eslint-disable-next-line prefer-const
    topD = r - Math.abs(maxY);
    // eslint-disable-next-line prefer-const
    bottomD = r - Math.abs(minY);

    const coordinates = {
      minX: r + minX,
      maxX: r + maxX,
      minY: r - maxY,
      maxY: r - minY,
      leftD,
      rightD,
      topD,
      bottomD,
      maxDieX,
      maxDieY,
      startDie,
      endDie,
    };

    // 框选的die的坐标
    if (hasCenter) {
      data.forEach((item) => {
        item.originLeftX = item.leftx - startDie.leftx;
        item.originTopY = item.topy - startDie.topy;
      });
    }

    return { data, coordinates, zoneDie };
  }

  /**
   * die 目标die
   * zoneData指定的zone区域
   * 查找die的边界，即在zone区域中，指定的die没有相邻其他die的那条边就是边界
   */
  function findBoundaryDie(die, zoneData) {
    const { diex, diey } = die;
    // 4条边
    const border4 = Object.create(null);
    border4.left = {
      diex: mapOptions.posX === 'L' ? diex + 1 : diex - 1,
      diey,
    };
    border4.top = {
      diex,
      diey: mapOptions.posY === 'B' ? diey - 1 : diey + 1,
    };
    border4.right = {
      diex: mapOptions.posX === 'L' ? diex - 1 : diex + 1,
      diey,
    };
    border4.bottom = {
      diex,
      diey: mapOptions.posY === 'B' ? diey + 1 : diey - 1,
    };
    const check = {
      leftBoundary: false,
      topBoundary: false,
      rightBoundary: false,
      bottomBoundary: false,
      isBoundary: false
    };
    for (const border in border4) {
      // 不存在其他方向的边界
      if (!zoneData[`${border4[border].diex}_${border4[border].diey}`]) {
        check[`${border}Boundary`] = true;
        check.isBoundary = true;
      }
    }
    return check;
  }

  function getFont(fontType, name = '') {
    const style = fonts && getStyle({ fonts, fontType, name });
    // eslint-disable-next-line no-prototype-builtins
    if (!style || !style.hasOwnProperty('name')) {
      return defaultFonts;
    }
    return style;
  }

  /**
   * 找到边界die
   * @param mapData
   * @param zoneDie
   * @private
   */
  function _mapZoneDie(mapData, zoneDie) {
    const zoneBorderDies = [];
    let i = 0;
    if (!zoneDie[emptyZoneId]) {
      mapData.forEach((item) => {
        // 按zoneId分区，方便查找边界die具体要描哪条边
        Object.assign(item, findBoundaryDie(item, zoneDie[item.zoneId]));
        if (item.isBoundary) {
          zoneBorderDies[i++] = item;
        }
      });
    }
    return zoneBorderDies;
  }

  function _dealAggregate(aggregateItem) {
    // 用户自定义的颜色放在mapOption中
    const defectColors = mapOptions.defectColors || [];

    const oneMap = getBaseByProduct(aggregateItem.productId);
    if (!oneMap) {
      return;
    }

    const font = getFont(4);

    aggregateItem.data.forEach((agData) => {
      const field = agData.aggregateField;
      const colorGroup = dealColor(agData, defectColors, mapOptions.colorModel, field, oneMap.binColorData);
      agData.colorGroupShow = colorGroup;

      const objData = {};
      for (const it in agData.data) {
        const d = agData.data[it];
        const value = d[field];

        if (value !== null && value !== '') {
          // 将字符串转换为数字
          const dval = parseNumber(value);
          const color = colorGroup.find((c) => {
            if (isNumber(c.from)) {
              if (isNumber(c.to)) {
                return c.from <= dval && c.to >= dval;
              }
              return c.to <= dval;
            } if (isNumber(c.to)) {
              return c.to >= dval;
            }
            return c.value == value;
          });
          d.colorShow = color && color.colorShow ? color.colorShow : [0, 0, 0, 0];
        } else {
          d.colorShow = [0, 0, 0, 0];
        }
        d.value = formatTextByPattern(font.textPattern, value);

        const diex = d[mapOptions.diexField];
        const diey = d[mapOptions.dieyField];
        const dieid = `${diex}_${diey}`;
        objData[dieid] = d;
      }
      agData.data = objData;
    });
  }

  function dealColor(item, colorGroups, colorModel, valueField, binColorData) {
    // 取系统分配颜色
    let colors = (item.colorGroup.colors || item.colorGroup || []).map((v) => ({
      from: v.min,
      to: v.max,
      value: v.fieldValue || v.value,
      color: v.color,
    }));

    // 取 bin 的颜色
    // eslint-disable-next-line eqeqeq
    if (colorModel == 1 && binColorData.length > 0) {
      const reg = /\((.+)\)$/;
      const _valueField = valueField.includes('(')
        ? valueField.match(reg)[1]
        : valueField;

      // 取得 bin 字段，hbin/sbin
      let valueFieldLower = _valueField.toLowerCase();
      valueFieldLower = valueFieldLower.indexOf('hbin') !== -1 ? 'hbin' : 'sbin';
      formatGroupNumber(binColorData, 'color');

      colors = binColorData.map((v) => ({
        from: v[valueFieldLower],
        to: v[valueFieldLower],
        colorShow: v.colorShow,
        colorFormat: v.colorFormat,
      }));

      // 取用户自定义
    } else if (colorModel == 2) {
      const colorGroupTemp = (colorGroups || []).find(
        ({ fieldName, colors }) => fieldName === item.aggregateField && colors && colors.length > 0
      );
      if (colorGroupTemp && colorGroupTemp.colors.length > 0) {
        colors = colorGroupTemp.colors;
        formatGroupNumber(colors, 'color');
      }
    } else {
      formatGroupNumber(colors, 'color');
    }
    // 字体格式
    const font = getFont(4);// , item.aggregateField

    colors.forEach(cg => {
      if (cg.value) {
        cg.value = parseNumber(cg.value);
        cg.valueText = formatTextByPattern(font.textPattern, cg.value);
      }
      if (cg.from) {
        cg.from = parseNumber(cg.from);
        cg.fromText = formatTextByPattern(font.textPattern, cg.from);
      }
      if (cg.to) {
        cg.to = parseNumber(cg.to);
        cg.toText = formatTextByPattern(font.textPattern, cg.to);
      }
    });
    return colors;
  }

  /**
   * 获取需要统计的字段
   */
  function getStatTypes() {
    const defectStat = defectStatItems.filter(item => mapOptions[item.key]);
    const defectStat2 = mapOverlayStatItems.filter(item => (mapOptions.defectStatsTypes || []).includes(item.label));
    const stat = {};
    defectStat.concat(defectStat2).forEach(item => stat[item.prop] = item.label);
    return stat;
  }

  function _formatShowFields(tooltips) {
    return (tooltips || []).filter(({ name, enable }) => {
      if (name === 'Zone Name') {
        if (!mapOptions.showZone) {
          return false;
        }
      }
      return enable;
    })
      .map((item) => ({
        ...showFieldsParams.find(({ name }) => name === item.name),
      }));
  }

  const map = {
    init(jsonData, options) {
      jsonData = initData(jsonData, options);
      this.options = mapOptions;
      // 框选范围内的die
      const reticleDie = this.options.reticleDie;

      jsonData.mapData.forEach((item) => {
        let data = item.data;
        if (!data) {
          return;
        }
        // 统计reticleDie
        if (reticleDie.minX !== 0) {
          data = data.filter((dt) => dt.diex >= reticleDie.minX && dt.diex <= reticleDie.maxX &&
              dt.diey >= reticleDie.minY && dt.diey <= reticleDie.maxY);
        }

        const binColorData = item.binColorData;

        // 中心die
        let centerDie = {
          diex: 0,
          diey: 0,
        };

        let centerx = item.centerx;
        let centery = item.centery;
        // eslint-disable-next-line no-prototype-builtins
        if (item.hasOwnProperty('originCenterx')) {
          centerx = item.originCenterx;
          centery = item.originCentery;

          centerDie = {
            diex: item.centerx,
            diey: item.centery,
          };
        }


        // 对坐标进行转换
        const { coordinates, zoneDie } = _formatBaseData(data, item, centerx, centery, centerDie);
        const property = Object.assign({
          ...item,
          data: undefined,
          binColorData: undefined,
        }, coordinates);
        if (coordinates.startDie) {
          property.boxHeight = Math.abs(coordinates.endDie.originTopY - coordinates.startDie.originTopY) + item.dieHeight;
          property.boxWidth = Math.abs(coordinates.endDie.originLeftX - coordinates.startDie.originLeftX) + item.dieWidth;
        }
        property.dieNum = data.length;

        const zoneBorderDies = _mapZoneDie(data, zoneDie);
        mapDatas.push({
          property,
          data: zoneDie,
          binColorData,
          zoneBorderDies,
        });
      });

      this.defectCodes = _dealDefectMapData() || [];

      aggregateData.forEach((aggregateItem) => {
        _dealAggregate(aggregateItem);
      });

      this.zoneConfigData = jsonData.zoneConfigData;

      return this;
    },
    isWaferMap() {
      return isWaferMap(mapOptions.mapType);
    },
    isDefectMap() {
      return isDefectMap(mapOptions.mapType);
    },
    formatShowFields() {
      return _formatShowFields(mapOptions.toolTips);
    },
    getProducts() {
      return mapDatas || [];
    },
    formatWaferShowFields() {
      const tooltips = this.isWaferMap() ? mapOptions.toolTips : waferMapOption.toolTips;
      return _formatShowFields(tooltips);
    },
    formatDefectShowFields() {
      const tooltips = this.isWaferMap() ? [] : mapOptions.toolTips;
      return _formatShowFields(tooltips);
    },
    getMapDataByProductId(productId) {
      return mapDatas.find(data => data.productId === productId);
    },
    getAllAggregateData() {
      return aggregateData;
    },
    getAggregateDataByProduct(productId) {
      return aggregateData.filter(data => data.productId === productId);
    },
    getAggregateDataByProductSplit(productId, splitField) {
      return aggregateData.find(data => data.productId === productId && data.splitField === splitField);
    },
    getDefectDataByProduct(productId) {
      return defectMapData.filter(data => data.productId === productId);
    },
    getDefectDataByProductSplit(productId, splitField) {
      return defectMapData.find(data => data.productId === productId && data.splitField === splitField);
    },
    getStatisticsDataByProductSplit(productId, splitField) {
      const data = {};

      const statsStyle = this.getStatStyle();
      this.getAggregateDataByProductSplit(productId, splitField).forEach(agData => {
        for (const key in agData.statisticsData) {
          data[key] = formatTextByPattern(statsStyle.textPattern, agData.statisticsData[key]);
        }
      });

      const statData = defectStatisticsData.find(data => data.productId === productId && data.splitField === splitField);
      if (statData) {
        const statTypes = getStatTypes();
        for (const key in statTypes) {
          // eslint-disable-next-line no-prototype-builtins
          if (statData.statisticsData.hasOwnProperty(key)) {
            data[statTypes[key]] = formatTextByPattern(statsStyle.textPattern, statData.statisticsData[key]);
          } else {
            data[statTypes[key]] = '';
          }
        }
      }
      return data;
    },
    getAggregateDataStat(aggStatData) {
      const statData = {};
      for (const key in aggStatData) {
        const font = getFont(4, key);
        statData[key] = formatTextByPattern(font.textPattern, aggStatData[key]);
      }
      return statData;
    },
    getDefectStatisticsDataBySplit(productId, splitField) {
      const data = {};
      const statData = defectStatisticsData.find(data => data.productId === productId && data.splitField === splitField);
      if (statData) {
        const statTypes = getStatTypes();
        const statsStyle = this.getStatStyle();
        for (const key in statTypes) {
          // eslint-disable-next-line no-prototype-builtins
          if (statData.statisticsData.hasOwnProperty(key)) {
            data[statTypes[key]] = formatTextByPattern(statsStyle.textPattern, statData.statisticsData[key]);
          } else {
            data[statTypes[key]] = '';
          }
        }
      }
      return data;
    },
    getStatStyle() {
      return getFont(7);
    },
    getStatisticsDataByProduct(productId) {
      const data = [];
      const statsStyle = this.getStatStyle();
      this.getAggregateDataByProduct(productId).forEach(agData => {
        const temp = {};
        for (const key in agData.statisticsData) {
          temp[key] = formatTextByPattern(statsStyle.textPattern, agData.statisticsData[key]);
        }
        data.push({
          productId,
          splitField: agData.splitField,
          statisticsData: temp,
        });
      });

      const statDatas = defectStatisticsData.filter(data => data.productId === productId);
      if (statDatas) {
        const statTypes = getStatTypes();

        statDatas.forEach((statData) => {
          const preIndex = data.findIndex(item => item.splitField === statData.splitField);
          let temp;
          if (preIndex === -1) {
            temp = {};
          } else {
            temp = data[preIndex].statisticsData;
          }

          for (const key in statTypes) {
            // eslint-disable-next-line no-prototype-builtins
            if (statData.statisticsData.hasOwnProperty(key)) {
              temp[statTypes[key]] = formatTextByPattern(statsStyle.textPattern, statData.statisticsData[key]);
            } else {
              temp[statTypes[key]] = '';
            }
          }

          if (preIndex === -1) {
            data.push({
              productId,
              splitField: statData.splitField,
              statisticsData: temp,
            });
          } else {
            data[preIndex].statisticsData = temp;
          }
        });
      }
      return data;
    },
    getDefectMapInfo(index) {
      const defectMaps = this.getAllDefectMapData();
      const data = defectMaps[index] || {};
      const info = {};
      for (const key in data) {
        if (key !== 'data') {
          info[key] = data[key];
        }
      }
      return info;
    },
    // 获取wafer格栅的数据
    getWaferGridData() {
      const splitList = [];
      const products = this.getProducts();
      const options = {
        ...this.options,
        tooltips: this.formatShowFields()
      };

      let index = 0;
      products.forEach(p => {
        const pid = p.property.productId;
        const aggs = this.getAggregateDataByProduct(pid);
        aggs.forEach((aggData, aggIndex) => {
          const statData = this.getAggregateDataStat(aggData.statisticsData);
          Object.assign(statData, this.getDefectStatisticsDataBySplit(pid, aggData.splitField));
          aggData.data.forEach((lastData, itemIndex) => {
            lastData.splitField = (aggData.splitFields || []).join('_');
            splitList.push({
              baseData: p.data,
              zoneBorderDies: p.zoneBorderDies,
              mapProperty: p.property,
              mapOption: options,
              aggregateData: lastData,
              defectData: [],
              statInfo: statData,
              splitField: aggData.splitField,
              zoneAnalysisData: aggData.zoneAnalysisData,
              statStyle: this.getStatStyle(),
              showWaferFields: this.formatWaferShowFields(),
              showDefectFields: this.formatDefectShowFields(),
              index,
              aggIndex,
              itemIndex,
              key: Math.random(),
            });
            index++;
          });
        });
      });

      return splitList;
    },
    getDefectGridData() {
      const splitList = [];
      const products = this.getProducts();
      const options = {
        ...this.options,
        tooltips: this.formatShowFields()
      };
      let index = 0;
      products.forEach(p => {
        const pid = p.property.productId;
        const defects = this.getDefectDataByProduct(pid);
        defects.forEach(deftData => {
          const statData = this.getDefectStatisticsDataBySplit(pid, deftData.splitField);

          let agreData = this.getAggregateDataByProductSplit(pid, deftData.splitField);
          if (!agreData || agreData.data.length === 0) {
            agreData = {
              data: [{}]
            };
          }

          agreData.data.forEach((lastData, itemIndex) => {
            let statInfo = Object.assign({}, statData);
            if (lastData.statisticsData) {
              const statData = this.getAggregateDataStat(lastData.statisticsData);
              statInfo = Object.assign(statInfo, statData);
            }
            splitList.push({
              baseData: p.data,
              zoneBorderDies: p.zoneBorderDies,
              mapProperty: p.property,
              mapOption: options,
              aggregateData: lastData,
              defectData: [deftData],
              statInfo,
              splitField: deftData.splitField,
              zoneAnalysisData: agreData.zoneAnalysisData || [],
              statStyle: this.getStatStyle(),
              showWaferFields: this.formatWaferShowFields(),
              showDefectFields: this.formatDefectShowFields(),
              index,
              aggIndex: 0,
              itemIndex,
              key: Math.random(),
            });
            index++;
          });
        });
      });
      return splitList;
    },
    getGridData() {
      if (this.isWaferMap()) {
        return this.getWaferGridData();
      }
      return this.getDefectGridData();
    },
    randomDefectData(num = 200000) {
      const data = [];

      function getRandomDie(data) {
        let dieid;
        do {
          const diex = Math.floor(Math.random() * 66);
          const diey = Math.floor(Math.random() * 66);
          dieid = `${diex}_${diey}`;
        } while (!data[dieid]);
        return data[dieid];
      }

      this.getWaferGridData().forEach(({ splitField, aggregateData, baseZoneData, mapProperty }) => {
        const splits = splitField.split('_');
        const split2 = splits[1].split('#');

        const dieData = aggregateData.data;
        const defData = [];
        for (let i = 0; i < num; i++) {
          let die = getRandomDie(dieData);
          const dieid = `${die.die_x}_${die.die_y}`;
          for (const zid in baseZoneData) {
            if (baseZoneData[zid][dieid]) {
              die = baseZoneData[zid][dieid];
              break;
            }
          }
          const h = Math.random() * mapProperty.dieHeight;
          const w = Math.random() * mapProperty.dieWidth;
          defData[i] = {
            diey: die.diex,
            diex: die.diey,
            colorGroupField: '101',
            waferId: splits[1],
            shapeGroupField: '101',
            sizeGroupField: 'BIN_2L_FULL_SIZE_NORMAL_BRIGHT_FAIL',
            coory: die.topy + h,
            coorx: die.leftx + w,
            originLeftX: die.originLeftX + w,
            originTopY: die.originTopY + h,
            isImageDefect: Math.random() < 0.4,
            colorShow: [140, 202, 255, 255],
            size: 3,
            shapeShow: 'circle',
          };
        }

        const defect = {
          shapeGroup: [
            {
              value: null,
              min: '1',
              shapeShow: 'Circle',
              max: '21.4'
            },
          ],
          layerId: '',
          data: defData,
          productId: mapProperty.productId,
          colorGroup: [
            {
              value: null,
              min: '1',
              color: '#FF00C800',
              max: '21.4'
            }
          ],
          splitField,
          lotId: split2[0],
          inspectionTimes: [],
          waferId: splits[1],
          waferKeys: []
        };
        data.push(defect);
      });
      defectMapData = data;
      return data;
    },
  };
  return map.init(jsonMap, options);
}
