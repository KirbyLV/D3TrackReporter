<template>
    <div class="track-section">
        <h2>Track Details</h2>>
        <div>{{ layerCount }}</div>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue';
    const props = defineProps({
        liveUpdate: {
            type: Object,
            required: true
        }
    });

    // Track Count
    const { trackLayerArray } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
        trackLayerArray: 'object.track.layers'
    });

    const layerCount = computed(() => {
        return Array.isArray(trackLayerArray.value) ? trackLayerArray.value.length : 0;
    });

    watch(
        () => layerCount.value,
        (count) => {
            if (!count) return;

            const trackSubscriptions = {};
            for (let i = 0; i < count; i++) {
                trackSubscriptions[`trackLayer${i}`] = `object.track.layers[${i}].name`;
            }

            props.liveUpdate.subscribe('GuiSystem.currentTransportManager', trackSubscriptions);
        },
        { immediate: true }
    )
    
    // // Individual Layer Names
    // const { trackLayerName } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
    //     trackLayerName: 'object.track.layers[0].name'
    // });

    // const trackLayerNameValues = computed(() => {
    //     return Array.isArray(trackLayerName.value) ? trackLayerName.value : [];
    // });

    // console.log('Track Details:', trackLayerNameValues);
</script>

<style scoped>
    .track-section {
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    .big-bold {
        font-size: 1.2rem;
        font-weight: bold;
    }
    .italic {
        font-style: italic;
    }

</style>