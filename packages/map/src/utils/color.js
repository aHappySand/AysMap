/**
 * 255颜色值转16进制颜色值
 * @param n 255颜色值
 * @returns hex 16进制颜色值
 */
export const toHex = (n) => `${n > 15 ? '' : 0}${n.toString(16)}`;

/**
 * 颜色对象转化为16进制颜色字符串
 * @param colorObj 颜色对象
 */
export const toHexString = (colorObj) => {
  const { r, g, b, a = 1 } = colorObj;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a === 1 ? '' : toHex(Math.floor(a * 255))}`;
};

/**
 * 颜色对象转化为rgb颜色字符串
 * @param colorObj 颜色对象
 */
export const toRgbString = (colorObj) => {
  const { r, g, b } = colorObj;
  return `rgb(${r},${g},${b})`;
};

/**
 * 颜色对象转化为rgba颜色字符串
 * @param colorObj 颜色对象
 * @param n
 */
export const toRgbaString = (colorObj, n = 10000) => {
  const { r, g, b, a = 1 } = colorObj;
  return `rgba(${r},${g},${b},${Math.floor(a * n) / n})`;
};

/**
 * 16进制颜色字符串解析为颜色对象
 * @param color 颜色字符串
 * @returns {}
 */
export const parseHexColor = (color) => {
  let hex = color.slice(1);
  let a = 1;
  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  if (hex.length === 8) {
    a = parseInt(hex.slice(6), 16) / 255;
    hex = hex.slice(0, 6);
  }
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
    a,
  };
};

/**
 * rgba颜色字符串解析为颜色对象
 * @param color 颜色字符串
 * @returns {}
 */
export const parseRgbaColor = (color) => {
  const arr = color.match(/(\d(\.\d+)?)+/g) || [];
  const res = arr.map((s) => parseInt(s, 10));
  return {
    r: res[0],
    g: res[1],
    b: res[2],
    a: parseFloat(arr[3]),
  };
};

/**
 * 颜色字符串解析为颜色对象
 * @param color 颜色字符串
 * @returns {}
 */
export const parseColorString = (color) => {
  if (color.startsWith('#')) {
    return parseHexColor(color);
  } if (color.startsWith('rgb')) {
    return parseRgbaColor(color);
  }
  return {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  };

  // throw new Error(`color string error: ${color}`);
};

/**
 * 将颜色 转换为rgba 数组方式
 * @param color
 */
export const parseColorArr = (color) => {
  if (!color) return [0, 0, 0, 0];
  const arr = Object.values(parseColorString(color));
  arr[3] = Math.floor(arr[3] * 255);
  return arr;
};

/**
 * 颜色字符串解析为各种颜色表达方式
 * @param color 颜色字符串
 * @returns
 */
export const getColorInfo = (color) => {
  const colorObj = parseColorString(color);
  const hex = toHexString(colorObj);
  const rgba = toRgbaString(colorObj);
  const rgb = toRgbString(colorObj);
  return {
    hex,
    rgba,
    rgb,
    rgbaObj: colorObj,
  };
};

/**
 * 16进制颜色字符串转化为rgba颜色字符串
 * @param hex 16进制颜色字符串
 * @returns rgba颜色字符串
 */
export const hexToRgba = (hex) => {
  const colorObj = parseColorString(hex);
  return toRgbaString(colorObj);
};

/**
 * rgba颜色字符串转化为16进制颜色字符串
 * @param rgba rgba颜色字符串
 * @returns 16进制颜色字符串
 */
export const rgbaToHex = (rgba) => {
  const colorObj = parseColorString(rgba);
  return toHexString(colorObj);
};

export const arrToHex = (arr) => `#${arr.map(val => {
  let newVal = val.toString(16);
  if (newVal.length === 1) {
    newVal = `0${newVal}`;
  }
  return newVal;
}).join('')}`;
/**
 * @description 计算两个颜色的渐变色 指定比例的中间色
 * @param {String} startColor 渐变色的起始色 hexcolor
 * @param {String} endColor 渐变色的结束色 hexcolor
 */
export function GradientColor(startColor, endColor) {
  // 此处调用了 自定义的 16 进制转换 10 进制的函数
  const startColorDecimalisArray = transfeRgbHex(startColor);
  const endColorDecimalisArray = transfeRgbHex(endColor);
  this.startColorDecimalisArray = startColorDecimalisArray;
  // 两个颜色的差值数组
  this.rgbDifferenceArray = [];
  // endColor 的 rgb 值 分别减掉 startColor 的 rgb 值并分别记录

  for (let index = 0; index < startColorDecimalisArray.length; index++) {
    this.rgbDifferenceArray.push(endColorDecimalisArray[index] - startColorDecimalisArray[index]);
  }
}


GradientColor.prototype = {
  // {Float} proportion 从起始色到结束色的比例 比如从 #000000 到 #FFFFFF 渐变到 50% 时的颜色是 #888888 50%取值为 0.5
  getColor(proportion) {
    // startColor 的 rgb 值 分别加上对应比例的 rgb 差值 得到 结果色值的 rgb 数组
    const resultRgbHexArray = this.rgbDifferenceArray.map((item, index) => {
      let resultVal = Math.round(this.startColorDecimalisArray[index] + item * proportion);
      // 将 10 进制的 值转换为 16 进制
      resultVal = resultVal.toString(16);
      if (resultVal.length === 1) {
        resultVal = `0${resultVal}`;
      }
      return resultVal;
    });
    // 将 16 进制的 rgb 数组转换为 16进制表示法 hexColor 字符串
    return `#${resultRgbHexArray.join('')}`;
  }
};

/**
 * @description 从 hex值中获取 rgb 颜色信息 并转换为 10 进制
 * @param {String} hexcolor hex颜色值
 * @return {Array} 一个包含 用十进制表示 rgba 值的数组[red, green, blue]
 */

function transfeRgbHex(hexcolor) {
  // 10进制的 rgb 值数组
  const rgbDecimalismArray = [];
  // 两位一组转换为 10 进制
  for (let index = 1; index < 7; index += 2) {
    const hexVal = hexcolor.slice(index, index + 2);
    const decimalismVal = parseInt(hexVal, 16);

    if (index < 7) {
      rgbDecimalismArray.push(decimalismVal);
    }
  }
  return rgbDecimalismArray;
}
