<template>
  <div class="fill">
    <ZGridMap :source-data="sourceData" :map-option="mapOption"></ZGridMap>
  </div>
</template>

<script>
import sourceMapData from './sourceMapData';

export default {
  name: 'Map1',
  data() {
    this.sourceData = sourceMapData;
    this.mapOption = {
      mapType: 1,
    };
    return {

    };
  },
};
</script>

<style scoped>

</style>
