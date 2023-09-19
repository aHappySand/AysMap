import vue from 'vue';

export const Vue = vue;

// 注册异步组件
export const registerAsyncComponent = ({ name, component }) => {
  Vue.component(name, component);
};

// 注册第三方插件
export const registerPlugin = ({ name, instance, type }) => {
  if (type === 'use') {
    Vue.use(instance);
  } else {
    Vue.prototype[`$${name}`] = instance;
  }
};
