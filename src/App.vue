<script setup>
import { LiveUpdateOverlay, useLiveUpdate } from '@disguise-one/vue-liveupdate'
import CurrentPlayhead from './components/CurrentPlayhead.vue'

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
      <nav class="nav-links">
        <router-link to="/current-video-assets">Current Video Assets</router-link> |
        <router-link to="/track-detail">Track Details</router-link> |
        <router-link to="/play-logger">Play Logger</router-link>
      </nav>
    </header>
    <!-- Always visible component -->
    <CurrentPlayhead :liveUpdate="liveUpdate" />
    <!-- Routed content view -->
    <main>
      <router-view v-slot="{ Component }">
        <component :is="Component" :liveUpdate="liveUpdate" />
      </router-view>
      <LiveUpdateOverlay class="overlay-ui" :liveUpdate="liveUpdate" />
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
.nav-links {
  box-shadow: 0px 1px 0px 0px #fff6af;
	background:linear-gradient(to bottom, #ffec64 5%, #ffab23 100%);
	background-color:#ffec64;
	border-radius:15px;
	border:2px solid #ffaa22;
	display:inline-block;
	color:#333333;
	font-family:Arial;
	font-size:16px;
	font-weight:bold;
	padding:12px 16px;
	text-decoration:none;
	text-shadow:0px 1px 0px #ffffff;
}
.nav-links a {
  color: #333;
  text-decoration: none;
  margin: 0 0.5rem;
}
.nav-links a:hover {
  text-decoration: underline;
}
.nav-links a.router-link-active {
  color: #000;
  font-weight: bold;
  font-size: 18px;
}
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.overlay-ui {
  color: #000;
}
</style>
