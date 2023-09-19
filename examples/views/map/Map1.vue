<template>
  <div class="fill">
    <LodashPlugin @loaded="handleLoaded"></LodashPlugin>
    <Map1 v-if="!loadCount"></Map1>
  </div>
</template>

<script>
  export default {
    name: "Map1Page",
    data() {
      return {
        loadCount: 1,
      };
    },

    computed: {},

    methods: {
      handleLoaded() {
        this.loadCount--;
      },
    },
  }
</script>

<style scoped>

</style>
