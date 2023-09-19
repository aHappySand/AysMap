function createCanvas(diameter) {
  const canvas = document.createElement('canvas');
  canvas.width = diameter;
  canvas.height = diameter;

  const ctx = canvas.getContext('2d');
  return {
    ctx,
    canvas
  };
}

function reCreateCanvas({ canvas, ctx }, diameter) {
  canvas.width = diameter;
  canvas.height = diameter;
  ctx.clearRect(0, 0, diameter, diameter);
}

/**
 * 转换后的数据
 */
export function drawMap(mapData) {
  let containerC; // 最大的一层容器
  let layerC; // 圆 缺口等容器
  let dieC; // die 容器
  let selectedDieC; // 选择的die 容器
  let zoneC; // zone边框的容器
  let defectC; // defect 容器
  let areaC; // 框选的 容器

  let diameter; // 当前圆的直径
  let sourceDiameter; // 初始化时的直径
  let mapProperty;
  let baseData;
  let aggregateData;
  let zoneBorderDies;
  let defectData;
  let mapOption;

  const defaultOptions = {
    dieColor: [0, 0, 0, 0],
    crossDieColor: [127, 221, 255, 82], // '#7FDDFF82'
    circleColor: [234, 234, 234, 255], // '#eaeaea'  圆的颜色
    dieBorderColor: [240, 240, 240, 255], // '#f0f0f0' die边框的颜色
    selectedColor: [255, 255, 0, 255], // 选中时的颜色
    zoneBorderColor: [0, 0, 0, 255], // #000000
    circleStroke: 1,
    zoneStroke: 1,
    dieStroke: 1,
    defectMapShape: 'cross',
    defectSize: 2,
  };

  const emitType = {
    MOUSE_MOVE: 'onMousemove',
    CLICK_DIE: 'clickDie',
    CLICK_DEFECT: 'onSelectDefectCode',
    AREA_SELECT: 'onSelectArea',
  };

  const minScale = 0.5;
  const maxScale = 10;

  // 缩放倍数
  let ratio;
  // 当前宽度的4倍
  let width4;
  // 当前宽度的3倍
  let width3;

  // die 绘制时的宽高
  let dieWidth; let
    dieHeight;


  const dieIndex0 = 1;
  const defectIndex0 = 2;
  // 每个像素对应的信息
  let pxDieData;


  // 选中的die
  let selectedDie = Object.create(null);

  // 框选的范围
  let selectedArea = Object.create(null);
  let areaIndex = -1;

  let translateX = 0;
  let translateY = 0;


  function setOptions(_mapData, reset = false) {
    const { width, height } = _mapData.$el.getBoundingClientRect();
    const min = Math.round(Math.min(width, height)) - 4;


    if (reset) {
      const isSameDiam = diameter === min;
      _mapData.diameter = min;
      diameter = _mapData.diameter;
      translateX = (width - diameter) / 2;
      translateY = (height - diameter) / 2;
      if (isSameDiam) {
        return false;
      }
    }

    mapProperty = _mapData.mapProperty;
    baseData = _mapData.baseData;
    aggregateData = _mapData.sourceAggregateData || {};
    defectData = _mapData.sourceDefectData || [];
    zoneBorderDies = _mapData.zoneBorderDies || [];
    mapOption = _mapData.mapOption;

    ratio = diameter / mapProperty.diameter;
    width4 = diameter * 4;
    width3 = diameter * 3;

    dieWidth = mapProperty.dieWidth * ratio;
    dieHeight = mapProperty.dieHeight * ratio;

    const d = Math.ceil(diameter);
    pxDieData = new Int32Array(d * d * 3);

    if (containerC) {
      reCreateCanvas(containerC, diameter);
      reCreateCanvas(layerC, diameter);
      reCreateCanvas(dieC, diameter);
      reCreateCanvas(defectC, diameter);
    } else {
      containerC = createCanvas(diameter);
      layerC = createCanvas(diameter);
      dieC = createCanvas(diameter);
      defectC = createCanvas(diameter);
    }

    return true;
  }

  function createSelectedDieC() {
    if (selectedDieC) {
      reCreateCanvas(selectedDieC, diameter);
    } else {
      selectedDieC = createCanvas(diameter);
    }
  }

  function createZoneC() {
    if (zoneC) {
      reCreateCanvas(zoneC, diameter);
    } else {
      zoneC = createCanvas(diameter);
    }
  }

  function createDefectC() {
    if (defectC) {
      reCreateCanvas(defectC, diameter);
    } else {
      defectC = createCanvas(diameter);
    }
  }
  function createAreaC(isRecreate = true) {
    if (areaC) {
      isRecreate && reCreateCanvas(areaC, diameter);
    } else {
      areaC = createCanvas(diameter);
    }
  }

  function drawLayer() {
    const imageData = layerC.ctx.getImageData(0, 0, diameter, diameter);
    const imgData = imageData.data;
    // 绘制大圆
    const half = diameter / 2;
    drawCircle({ imgData, x0: half, y0: half, r: half, color: defaultOptions.circleColor, nodeSize: diameter * 10 });

    layerC.ctx.putImageData(imageData, 0, 0);
  }

  function drawDie(showSelect) {
    if (mapData.mapProperty.dieNum < 2) {
      return;
    }


    const imageData = dieC.ctx.getImageData(0, 0, diameter, diameter);
    const imgData = imageData.data;

    let [cr, cg, cb, ca] = defaultOptions.dieBorderColor;

    const dieW = Math.round(dieWidth);
    const dieH = Math.round(dieHeight);
    let { showDieGrid } = mapData;
    if (diameter < 120) {
      showDieGrid = false;
    }
    const hasAggregate = !!aggregateData.data;
    for (const zoneId in baseData) {
      for (const dieid in baseData[zoneId]) {
        const item = baseData[zoneId][dieid];
        const rx = item.originLeftX * ratio;
        const ry = item.originTopY * ratio;
        item.rx = rx;
        item.ry = ry;

        const x = Math.round(rx);
        const y = Math.round(ry);

        const right = Math.round(rx + dieWidth);
        const bottomY = Math.round(ry + dieHeight);


        const aggItem = hasAggregate && aggregateData.data[dieid];

        if (aggItem) {
          let color = aggItem.colorShow;
          // 隐藏选择的die
          if (showSelect === false && selectedDie[dieid]) {
            color = [0, 0, 0, 0];
          }

          fillRect({
            imgData,
            x: x + 1,
            y: y + 1,
            w: dieW,
            h: dieH,
            color,
            index0: dieIndex0,
            index1: Number(item.diex),
            index2: Number(item.diey),
          });

          if (!showDieGrid) {
            const color = aggItem.colorShow || [];
            cr = color[0];
            cg = color[1];
            cb = color[2];
            ca = color[3];
          }
        } else {
          fillRect({
            imgData,
            x: x + 1,
            y: y + 1,
            w: dieW,
            h: dieH,
            color: [0, 0, 0, 0],
            index0: dieIndex0,
            index1: Number(item.diex),
            index2: Number(item.diey),
          });
          if (!showDieGrid) {
            ca = 0;
          }
        }

        drawRect({ imgData, x1: x, y1: y, x2: right, y2: bottomY, color: [cr, cg, cb, ca] });
      }
    }
    dieC.ctx.putImageData(imageData, 0, 0);
  }

  function drawSelectedDie(isShow) {
    createSelectedDieC();
    if (isShow === false) {
      return;
    }
    const imageData = selectedDieC.ctx.getImageData(0, 0, diameter, diameter);
    const imgData = imageData.data;

    const dieW = Math.round(dieWidth);
    const dieH = Math.round(dieHeight);

    for (const dieid in selectedDie) {
      const item = selectedDie[dieid];
      const rx = item.originLeftX * ratio;
      const ry = item.originTopY * ratio;

      const x = Math.round(rx);
      const y = Math.round(ry);

      fillRect({
        imgData,
        x: x + 1,
        y: y + 1,
        w: dieW - 1,
        h: dieH - 1,
        color: defaultOptions.selectedColor,
      });
    }
    selectedDieC.ctx.putImageData(imageData, 0, 0);
  }

  function drawZone() {
    if (zoneBorderDies.length === 0) return;

    let { zoneVisible } = mapData.mapOption;

    if (diameter < 120) {
      zoneVisible = false;
    }

    createZoneC();

    if (!zoneVisible) return;


    const imageData = zoneC.ctx.getImageData(0, 0, diameter, diameter);
    const imgData = imageData.data;

    const [cr, cg, cb, ca] = defaultOptions.zoneBorderColor;

    zoneBorderDies.forEach(item => {
      const rx = item.originLeftX * ratio;
      const ry = item.originTopY * ratio;

      const x = Math.round(rx);
      const y = Math.round(ry);

      const right = Math.round(rx + dieWidth);
      const bottomY = Math.round(ry + dieHeight);

      if (item.topBoundary) {
        const y4 = y * width4;
        for (let i = x; i < right; i++) {
          const index = y4 + i * 4;
          imgData[index] = cr;
          imgData[index + 1] = cg;
          imgData[index + 2] = cb;
          imgData[index + 3] = ca;
        }
      }

      if (item.bottomBoundary) {
        const b4 = bottomY * width4;
        for (let i = x; i < right; i++) {
          const indexB = b4 + i * 4;
          imgData[indexB] = cr;
          imgData[indexB + 1] = cg;
          imgData[indexB + 2] = cb;
          imgData[indexB + 3] = ca;
        }
      }

      if (item.leftBoundary) {
        const x4 = x * 4;
        for (let j = y + 1; j < bottomY; j++) {
          const index = j * width4 + x4;
          imgData[index] = cr;
          imgData[index + 1] = cg;
          imgData[index + 2] = cb;
          imgData[index + 3] = ca;
        }
      }

      if (item.rightBoundary) {
        const r4 = right * 4;
        for (let j = y + 1; j < bottomY; j++) {
          const rIndex = j * width4 + r4;
          imgData[rIndex] = cr;
          imgData[rIndex + 1] = cg;
          imgData[rIndex + 2] = cb;
          imgData[rIndex + 3] = ca;
        }
      }
    });

    zoneC.ctx.putImageData(imageData, 0, 0);
  }


  function hasSelectedDie() {
    for (const i in selectedDie) {
      return true;
    }
    return false;
  }

  function hasSelectedArea() {
    for (const i in selectedArea) {
      return true;
    }
    return false;
  }

  function findDie(id) {
    for (const zoneId in baseData) {
      if (baseData[zoneId][id]) return baseData[zoneId][id];
    }
  }

  function findDieInfo(diex, diey) {
    const id = diey === undefined ? diex : `${diex}_${diey}`;
    const die = findDie(id);
    if (die && aggregateData.data) {
      const agg = aggregateData.data[id] || {};
      return {
        ...die,
        ...agg,
      };
    }
    return die;
  }

  function drawDefect(_defectData) {
    let len = 0;

    if (_defectData) {
      createDefectC();
    }

    _defectData = _defectData || defectData;

    _defectData.forEach(dd => len += dd.data.length);

    const imageData = defectC.ctx.getImageData(0, 0, diameter, diameter);
    const imgData = imageData.data;

    _defectData.forEach(defect => {
      defect.data.forEach(((item, index) => {
        const rx = Math.round(item.originLeftX * ratio);
        const ry = Math.round(item.originTopY * ratio);

        // BEGIN TODO:: 测试用，测完屏蔽掉
        // item.size = 10;
        // item.shapeShow = 'star';
        // END

        const r = item.size / 2;
        switch (item.shapeShow) {
          case 'square': {
            const r1 = r;
            fillRect({
              imgData,
              x: Math.round(rx - r1),
              y: Math.round(ry - r1),
              w: item.size,
              h: item.size,
              color: item.colorShow,
              index0: defectIndex0,
              index1: index,
              index2: 0
            });
            break;
          }
          case 'triangle': {
            fillUpTriangle({
              imgData,
              x: rx,
              y: ry,
              r,
              color: item.colorShow,
              index0: defectIndex0,
              index1: index,
              index2: 0
            });
            break;
          }
          case 'invertedTriangle': {
            fillDownTriangle({
              imgData,
              x: rx,
              y: ry,
              r,
              color: item.colorShow,
              index0: defectIndex0,
              index1: index,
              index2: 0
            });
            break;
          }
          case 'cross': {
            drawCross({
              imgData,
              x: rx,
              y: ry,
              r,
              color: item.colorShow,
              index0: defectIndex0,
              index1: index,
              index2: 0
            });
            break;
          }
          case 'ring': {
            const points = drawCircle({ imgData, x0: rx, y0: ry, r, color: item.colorShow, nodeSize: r * 10 });
            fillPolygon2({ points, color: item.colorShow, index0: defectIndex0, index1: index, index2: 0 });
            break;
          }
          case 'star': {
            pentagram({
              imgData,
              x: rx,
              y: ry,
              R: r,
              color: item.colorShow,
              index0: defectIndex0,
              index1: index,
              index2: 0
            });
            break;
          }
          case 'leftTriangle': {
            fillLeftTriangle({
              imgData,
              x: rx,
              y: ry,
              r,
              color: item.colorShow,
              index0: defectIndex0,
              index1: index,
              index2: 0
            });
            break;
          }
          case 'rightTriangle': {
            fillRightTriangle({
              imgData,
              x: rx,
              y: ry,
              r,
              color: item.colorShow,
              index0: defectIndex0,
              index1: index,
              index2: 0
            });
            break;
          }
          default: {
            const points = drawCircle({ imgData, x0: rx, y0: ry, r, color: item.colorShow, nodeSize: r * 10, index0: defectIndex0, index1: index, index2: 0 });
            fillPolygon2({ imgData, points, color: item.colorShow, index0: defectIndex0, index1: index, index2: 0 });
            break;
          }
        }

        if (item.isImageDefect) {
          const r1 = r + 2;
          drawRect({ imgData, x1: Math.round(rx - r1), y1: Math.round(ry - r1), x2: Math.round(rx + r1), y2: Math.round(ry + r1), color: [0, 0, 0, 255] });
        }
      }));
    });
    defectC.ctx.putImageData(imageData, 0, 0);
  }

  function drawArea() {
    for (const i in selectedArea) {
      let { startX, startY, endX, endY } = selectedArea[i];
      areaC.ctx.fillStyle = 'rgba(146,146,251,0.5)';

      startX *= ratio;
      startY *= ratio;
      endX *= ratio;
      endY *= ratio;

      areaC.ctx.fillRect(startX, startY, endX - startX, endY - startY);
    }
  }

  // <editor-fold desc="绘制各种图形">

  function drawRect({ imgData, x1, y1, x2, y2, color }) {
    const [cr, cg, cb, ca] = color;
    const y1_4 = y1 * width4;
    const y2_4 = y2 * width4;
    for (let i = x1; i < x2; i++) {
      const index = y1_4 + i * 4;
      imgData[index] = cr;
      imgData[index + 1] = cg;
      imgData[index + 2] = cb;
      imgData[index + 3] = ca;

      const indexB = y2_4 + i * 4;
      imgData[indexB] = cr;
      imgData[indexB + 1] = cg;
      imgData[indexB + 2] = cb;
      imgData[indexB + 3] = ca;
    }


    const x1_4 = x1 * 4;
    const x2_4 = x2 * 4;
    for (let j = y1 + 1; j < y2; j++) {
      const index = j * width4 + x1_4;
      imgData[index] = cr;
      imgData[index + 1] = cg;
      imgData[index + 2] = cb;
      imgData[index + 3] = ca;

      const rIndex = j * width4 + x2_4;
      imgData[rIndex] = cr;
      imgData[rIndex + 1] = cg;
      imgData[rIndex + 2] = cb;
      imgData[rIndex + 3] = ca;
    }
  }

  function fillRect({ imgData, x, y, w, h, color, index0, index1, index2 }) {
    let i;
    let j;
    const lastx = x + w;
    const lasty = y + h;

    for (i = x; i < lastx; i++) {
      const x4 = i * 4;
      const x3 = i * 3;
      for (j = y; j < lasty; j++) {
        const index = j * width4 + x4;
        imgData[index] = color[0];
        imgData[index + 1] = color[1];
        imgData[index + 2] = color[2];
        imgData[index + 3] = color[3];

        if (index0) {
          const indexP = j * width3 + x3;
          pxDieData[indexP] = index0;
          pxDieData[indexP + 1] = index1;
          pxDieData[indexP + 2] = index2;
        }
      }
    }
  }
  /**
   * 计算N个点均匀排列成圆的各个点坐标
   * @param nodeSize 参与排列成圆的元素个数
   * @param center 圆的中心点坐标 {x:, y:}
   * @param radius 圆的半径
   * @return 各个元素的坐标：[{x:, y:}, {x:, y:}, ...]
   */
  function drawCircle({ imgData, x0, y0, r, color, index0, index1, index2, nodeSize = 10 }) {
    const pi2 = 2 * Math.PI / nodeSize;
    let i; let _i; let dIndex = 0;
    const layouts = [];
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    for (i = _i = 0; _i < nodeSize; i = ++_i) {
      let x = Math.round(x0 + r * Math.sin(pi2 * i));
      let y = Math.round(y0 + r * Math.cos(pi2 * i));

      if (x >= diameter) x -= 1;
      if (y >= diameter) y -= 1;

      const index = y * width4 + x * 4;
      imgData[index] = color[0];
      imgData[index + 1] = color[1];
      imgData[index + 2] = color[2];
      imgData[index + 3] = color[3];

      if (index0) {
        const indexP = y * width3 + x * 3;
        pxDieData[indexP] = index0;
        pxDieData[indexP + 1] = index1;
        pxDieData[indexP + 2] = index2;
      }

      layouts[dIndex++] = [x, y];
      if (minX > x) {
        minX = x;
      }
      if (minY > y) {
        minY = y;
      }

      if (maxX < x) {
        maxX = x;
      }
      if (maxY < y) {
        maxY = y;
      }
      // layouts[dIndex++] = x;
      // layouts[dIndex++] = y;
    }
    // layouts[dIndex++] = _layouts[0]
    // layouts[dIndex++] = _layouts[1]

    return { layouts, minX, minY, maxX, maxY };
  }

  /**
   * Performs the even-odd-rule Algorithm (a raycasting algorithm) to find out whether a point is in a given polygon.
   * This runs in O(n) where n is the number of edges of the polygon.
   *
   * @param {Array} polygon an array representation of the polygon where polygon[i][0] is the x Value of the i-th point and polygon[i][1] is the y Value.
   * @param {Array} point   an array representation of the point where point[0] is its x Value and point[1] is its y Value
   * @return {boolean} whether the point is in the polygon (not on the edge, just turn < into <= and > into >= for that)
   */
  const pointInPolygon = function (polygon, point) {
    // A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
    let odd = false;
    const count = polygon.length;
    // For each edge (In this case for each point of the polygon and the previous one)
    for (let i = 0, j = count - 1; i < count; i++) {
      // If a line from the point into infinity crosses this edge
      if (((polygon[i][1] > point[1]) !== (polygon[j][1] > point[1])) && // One point needs to be above, one below our y coordinate
        // ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
        (point[0] < ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]))) {
        // Invert odd
        odd = !odd;
      }
      j = i;
    }
    // If the number of crossings was odd, the point is in the polygon
    return odd;
  };

  // eslint-disable-next-line no-unused-vars
  function fillPolygon2({ imgData, points, color, doAlphaBlend = false, index0, index1, index2 }) {
    const { layouts, minX, minY, maxX, maxY } = points;
    // eslint-disable-next-line no-prototype-builtins
    if (!points.hasOwnProperty('minX')) { // 如果没有提供最大，最小值，需要自己计算

    }

    const showImgData = !!imgData;
    const num = color[3];
    const sr = color[0];
    const sg = color[1];
    const sb = color[2];

    for (let y = minY; y <= maxY; y++) {
      const y4 = y * width4;
      const y3 = y * width3;
      for (let x = minX; x < maxX; x++) {
        if (pointInPolygon(layouts, [x, y])) {
          if (showImgData) {
            const index = y4 + x * 4;
            imgData[index] = sr;
            imgData[index + 1] = sg;
            imgData[index + 2] = sb;
            imgData[index + 3] = num;
          }

          const indexP = y3 + x * 3;
          pxDieData[indexP] = index0;
          pxDieData[indexP + 1] = index1;
          pxDieData[indexP + 2] = index2;
        }
      }
    }
  }

  function fillPolygon({ imgData, points, color, index0, index1, index2 }) {
    const width = diameter;
    const height = diameter;
    const num = color[3];
    const sr = color[0];
    const sg = color[1];
    const sb = color[2];

    const pointCount = points.length;
    const array = [];
    // y轴最大，最小值
    let minY = height;
    let maxY = -height;
    for (let i = 1; i < pointCount; i += 2)
    {
      const num5 = points[i];
      if (num5 < minY)
      {
        minY = num5;
      }
      if (num5 > maxY)
      {
        maxY = num5;
      }
    }
    if (minY < -height)
    {
      minY = -height + 1;
    }
    if (maxY >= height)
    {
      maxY = height - 1;
    }

    const showImgData = !!imgData;

    let success = false;
    for (let j = minY; j <= maxY; j++)
    {
      let x = points[0];
      let y = points[1];
      let num8 = 0;
      for (let k = 2; k < pointCount; k += 2)
      {
        const num9 = points[k];
        const num10 = points[k + 1];
        if ((y < j && num10 >= j) || (num10 < j && y >= j))
        {
          array[num8++] = Math.round(x + (j - y) / (num10 - y) * (num9 - x));
        }
        x = num9;
        y = num10;
      }
      for (let l = 1; l < num8; l++)
      {
        const num11 = array[l];
        let num12 = l;
        while (num12 > 0 && array[num12 - 1] > num11)
        {
          array[num12] = array[num12 - 1];
          num12--;
        }
        array[num12] = num11;
      }

      const j4 = j * width4;
      const j3 = j * width3;
      for (let m = 0; m < num8 - 1; m += 2)
      {
        let num13 = array[m];
        let num14 = array[m + 1];
        if (num14 > 0 && num13 < width)
        {
          if (num13 < 0)
          {
            num13 = 0;
          }
          if (num14 >= width)
          {
            num14 = width - 1;
          }
          for (let n = num13; n <= num14; n++)
          {
            if (showImgData) {
              const index = j4 + n * 4;
              imgData[index] = sr;
              imgData[index + 1] = sg;
              imgData[index + 2] = sb;
              imgData[index + 3] = num;
            }

            const indexP = j3 + n * 3;
            pxDieData[indexP] = index0;
            pxDieData[indexP + 1] = index1;
            pxDieData[indexP + 2] = index2;

            success = true;
          }
        }
      }
    }
    return success;
  }

  function fillUpTriangle({ imgData, x, y, r, color, index0, index1, index2 }) {
    const points = [];

    points.push([x - r, y + r]);
    points.push([x, y - r]);
    points.push([x + r, y + r]);

    fillPolygon2({ imgData,
      points: {
        layouts: points,
        minX: x - r,
        maxX: x + r,
        minY: y - r,
        maxY: y + r,
      },
      color,
      index0,
      index1,
      index2 });
  }

  function fillDownTriangle({ imgData, x, y, r, color, index0, index1, index2 }) {
    const points = [];

    points.push([x - r, y - r]);
    points.push([x, y + r]);
    points.push([x + r, y - r]);

    fillPolygon2({ imgData,
      points: {
        layouts: points,
        minX: x - r,
        maxX: x + r,
        minY: y - r,
        maxY: y + r,
      },
      color,
      index0,
      index1,
      index2 });
  }

  function fillLeftTriangle({ imgData, x, y, r, color, index0, index1, index2 }) {
    const points = [];
    points.push([x - r, y]);
    points.push([x + r, y - r]);
    points.push([x + r, y + r]);

    fillPolygon2({ imgData,
      points: {
        layouts: points,
        minX: x - r,
        maxX: x + r,
        minY: y - r,
        maxY: y + r,
      },
      color,
      index0,
      index1,
      index2 });
  }

  function fillRightTriangle({ imgData, x, y, r, color, index0, index1, index2 }) {
    const points = [];

    points.push([x - r, y - r]);
    points.push([x + r, y]);
    points.push([x - r, y + r]);

    fillPolygon2({ imgData,
      points: {
        layouts: points,
        minX: x - r,
        maxX: x + r,
        minY: y - r,
        maxY: y + r,
      },
      color,
      index0,
      index1,
      index2 });
  }

  function drawLine({ imgData, x1, y1, x2, y2, color, index0, index1, index2 }) {
    const k = (y1 - y2) / (x1 - x2);
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const num = color[3];
    const sr = color[0];
    const sg = color[1];
    const sb = color[2];
    for (let x = minX; x < maxX; x++) {
      const y = Math.round(k * (x - x1) + y1);
      if (y >= minY && y <= maxY) {
        const index = x * width4 + y * 4;
        imgData[index] = sr;
        imgData[index + 1] = sg;
        imgData[index + 2] = sb;
        imgData[index + 3] = num;


        const indexP = x * width3 + y * 3;
        pxDieData[indexP] = index0;
        pxDieData[indexP + 1] = index1;
        pxDieData[indexP + 2] = index2;
      }
    }
  }

  function drawCross({ imgData, x, y, r, color, index0, index1, index2 }) {
    const lx = Math.round(x - r);
    const rx = Math.round(x + r);
    const ty = Math.round(y - r);
    const by = Math.round(y + r);

    drawLine({ imgData, x1: lx, y1: ty, x2: rx, y2: by, color, index0, index1, index2 });
    drawLine({ imgData, x1: lx, y1: by, x2: rx, y2: ty, color, index0, index1, index2 });
  }

  // eslint-disable-next-line no-unused-vars
  function fillStar({ imgData, x, y, r, color, index0, index1, index2 }) {
    const w = r * 2;
    const shortVerticalL = r * Math.tan(36 / 180 * Math.PI);
    const longVerticalL = w * Math.sin(36 / 180 * Math.PI);
    x -= r;
    y = y - r + shortVerticalL;

    const x1 = x;
    const y1 = y;

    const x2 = x + r;
    const y2 = y - shortVerticalL;

    const x3 = x + w;
    const y3 = y;

    const x4 = x + w * Math.cos(36 / 180 * Math.PI);
    const y4 = y + longVerticalL;

    const x5 = x + longVerticalL * Math.tan(18 / 180 * Math.PI);
    const y5 = y + longVerticalL;


    // const
    //   x1 = x + w / 2,
    //   y1 = y,
    //   x2 = x + w * Math.cos(36 / 180 * Math.PI),
    //   y2 = y + shortVerticalL + longVerticalL,
    //   x3 = x,
    //   y3 = y + shortVerticalL,
    //   x4 = x + w,
    //   y4 = y + shortVerticalL,
    //   x5 = x + longVerticalL * Math.tan(18 / 180 * Math.PI),
    //   y5 = y + shortVerticalL + longVerticalL;

    const points = [x1, y1, x2, y2, x3, y3, x4, y4, x5, y5];
    fillPolygon({ imgData, points, color, index0, index1, index2 });
  }

  function pentagram({ imgData, R, x, y, color, index0, index1, index2, yDegree = 0 }) {
    const rad = Math.PI / 180; // 每度的弧度值
    const r = R * Math.sin(18 * rad) / Math.cos(36 * rad); // 五角星短轴的长度

    const points = [];
    for (let k = 0; k < 5; k++) {
      points.push([Math.round(x - (R * Math.cos((90 + k * 72 + yDegree) * rad))), Math.round(y - (R * Math.sin((90 + k * 72 + yDegree) * rad)))]);
      points.push([Math.round(x - (r * Math.cos((90 + 36 + k * 72 + yDegree) * rad))), Math.round(y - (r * Math.sin((90 + 36 + k * 72 + yDegree) * rad)))]);
    }
    fillPolygon2({ imgData,
      points: {
        layouts: points,
        minX: x - R,
        maxX: x + R,
        minY: y - R,
        maxY: y + R,
      },
      color,
      index0,
      index1,
      index2 });
  }

  // </editor-fold>

  /**
   * 将各层canvas叠加在一起
   */
  function redrawImg() {
    containerC.ctx.clearRect(0, 0, diameter, diameter);
    containerC.ctx.drawImage(layerC.canvas, 0, 0);
    containerC.ctx.drawImage(dieC.canvas, 0, 0);
    selectedDieC && containerC.ctx.drawImage(selectedDieC.canvas, 0, 0);
    zoneC && containerC.ctx.drawImage(zoneC.canvas, 0, 0);
    containerC.ctx.drawImage(defectC.canvas, 0, 0);
    areaC && containerC.ctx.drawImage(areaC.canvas, 0, 0);
  }

  function redrawForSelect() {
    drawSelectedDie();
    createAreaC();
    drawArea();
    redrawImg();
  }

  /**
   * 绘制各图层
   * @param append
   */
  function initDraw(append) {
    drawLayer();
    drawDie();
    if (selectedDieC || hasSelectedDie()) {
      drawSelectedDie();
    }
    drawZone();
    drawDefect();
    if (areaC || hasSelectedArea()) {
      createAreaC();
      drawArea();
    }
    redrawImg();
    append && mapData.$el.appendChild(containerC.canvas);
    translateContainer();
  }

  // <editor-fold desc="处理事件">
  let isDown = false;
  let isMove = false;
  let isUp = false;
  let isAreaSelect = false;
  let areaPosition = {};
  let scale = 1;
  let startPos = {};

  function emit(type, ...data) {
    mapData.instance.$emit(type, ...data);
  }

  function mousePosition(e) {
    return {
      x: e.offsetX,
      y: e.offsetY,
      px: e.pageX,
      py: e.pageY,
    };
  }

  function handleMouseMoveInfo(x, y, e) {
    const index = y * width3 + x * 3;
    const index0 = pxDieData[index];
    if (index0) {
      const index1 = pxDieData[index + 1];
      const index2 = pxDieData[index + 2];

      let data = {};
      let showFields = mapOption.tooltips;
      // 鼠标在die上滑动
      if (index0 === dieIndex0) {
        data = findDieInfo(index1, index2);
        if (mapData.instance._isDefectMap) {
          showFields = mapData.instance.showFields;
        }
        // showFields =
      } else if (index0 === defectIndex0) {
        for (let i = 0, len = defectData.length; i < len; i++) {
          const itm = defectData[i].data[index1];
          if (itm) {
            data = itm;
            break;
          }
        }
      }
      if (data) {
        mapData.instance.showDieInfo({ rectData: data, showFields, e });
        emit(emitType.MOUSE_MOVE, data);
      }
    } else {
      mapData.instance.hideDieInfo();
    }
  }

  function handleMousedown(e) {
    startPos = mousePosition(e);
    isDown = true;
    document.body.classList.add('no-copy');
    document.addEventListener('mouseup', docMouseup);
  }

  function handleMousemove(e) {
    if (isDown) {
      isMove = true;
    }
    e.preventDefault();
    const { x, y, px, py } = mousePosition(e);
    if (e.ctrlKey) {
      // 框选
      if (isDown) {
        handleMoveAreaSelect(e);
      }
    } else if (!isDown) {
      handleMouseMoveInfo(x, y, e);
    } else {
      // 移动
      translateX += px - startPos.px;
      translateY += py - startPos.py;

      const { $el } = mapData;

      const { width, height } = $el.getBoundingClientRect();

      if (translateX < 0) {
        // translateX = 0;
      } else if (translateX >= $el.scrollWidth - width) {
        // translateX = $el.scrollWidth - width;
      }
      if (translateY < 0) {
        // translateY = 0;
      } else if (translateY >= $el.scrollHeight - height) {
        // translateY = $el.scrollHeight - height;
      }
      // $el.scrollTo(translateX, translateY);
      translateContainer();
      startPos = { x, y, px, py };
    }
  }

  function handleMouseLeave() {
    isMove = false;
  }

  function translateContainer() {
    containerC.canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
  }

  // eslint-disable-next-line no-unused-vars
  function handleScroll(e) {
    const { $el } = mapData;
    translateX = $el.scrollLeft;
    translateY = $el.scrollTop;
  }

  // eslint-disable-next-line no-unused-vars
  function handleMouseup(e) {
    isDown = false;
    if (isMove) {
      isUp = true;
    }
    isMove = false;
    handleMoveAreaSelectEnd();
  }

  function docMouseup() {
    isDown = false;
    isMove = false;
    document.body.classList.remove('no-copy');
    document.removeEventListener('mouseup', docMouseup);
  }

  function handleClick(e) {
    if (isUp) {
      isUp = false;
      return;
    }
    const { x, y } = mousePosition(e);

    if (isClickArea(x, y)) {
      redrawForSelect();
      emit(emitType.CLICK_DIE, selectedDie);
      return;
    }

    const index = y * width3 + x * 3;
    const index0 = pxDieData[index];

    if (index0) {
      // 点在die上
      if (index0 === dieIndex0) {
        const index1 = pxDieData[index + 1];
        const index2 = pxDieData[index + 2];
        const id = `${index1}_${index2}`;
        const data = findDieInfo(index1, index2);
        if (data) {
          // 可以选择
          if (mapData.canSingleChoose) {
            if (selectedDie[id]) {
              delete selectedDie[id];
            } else {
              // ctrl 可以多选
              if (!e.ctrlKey) {
                selectedDie = Object.create(null);
              }
              selectedDie[id] = data;
            }
            drawSelectedDie();
            redrawImg();
            emit(emitType.CLICK_DIE, selectedDie);
          }
        }
      }
    }
  }

  function handleMousewheel(e) {
    if (e.ctrlKey) {
      e.preventDefault();

      if (handleMousewheel.timeout) {
        clearTimeout(handleMousewheel.timeout);
      }
      handleMousewheel.timeout = setTimeout(() => {
        const interval = 0.2;
        const isZoomOut = e.deltaY > 0; // 缩小
        const currDiameter = diameter;
        const { x: mouseX, y: mouseY } = e;

        if (isZoomOut) {
          // 缩小
          scale -= interval;
          if (minScale && scale < minScale) {
            scale = minScale;
          }
        }
        else {
          // 放大
          scale += interval;
          if (maxScale && scale > maxScale) {
            scale = maxScale;
          }
        }
        const { $el } = mapData;
        const { top: pTop, left: pLeft } = $el.getBoundingClientRect();

        // 获取比例
        const yScale = (mouseY - pTop - translateY) / currDiameter;
        const xScale = (mouseX - pLeft - translateX) / currDiameter;
        // 放大后的宽高
        diameter = Math.ceil(sourceDiameter * scale);
        mapData.diameter = diameter;
        // 需要重新运算的 translate 坐标
        const y = yScale * (diameter - currDiameter);
        const x = xScale * (diameter - currDiameter);
        // 更新
        translateY -= y;
        translateX -= x;

        if (translateX < 0) {
          // translateX = 0;
        }
        if (translateY < 0) {
          // translateY = 0;
        }

        setOptions(mapData);
        initDraw();
        // $el.scrollTo(translateX, translateY);
      }, 100);
    } else {
      if (sourceDiameter < diameter) {
        const isUp = e.deltaY < 0 ? -1 : 1; // 往上
        translateY += isUp * 10;
        const cHeight = mapData.$el.getBoundingClientRect().height;
        const half = (cHeight - sourceDiameter) / 2;
        if (translateY > half) {
          translateY = half;
        } else {
          const height = -diameter + cHeight - half;
          if (height > translateY) {
            translateY = height;
          }
        }
        translateContainer();
        e.preventDefault();
      }
    }
  }

  function isClickArea(x, y) {
    let isArea = false;
    for (const i in selectedArea) {
      let { startX, startY, endX, endY } = selectedArea[i];
      startX *= ratio;
      startY *= ratio;
      endX *= ratio;
      endY *= ratio;

      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        const dies = selectedArea[i].dies;
        if (dies) {
          // eslint-disable-next-line no-loop-func
          dies.forEach(id => delete selectedDie[id]);
        }
        delete selectedArea[i];
        isArea = true;
      }
    }
    return isArea;
  }

  function handleMoveAreaSelect(e) {
    const { canBoxChoose } = mapData;
    if (canBoxChoose) {
      isAreaSelect = true;

      const { x, y } = mousePosition(e);

      const startX = Math.min(startPos.x, x);
      const startY = Math.min(startPos.y, y);
      const endX = Math.max(startPos.x, x);
      const endY = Math.max(startPos.y, y);

      areaPosition = {
        startX: startX / ratio,
        startY: startY / ratio,
        endX: endX / ratio,
        endY: endY / ratio,
      };

      createAreaC(canBoxChoose === 1);

      areaC.ctx.fillStyle = 'rgba(146,146,251,0.5)';
      areaC.ctx.fillRect(startX, startY,
        endX - startX, endY - startY);
      redrawImg();
    }
  }

  function handleMoveAreaSelectEnd() {
    if (isAreaSelect) {
      isUp = true;

      const { canBoxChoose } = mapData;
      if (canBoxChoose === 1) {
        if (selectedArea[areaIndex]) {
          findDieDefectInArea({ [areaIndex]: selectedArea[areaIndex] }, false);
          delete selectedArea[areaIndex];
        }
      }
      areaIndex++;
      selectedArea[areaIndex] = areaPosition;
      findDieDefectInArea({ [areaIndex]: areaPosition });

      drawSelectedDie();
      redrawImg();

      emit(emitType.CLICK_DIE, selectedDie);
      const areaData = {
        selectMapData: selectedDie,
        defectCodes: [], // TODO:: 循环选中的defect ，获取defectCodes
        baseData: selectedDie,
        select: true,
        selectArea: selectedArea
      };
      emit(emitType.AREA_SELECT, areaData);
    }
    isAreaSelect = false;
  }

  function findDieDefectInArea(area, isAdd = true) {
    const dieIds = new Set();
    const selectArea = area || selectedArea;
    for (const i in selectArea) {
      let { startX, startY, endX, endY } = selectArea[i];
      startX *= ratio;
      startY *= ratio;
      endX *= ratio;
      endY *= ratio;
      const temp = new Set();

      for (let y = Math.ceil(startY); y <= endY; y++) {
        const y3 = y * width3;
        for (let x = Math.ceil(startX); x <= endX; x++) {
          const index = y3 + x * 3;
          const index0 = pxDieData[index];
          if (index0) {
            temp.add(`${pxDieData[index + 1]}_${pxDieData[index + 2]}`);
          }
        }
      }

      selectedArea[i].dies = temp;
      temp.forEach(id => dieIds.add(id));
    }
    dieIds.forEach(id => {
      const data = findDieInfo(id);
      if (data) {
        if (isAdd) {
          selectedDie[id] = data;
        } else {
          delete selectedDie[id];
        }
      }
    });

    return {
      dieIds,
    };
  }

  function addEvent() {
    const { canvas } = containerC;
    canvas.addEventListener('mousedown', handleMousedown);
    canvas.addEventListener('mousemove', handleMousemove);
    canvas.addEventListener('mouseup', handleMouseup);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousewheel', handleMousewheel);
    const { $el } = mapData;
    $el.addEventListener('scroll', handleScroll);
    $el.addEventListener('mouseleave', handleMouseLeave);
  }

  function removeEvent() {
    const { canvas } = containerC;
    canvas.removeEventListener('mousedown', handleMousedown);
    canvas.removeEventListener('mousemove', handleMousemove);
    canvas.removeEventListener('mouseup', handleMouseup);
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('mousewheel', handleMousewheel);
    const { $el } = mapData;
    $el.removeEventListener('scroll', handleScroll);
    $el.removeEventListener('mouseleave', handleMouseLeave);
  }

  // </editor-fold>


  function destroyCanvas(c) {
    if (c) {
      c.canvas.width = 1;
      c.canvas.height = 1;
      c.ctx.clearRect(0, 0, 1, 1);
      c.canvas = null;
      c = null;
    }
  }

  setOptions(mapData, true);
  sourceDiameter = diameter;
  initDraw(true);
  addEvent();

  return {
    resetOptions(_mapData) {
      const isChange = setOptions(_mapData, true);
      if (isChange) {
        sourceDiameter = diameter;
        initDraw();
      } else {
        translateContainer();
      }
      return this;
    },
    showHideDieBorder() {
      mapData.showDieGrid = !mapData.showDieGrid;
      drawDie();
      redrawImg();
    },
    showHideDie(isShow) {
      if (hasSelectedDie()) {
        drawDie(isShow);
        drawSelectedDie(isShow);
        redrawImg();
      }
    },
    showHideDefect(defectMapData) {
      drawDefect(defectMapData);
      redrawImg();
    },
    cancelSelectedDie() {
      if (hasSelectedDie()) {
        selectedDie = Object.create(null);
        drawDie(true);
        drawSelectedDie(false);
        if (hasSelectedArea()) {
          selectedArea = Object.create(null);
          createAreaC();
        }
        redrawImg();
        emit(emitType.CLICK_DIE, selectedDie);
      }
    },
    showHideZone() {
      drawZone();
      redrawImg();
    },
    destroy() {
      removeEvent();

      destroyCanvas(containerC);
      destroyCanvas(layerC);
      destroyCanvas(dieC);
      destroyCanvas(selectedDieC);
      destroyCanvas(zoneC);
      destroyCanvas(defectC);
      destroyCanvas(areaC);
      pxDieData = null;
    }
  };
}
