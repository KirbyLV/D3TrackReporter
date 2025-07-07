<template>
    <div class="logger-section">
        <h2>Played Asset Log</h2>
        <div class="assets-header">Assets will appear below at the start of each clip</div>
        <div class="warn">This window must be active to continue logging</div>
        
        <!-- Debug overlay component -->
        <DebugOverlay 
            :liveUpdate="liveUpdate" 
            :showDebug="true"
            :additionalData="{ layerCount: activeLayerCount, isLogging, logCount: playLog.length }"
        >
            <template #additional-info>
                Layer Count: {{ activeLayerCount }}<br>
                Logging: {{ isLogging ? 'ON' : 'OFF' }}<br>
                Log Entries: {{ playLog.length }}<br>
            </template>
        </DebugOverlay>
            
        <div style="margin: 1em 0;">
            <button :class="isLogging ? 'logging-button-red' : 'logging-button-green'" @click="isLogging = !isLogging">
                {{  isLogging ? 'Stop Logging' : 'Start Logging' }}
            </button>
        </div>
        <details open style="margin-top: 20px;">
            <summary style="cursor: pointer; font-weight: bold;">Played Asset Table <span class="notation">(click to collapse)</span></summary>
            <table class="track-table">
                <thead>
                    <tr>
                        <th>Layer Name</th>
                        <th>Video Asset Path</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in playLog" :key="index">
                        <td class="layer-name">{{ item.layer }}</td>
                        <td class="video-path">{{ item.path }}</td>
                        <td class="start-time">{{  new Date(item.timestamp).toLocaleTimeString() }}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr v-if="!layerReported.length">
                        <td colspan="2" class="italic">No assets played yet.</td>
                    </tr>
                </tfoot>
            </table>
            <button class="button-blue" @click="exportLogToCSV">Export Log to CSV</button>
            <button class="logging-button-red" @click="confirmClearLog">Clear Log</button>
            <p class="notation">Note: The log will only record assets played while logging is enabled.</p>
        </details>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import DebugOverlay from './DebugOverlay.vue';
    
    const props = defineProps({
        liveUpdate: {
            type: Object,
            required: true
        }
    })

    // Get active layers count and basic info using autoSubscribe
    const activeLayers = props.liveUpdate.autoSubscribe('GuiSystem.currentTransportManager', ['object.player.activeLayers']);

    // Get all layer data in a single subscription using Python list comprehension
    const { allLayerData } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
        allLayerData: '[{"layerIndex": i, "name": l.name, "sequenceKeys": l.fields[10].sequence.keys} for i, l in enumerate(object.player.activeLayers)]'
    });

    // Count layers
    const activeLayerCount = computed(() => {
        return Array.isArray(activeLayers.activeLayers?.value) ? activeLayers.activeLayers.value.length : 0;
    });

    // Process all layer data from the single subscription
    const layerReported = computed(() => {
        if (!Array.isArray(allLayerData.value)) return [];

        return allLayerData.value.map((layerData) => {
            let path = '(No path)';
            
            // Extract video path from sequence.keys data for this layer
            if (layerData?.sequenceKeys && Array.isArray(layerData.sequenceKeys) && layerData.sequenceKeys.length > 0) {
                const firstKey = layerData.sequenceKeys[0];
                if (firstKey?.r?.path && typeof firstKey.r.path === 'string') {
                    const fullPath = firstKey.r.path;
                    const pathNoTail = fullPath.replace(/\.apx$/, '');
                    path = pathNoTail.replace(/^objects\/videoclip\//, '');
                }
            }

            return {
                layer: layerData?.name || `Layer ${layerData?.layerIndex || 0}`,
                path: path
            };
        });
    });

    const isLogging = ref(false);
    const playLog = ref([]);
    watch(layerReported, (newEntries) => {
        if (!isLogging.value) return; //Check to see if logging is enabled
        newEntries.forEach(entry => {
            const alreadyLogged = playLog.value.some(log => log.layer === entry.layer && log.path === entry.path);
            // // Use the following if you want to prevent logging entries with the same layer/path combination
            // if (!alreadyLogged && entry.path !== '(No path)') {
            //     playLog.value.push({ ...entry, timestamp: new Date().toISOString() });
            // }
            // Use the following if you want to log every entry, even duplicates
            if (entry.path !== '(No path)') {
                playLog.value.push({ ...entry, timestamp: new Date().toISOString() });
            }
        })
    })

    function exportLogToCSV() {
        const rows = [
            ['Layer Name', 'Video Asset Path', 'Time'],
            ...playLog.value.map(item => [
                item.layer,
                item.path,
                new Date(item.timestamp).toLocaleTimeString()
            ])
        ]

        const csvLogContent = rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvLogContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'play_log.csv');
        link.click();
    }

    //Functions to clear the play log with confirmation
    function confirmClearLog() {
        if (confirm('Are you sure you want to clear the play log? This action cannot be undone.')) {
            clearPlayLog();
        }
    }
    function clearPlayLog() {
        playLog.value = [];
    }
</script>

<style scoped>
    .logger-section {
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        position: relative;
    }
    .logging-button-green {
        box-shadow: 0px 10px 14px -7px #3e7327;
        background:linear-gradient(to bottom, #77b55a 5%, #72b352 100%);
        background-color:#77b55a;
        border-radius:6px;
        border:1px solid #4b8f29;
        display:inline-block;
        cursor:pointer;
        color:#ffffff;
        font-family:Arial;
        font-size:15px;
        font-weight:bold;
        padding:6px 24px;
        text-decoration:none;
        text-shadow:0px 1px 0px #5b8a3c;
    }
    .logging-button-green:hover {
        background:linear-gradient(to bottom, #72b352 5%, #77b55a 100%);
        background-color:#2f5a1a;
    }
    .logging-button-green:active {
        position:relative;
        top:1px;
    }
    .logging-button-red {
        box-shadow:inset 0px 1px 0px 0px #f5978e;
        background:linear-gradient(to bottom, #ef4d42 5%, #ca2719 100%);
        background-color:#f24537;
        border-radius:6px;
        border:1px solid #d02718;
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
    .logging-button-red:hover {
        background:linear-gradient(to bottom, #c62d1f 5%, #f24537 100%);
        background-color:#8e1c13;
    }
    .logging-button-red:active {
        position:relative;
        top:1px;
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
    .assets-list {
        margin-top: 1rem;
        padding: 0.5rem;
        text-align: left;
    }
    .assets-header {
        font-size: 1.2rem;
        font-weight: bold;
    }
    .layer-name {
        font-weight: bold;
    }
    .path-name {
        font-weight: normal;
    }
    .separator {
        margin: 0 0.5rem;
    }
    .warn {
        color: red;
        font-weight: italic;
        margin-top: 0.8rem;
    }
</style>