<template>
    <div class="playhead-section">
        <h2>Current Playhead Position</h2>
        <div class="playhead">
            {{ formattedPlayhead }}
        </div>
    </div>
</template>

<script setup>
import { computed, onUnmounted, toRefs, watchEffect } from 'vue'
import { useLiveUpdateStore } from '../stores/liveUpdateStore'

const props = defineProps({
  liveUpdate: { type: Object, required: true }
})

const store = useLiveUpdateStore()

// ⚠️ DO NOT destructure without toRefs — you'll lose reactivity.
const sub = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
  currentPlayhead: 'object.player.tRender'
})

// If `subscribe` returns an object with reactive properties:
const { currentPlayhead } = toRefs(sub) 
// If your API actually returns a ref directly, you can skip toRefs:
// const currentPlayhead = sub.currentPlayhead

// If subscribe returns an unsubscribe function, keep it:
let unsubscribe
if (typeof sub === 'function') {
  unsubscribe = sub
}
onUnmounted(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})

// Normalize units (ms → s) if needed.
const asSeconds = (val) => {
  if (typeof val !== 'number' || Number.isNaN(val)) return 0
  // If tRender is in milliseconds, divide by 1000. If it's already seconds, remove the division.
  return val > 10000 ? val / 1000 : val
}

watchEffect(() => {
  // Because we used toRefs, .value is reactive now.
  const raw = currentPlayhead?.value
  if (typeof raw === 'number') {
    store.updatePlayhead(asSeconds(raw))
    // For debugging:
    // console.log('playhead -> store', asSeconds(raw))
  }
})

// Helper: seconds to mm:ss
function formatSecondsToTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formattedPlayhead = computed(() => {
  const val = currentPlayhead?.value
  return formatSecondsToTime(asSeconds(val))
})
</script>


<style scoped>
    .playhead-section {
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    .playhead {
        font-size: 1.2rem;
        font-weight: bold;
        color: #4a90e2;
    }
    .italic {
        font-style: italic;
    }
    .separator {
        margin: 0 0.5rem;
    }
    .left {
        text-align: left;
    }
    .notation {
        font-style: italic;
        font-size: 0.8rem;
        font-weight: lighter;
    }
</style>