<script setup>
import { LiveUpdateOverlay, useLiveUpdate } from '@disguise-one/vue-liveupdate'
// import CurrentVideoAssets from './components/CurrentVideoAssets.vue'
// import TrackDetail from './components/TrackDetail.vue'

// Extract the director endpoint from the URL query parameters
const urlParams = new URLSearchParams(window.location.search)
const directorEndpoint = urlParams.get('director') || '192.168.1.201:80' // Fallback for development

// Initialize the live update composable for the overlay
const liveUpdate = useLiveUpdate(directorEndpoint)
</script>

<template>
  <div class="app">
    <header>
      <h1>CT Disguise Monitoring</h1>
      <nav>
        <router-link to="/track-detail">Track Details</router-link> |
        <router-link to="/current-video-assets">Current Video Assets</router-link> |
        <router-link to="/play-logger">Play Logger</router-link>
      </nav>
    </header>
    <main>
      <router-view v-slot="{ Component }">
        <component :is="Component" :liveUpdate="liveUpdate" />
      </router-view>
      <LiveUpdateOverlay :liveUpdate="liveUpdate" />
    </main>
    <footer>
      <a href="https://ctus.com" target="_blank">
        <img src="./assets/ctlogo.png" class="logo" alt="CT logo" />
      </a>
    </footer>
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
