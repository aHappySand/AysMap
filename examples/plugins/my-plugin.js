import { Vue } from 'examples/config';

import {
  ZGridMap
} from 'main/index';

const components = [
  ZGridMap
];


components.forEach((component) => {
  Vue.use(component);
});
