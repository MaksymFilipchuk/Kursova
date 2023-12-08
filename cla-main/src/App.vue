<template>
  <div id="app">
    <Nav />
    <router-view />
  </div>
</template>

<script>
import Nav from "./components/Nav.vue";

export default {
  components: {
    Nav,
  },
};
</script>

<style lang="less">
html,
body {
  margin: 0;
  padding: 0;
}
#app::before{
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url(./assets/back.webp);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(3px); /* Змініть значення "10px" на бажане розмиття */
  z-index: -1; /* Розмістіть псевдоелемент позаду основного вмісту */
}
</style>
