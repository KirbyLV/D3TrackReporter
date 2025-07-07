<template>
    <div class="debug-overlay" v-if="showDebug">
        <div class="debug-info">
            <strong>Debug Info:</strong><br>
            Active Subscriptions: {{ subscriptionCount }}<br>
            <slot name="additional-info">
                <!-- Additional debug info can be passed via slot -->
            </slot>
            Last Update: {{ lastUpdateTime }}
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
    liveUpdate: {
        type: Object,
        required: true
    },
    showDebug: {
        type: Boolean,
        default: true
    },
    additionalData: {
        type: Object,
        default: () => ({})
    }
});

const lastUpdateTime = ref(new Date().toLocaleTimeString());

// Get actual subscription count from liveUpdate system
const subscriptionCount = computed(() => {
    return props.liveUpdate.debugInfo?.subscriptions?.value?.length || 0;
});

// Watch for changes in additional data to update timestamp
watch(() => props.additionalData, () => {
    lastUpdateTime.value = new Date().toLocaleTimeString();
}, { deep: true });

// Watch subscription count changes
watch(subscriptionCount, () => {
    lastUpdateTime.value = new Date().toLocaleTimeString();
});
</script>

<style scoped>
.debug-overlay {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.8rem;
    z-index: 1000;
    min-width: 200px;
}
.debug-info {
    line-height: 1.4;
}
</style> 