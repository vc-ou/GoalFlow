<template>
  <view class="app-shell"></view>
</template>

<script setup lang="ts"></script>

<style>
page {
  min-height: 100%;
  background:
    radial-gradient(circle at 14% 0%, rgba(194, 232, 210, 0.48), transparent 32%),
    radial-gradient(circle at 86% 8%, rgba(255, 232, 157, 0.34), transparent 28%),
    linear-gradient(180deg, #f8faf8 0%, #f3f7f3 46%, #eef6f2 100%);
  color: #121827;
  font-family: "Avenir Next", "PingFang SC", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
}

view,
text {
  box-sizing: border-box;
}

button {
  box-sizing: border-box;
  margin: 0;
  padding-top: 0;
  padding-bottom: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

button::after {
  border: none;
}

input,
textarea {
  box-sizing: border-box;
  color: #152033;
}
</style>
