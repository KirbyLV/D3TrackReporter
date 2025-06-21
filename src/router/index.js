// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import CurrentVideoAssets from '../components/CurrentVideoAssets.vue'
import PlayLogger from '../components/PlayLogger.vue'
import TrackDetail from '../components/TrackDetail.vue'

const routes = [
    { path: '/track-detail', name: 'TrackDetail', component: TrackDetail },
    { path: '/play-logger', name: 'PlayLogger', component: PlayLogger },
    { path: '/current-video-assets', name: 'CurrentVideoAssets', component: CurrentVideoAssets },
    {path: '/', redirect: '/current-video-assets'}
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
