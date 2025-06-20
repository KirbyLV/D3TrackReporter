<script setup>
import { LiveUpdateOverlay, useLiveUpdate } from '@disguise-one/vue-liveupdate'
import TrackDetail from './components/TrackDetail.vue'
import VideoAssets from './components/VideoAssets.vue'

// Extract the director endpoint from the URL query parameters
const urlParams = new URLSearchParams(window.location.search)
const directorEndpoint = urlParams.get('director') || '192.168.1.201:80' // Fallback for development

// Initialize the live update composable for the overlay
const liveUpdate = useLiveUpdate(directorEndpoint)
</script>

<template>
  <div class="app">
    <h1>CT Disguise Monitoring</h1>

    <VideoAssets :liveUpdate="liveUpdate" />

    <TrackDetail :liveUpdate="liveUpdate" />

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
  filter: drop-shadow(0 0 2em #e8c442d3);
}
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
