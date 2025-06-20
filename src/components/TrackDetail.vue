<template>
    <div class="track-section">
        <h2>Track Details</h2>
        <div class="big-bold">Current Track: {{ currentTrackName }}</div>
        <div class="big-bold">Layers present in timeline: {{ layerCount }}</div>
        <table class="track-table">
            <thead>
                <tr>
                    <th>Start Time</th>
                    <th>Layer Name</th>
                    <th>Video Asset</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(track, index) in allTracksSorted" :key="track.trackLayer">
                    <td class="start-time">{{ track.startTime }}</td>
                    <td class="layer-name">{{ track.trackLayer }}</td>
                    <td class="video-path">{{ track.videoAsset }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
    const props = defineProps({
        liveUpdate: {
            type: Object,
            required: true
        }
    });

    //Get current track name
    const { currentTrackName } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
        currentTrackName: 'object.track.description'
    });

    // Dynamically get a list of track layers
    const { trackLayerArray } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
        trackLayerArray: 'object.track.layers'
    });
    //Count layers
    const layerCount = computed(() => {
        return Array.isArray(trackLayerArray.value) ? trackLayerArray.value.length : 0;
    });
    // Dynamically get a list of track layers
    const trackLayerData = ref({});

    // Watch for layer count changes and subscribe to the track layers
    watch(
        () => layerCount.value,
        (count) => {
            if (!count) return;

            const trackSubscriptions = {};
            for (let i = 0; i < count; i++) {
                trackSubscriptions[`trackLayer${i}`] = `object.track.layers[${i}].name`;
            }

            trackLayerData.value = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', trackSubscriptions);
        },
        { immediate: true }
    )

    // Extract track layer names from the data
    const trackLayerNames = computed(() => {
        if (!trackLayerData.value) return [];
        return Object.entries(trackLayerData.value).map(([key, rawValue]) => ({
            id: key,
            name: typeof rawValue === 'string' && rawValue.length > 0 ? rawValue : '(Unnamed)',
        }));
    });

    // Pull the asset paths for each layer
    const layerVideoAssetData = ref({});
    watch(
        () => layerCount.value,
        (count) => {
            if (!count) return;
            const layerSubscriptions = {};
            for (let i = 0; i < count; i++) {
                layerSubscriptions[`layerVideoAsset${i}`] = `object.track.layers[${i}].fields[10].sequence.keys`;
            }
            // console.log('Layer Video Asset Subscriptions:', layerSubscriptions);

            layerVideoAssetData.value = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', layerSubscriptions);
        },
        { immediate: true }
    );

    //Clean the paths names and eliminate the 'objects/videoclip/' prefix
    const allTrackVideoAssets = computed(() => {
        if (!layerVideoAssetData.value) return [];

        return Object.entries(layerVideoAssetData.value).map(([key, refValue]) => {
            const raw = refValue?.value ?? refValue;

            let assetPath = '(No Asset)';
            if (Array.isArray(raw) && raw.length >0) {
                const fullAssetPath = raw[0]?.r?.path ?? '';
                assetPath = fullAssetPath.replace(/^objects\/videoclip\//, '');
            }

            return {
                id: key,
                assetPath
            }
        })
    });
    
    // Getting the track layer timing
    const layerStartTimeData = ref({});
    watch(
        () => layerCount.value,
        (count) => {
            if (!count) return;
            const timeSubscriptions = {};
            for (let i = 0; i < count; i++) {
                timeSubscriptions[`startTime${i}`] = `object.track.layers[${i}].tStart`;
            }
            // console.log('Layer Start Time Subscriptions:', layerStartSubscriptions);

            layerStartTimeData.value = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', timeSubscriptions);
        },
        { immediate: true }
    );
    const allLayerStartTimes = computed(() => {
        if (!layerStartTimeData.value) return [];

        return Object.entries(layerStartTimeData.value).map(([key, refValue]) => {
            const raw = refValue?.value ?? refValue;
            return {
                id: key,
                startTime: typeof raw === 'number' ? raw.toFixed(2) : 0
            }
        });
    });

    function formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '(No Time)';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Combine track layer names with their corresponding video assets
    const allTracksReported = computed(() => {
        return trackLayerNames.value.map((trackLayer, i) => ({
            trackLayer: trackLayer.name,
            videoAsset: allTrackVideoAssets.value[i]?.assetPath || '(No Asset)',
            startTimeSeconds: Number(allLayerStartTimes.value[i]?.startTime) || 0,
            startTime: formatTime(Number(allLayerStartTimes.value[i]?.startTime)) || '(No Time)'
        }))
    })

    const allTracksSorted = computed(() => {
        return [...allTracksReported.value].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
        });
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
    .separator {
        margin: 0 0.5rem;
    }
    .left {
        text-align: left;
    }
    .track-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1em;
    }

    .track-table th,
    .track-table td {
        padding: 8px 12px;
        border-bottom: 1px solid #ccc;
        text-align: left;
    }
    .track-table th {
        font-weight: bold;
    }

    .layer-name {
        font-weight: bold;
    }

    .video-path {
        font-style: italic;
    }

    .start-time {
        color: #6a5acd;
    }

</style>