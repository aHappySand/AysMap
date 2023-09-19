import ZGridMap from './src/GridMap';

/* istanbul ignore next */
ZGridMap.install = function install(Vue) {
  Vue.component(ZGridMap.name, ZGridMap);
};

export default ZGridMap;
