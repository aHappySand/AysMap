import { registerAsyncComponent } from 'examples/config/index';

registerAsyncComponent({
  name: 'Map1',
  component: () => import(/* webpackChunkName: "Map1" */ './Map1'),
});
