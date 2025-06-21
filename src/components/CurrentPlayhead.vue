<template>
    <div class="playhead-section">
        <h2>Current Playhead Position</h2>
        <div class="playhead">
            {{ formattedPlayhead }}
        </div>
    </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue';
import { useLiveUpdateStore } from '../stores/liveUpdateStore';
    const props = defineProps({
        liveUpdate: {
            type: Object,
            required: true
        }
    });
    // Subscribe to the current playhead position
    const { currentPlayhead } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
        currentPlayhead: 'object.player.tRender'
    })

    const store = useLiveUpdateStore()

    watchEffect(() => {
        if (typeof currentPlayhead?.value === 'number') {
            store.updatePlayhead(currentPlayhead.value)
        }
    })

    // Helper function: seconds to mm:ss
    function formatSecondsToTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const formattedPlayhead = computed (() => {
        const val = currentPlayhead?.value
        return formatSecondsToTime(val)
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