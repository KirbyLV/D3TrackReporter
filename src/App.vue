<script setup>
import { useLiveUpdate } from '@disguise-one/vue-liveupdate';
import { computed, ref, watch } from 'vue';
import CurrentPlayhead from './components/CurrentPlayhead.vue';

// Access stored IP address
const storedIP = localStorage.getItem('directorEndpoint') || '192.168.1.101:80'
const endpointInput = ref(storedIP)

// Save IP address when changed
watch(endpointInput,(newIP) => {
  localStorage.setItem('directorEndpoint', newIP)
  console.log('Saved to localStorage:', newIP)
})

// Initialize liveUpdate directly
const liveUpdate = useLiveUpdate(endpointInput.value)

// Reconnect logic with new endpoint
function localReconnect() {
  localStorage.setItem('directorEndpoint', endpointInput.value)
  window.location.reload()
}

watch(endpointInput, (newVal) => {
  console.log('Updated endpointInput:', newVal)
})
console.log('Target IP:', endpointInput.value)

//Connection status display and classing
const connectionStatus = computed(() => {
  return liveUpdate.status?.value ?? 'unknown'
})

const connectionStatusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'OPEN': return 'status-connected'
    case 'CONNECTING': return 'status-connecting'
    case 'CLOSED': return 'status-disconnected'
    case 'unknown': return 'status-disconnected'
    default: return ''
  }
})
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
    <div v-if="connectionStatus !== 'OPEN'" class="modal-overlay">
      <div class="modal-content">
        <h2>Disconnected</h2>
        <p>Enter IP:port of Disguise Server:</p>
        <input v-model="endpointInput" placeholder="192.168.1.201:80" />
        <button class="button-connect" @click="localReconnect">Reconnect</button>
      </div>
    </div>
    <!-- Always visible component -->
    <CurrentPlayhead :liveUpdate="liveUpdate" />
    <!-- Routed content view -->
    <main>
      <router-view v-slot="{ Component }">
        <component :is="Component" :liveUpdate="liveUpdate" />
      </router-view>
      <!-- Overlay component for lost connection -->
      <!--<LiveUpdateOverlay class="overlay-ui" :liveUpdate="liveUpdate" />-->
    </main>
    <footer>
      <div class="status-bar">
        Connection Status:
        <span :class="connectionStatusClass">{{ connectionStatus }}</span>
      </div>
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
.status-connected {
  color: green;
}
.status-connecting {
  color: orange;
}
.status-disconnected {
  color: red;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6); /* darkened background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: rgb(255, 171, 171);
  color: #333333;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 80%;
  text-align: center;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
}
.modal-content input {
  width: 80%;
  padding: 0.5rem;
  margin-top: 1rem;
  font-size: 1rem;
}
.button-connect {
  box-shadow:inset 0px 1px 0px 0px #8e8ef5;
  background:linear-gradient(to bottom, #379bf2 5%, #271fc6 100%);
  background-color:#373df2;
  border-radius:6px;
  border:1px solid #2118d0;
  display:inline-block;
  cursor:pointer;
  color:#ffffff;
  font-family:Arial;
  font-size:12px;
  font-weight:bold;
  padding:6px 24px;
  text-decoration:none;
  text-shadow:0px 1px 0px #810e05;
}
.button-connect:hover {
  background-color: #131388;
  background: linear-gradient(to bottom, #272fc6 5%, #379bf2 100%);
}
.status-bar {
  margin-top: 1rem;
  font-weight: bold;
}
</style>
