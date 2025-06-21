<template>
    <div class="track-section">
        <h2>Track Details</h2>
        <div class="big-bold">Current Track: {{ currentTrackName }}</div>
        <div class="big-bold">Layers present in timeline: {{ layerCount }}</div>
        <details open style="margin-top: 20px;">
            <summary style="cursor: pointer; font-weight: bold;">Layer & Asset Table <span class="notation">(click to collapse)</span></summary>
            <table class="track-table">
                <thead>
                    <tr>
                        <th>Start Time</th>
                        <th>Layer Name</th>
                        <th>Video Asset</th>
                        <th>End Time</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(track, index) in allTracksSorted" :key="track.trackLayer" :class="{ 'active-row': isActiveRow(track)}">
                        <td class="start-time">{{ track.startTime }}</td>
                        <td class="layer-name">{{ track.trackLayer }}</td>
                        <td class="video-path">{{ track.videoAsset }}</td>
                        <td class="start-time">{{ track.endTime }}</td>
                    </tr>
                </tbody>
            </table>
            <button class="button-blue" @click="exportTableToCSV">Export to CSV</button>
        </details>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useLiveUpdateStore } from '../stores/liveUpdateStore';
    // Access current playhead from global pinia variable
    const store = useLiveUpdateStore();

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
                const pathNoApxTail = fullAssetPath.replace(/\.apx$/, '');
                assetPath = pathNoApxTail.replace(/^objects\/videoclip\//, '');
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
    //Getting track layer end times
    const layerEndTimeData = ref({});
    watch(
        () => layerCount.value,
        (count) => {
            if (!count) return;
            const endTimeSubscriptions = {};
            for (let i = 0; i < count; i++) {
                endTimeSubscriptions[`endTime${i}`] = `object.track.layers[${i}].tEnd`;
            }
            // console.log('Layer End Time Subscriptions:', endTimeSubscriptions);

            layerEndTimeData.value = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', endTimeSubscriptions);
        },
        { immediate: true }
    );
    const allLayerEndTimes = computed(() => {
        if (!layerEndTimeData.value) return [];

        return Object.entries(layerEndTimeData.value).map(([key, refValue]) => {
            const raw = refValue?.value ?? refValue;
            return {
                id: key,
                endTime: typeof raw === 'number' ? raw.toFixed(2) : 0
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
            startTime: formatTime(Number(allLayerStartTimes.value[i]?.startTime)) || '(No Time)',
            endTimeSeconds: Number(allLayerEndTimes.value[i]?.endTime) || 0,
            endTime: formatTime(Number(allLayerEndTimes.value[i]?.endTime)) || '(No Time)',
        }))
    })

    const allTracksSorted = computed(() => {
        return [...allTracksReported.value].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
        });

    function exportTableToCSV() {
        const rows = [
            ['Start Time', 'Layer Name', 'Video Asset'],
            ...allTracksSorted.value.map(track => [
                track.startTime,
                track.trackLayer,
                track.videoAsset
            ])
        ]

        const csvContent = rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'track_details.csv');
        link.click();
    }

    // Checking playhead position from global store against track start and end times
    function isActiveRow(row) {
        const playhead = store.currentPlayhead
        return playhead >= row.startTimeSeconds && playhead < row.endTimeSeconds;
    }
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
    .notation {
        font-style: italic;
        font-size: 0.8rem;
        font-weight: lighter;
    }
    .active-row {
        background-color: #ff8af95f;
        font-weight: bold;
    }
    .button-blue {
        box-shadow:inset 0px 1px 0px 0px #8e8ef5;
        background:linear-gradient(to bottom, #379bf2 5%, #271fc6 100%);
        background-color:#373df2;
        border-radius:6px;
        border:1px solid #2118d0;
        display:inline-block;
        cursor:pointer;
        color:#ffffff;
        font-family:Arial;
        font-size:15px;
        font-weight:bold;
        padding:6px 24px;
        text-decoration:none;
        text-shadow:0px 1px 0px #810e05;
    }
    .button-blue:hover {
        background:linear-gradient(to bottom, #271fc6 5%, #379bf2 100%);
        background-color:#131388;
    }
</style>