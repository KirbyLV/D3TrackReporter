<script setup>
import VideoAssets from './components/VideoAssets.vue'
import { useLiveUpdate, LiveUpdateOverlay } from '@disguise-one/vue-liveupdate'

// Extract the director endpoint from the URL query parameters
const urlParams = new URLSearchParams(window.location.search)
const directorEndpoint = urlParams.get('director') || '172.16.16.230:80' // Fallback for development

// Initialize the live update composable for the overlay
const liveUpdate = useLiveUpdate(directorEndpoint)
</script>

<template>
  <div class="app">
    <h1>CT Disguise Monitoring</h1>

    <VideoAssets :liveUpdate="liveUpdate" />

    <LiveUpdateOverlay :liveUpdate="liveUpdate" />

    <a href="https://ctus.com" target="_blank">
      <img src="./assets/ctlogo.png" class="logo" alt="CT logo" />
    </a>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
