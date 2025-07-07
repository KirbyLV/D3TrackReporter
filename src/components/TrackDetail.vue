<template>
    <div class="track-section">
        <h2>Track Details</h2>
        <div class="big-bold">Current Track: {{ currentTrackName?.track_description?.value || 'No Track' }}</div>
        <div class="big-bold">Layers present in timeline: {{ layerCount }}</div>
        
        <!-- Debug overlay component -->
        <DebugOverlay 
            :liveUpdate="liveUpdate" 
            :showDebug="true"
            :additionalData="{ layerCount, currentTrackName: currentTrackName?.track_description?.value }"
        >
            <template #additional-info>
                Track: {{ currentTrackName?.track_description?.value || 'No Track' }}<br>
                Layer Count: {{ layerCount }}<br>
            </template>
        </DebugOverlay>
        
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
import DebugOverlay from './DebugOverlay.vue';
    // Access current playhead from global pinia variable
    const store = useLiveUpdateStore();

    const props = defineProps({
        liveUpdate: {
            type: Object,
            required: true
        }
    });

    // Get current track name using autoSubscribe
    const currentTrackName = props.liveUpdate.autoSubscribe('GuiSystem.currentTransportManager', ['object.track.description']);

    // Debug the currentTrackName object
    watch(() => currentTrackName.track_description, (newValue) => {
        console.log('currentTrackName.track_description:', newValue);
        console.log('currentTrackName.track_description.value:', newValue?.value);
    });

    // Get all track layer data in a single subscription using Python list comprehension
    const { allTrackLayers } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
        allTrackLayers: '[{"layerIndex": i, "name": l.name, "sequenceKeys": l.fields[10].sequence.keys, "tStart": l.tStart, "tEnd": l.tEnd} for i, l in enumerate(object.track.layers)]'
    });

    // Debug the data structure
    watch(allTrackLayers, (newValue) => {
        console.log('allTrackLayers data:', newValue);
    });

    // Count layers
    const layerCount = computed(() => {
        return Array.isArray(allTrackLayers.value) ? allTrackLayers.value.length : 0;
    });

    function formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '(No Time)';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Process all track data from the single subscription
    const allTracksReported = computed(() => {
        if (!Array.isArray(allTrackLayers.value)) return [];

        return allTrackLayers.value.map((layerData) => {
            // Clean video asset path with proper null checks
            let videoAsset = '(No Asset)';
            if (layerData?.sequenceKeys && Array.isArray(layerData.sequenceKeys) && layerData.sequenceKeys.length > 0) {
                const firstKey = layerData.sequenceKeys[0];
                if (firstKey?.r?.path && typeof firstKey.r.path === 'string') {
                    const pathNoApxTail = firstKey.r.path.replace(/\.apx$/, '');
                    videoAsset = pathNoApxTail.replace(/^objects\/videoclip\//, '');
                }
            }

            // Format times
            const startTimeSeconds = Number(layerData?.tStart) || 0;
            const endTimeSeconds = Number(layerData?.tEnd) || 0;

            return {
                trackLayer: layerData?.name || `(Unnamed Layer ${layerData?.layerIndex || 0})`,
                videoAsset: videoAsset,
                startTimeSeconds: startTimeSeconds,
                startTime: formatTime(startTimeSeconds),
                endTimeSeconds: endTimeSeconds,
                endTime: formatTime(endTimeSeconds),
            };
        });
    });

    const allTracksSorted = computed(() => {
        return [...allTracksReported.value].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    });

    function exportTableToCSV() {
        const rows = [
            ['Start Time', 'Layer Name', 'Video Asset'],
            ...allTracksSorted.value.map(track => [
                track.startTime,
                track.trackLayer,
                track.videoAsset
            ])
        ];

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
        const playhead = store.currentPlayhead;
        return playhead >= row.startTimeSeconds && playhead < row.endTimeSeconds;
    }
</script>

<style scoped>
    .track-section {
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        position: relative;
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