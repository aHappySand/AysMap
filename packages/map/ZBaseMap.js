import ZBaseMap from './src/BaseMap';

/* istanbul ignore next */
ZBaseMap.install = function install(Vue) {
  Vue.component(ZBaseMap.name, ZBaseMap);
};

export default ZBaseMap;
