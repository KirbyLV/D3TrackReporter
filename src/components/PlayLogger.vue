<template>
    <div class="logger-section">
        <h2>Played Asset Log</h2>
        <div class="assets-header">Assets will appear below as they are played</div>
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
            <button @click="exportLogToCSV">Export Log to CSV</button>
        </details>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    const props = defineProps({
        liveUpdate: {
            type: Object,
            required: true
        }
    })

    //Dynamically get a list of active layers
    const { activeLayers } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', { activeLayers: 'object.player.activeLayers'})
    
    //count layers
    const activeLayerCount = computed(() => {
        return Array.isArray(activeLayers.value) ? activeLayers.value.length : 0
    });

    //Dynamically get a list of assets
    const layerData = ref({})

    //Watch for layer count changes and subscribe to the active layers
    watch(
        () => activeLayerCount.value,
        (count) => {
            if (!count) return;

            const layerSubscriptions = {};
            for (let i=0; i < count; i++) {
                layerSubscriptions[`layer${i}`] = `object.player.activeLayers[${i}].name`;
            }

            layerData.value = props.liveUpdate.subscribe(
                'GuiSystem.currentTransportManager',
                layerSubscriptions
            );
        },
        { immediate: true }
    )

    const layerNames = computed(() => {
        if (!layerData.value) return [];
        return Object.entries(layerData.value).map(([key, rawValue]) => ({
            id: key,
            name: typeof rawValue === 'string' && rawValue.length > 0 ? rawValue : '(Unnamed)',
        }))
    })

    const videoAssetData = ref({});

    watch(
        () => activeLayerCount.value,
        (count) => {
            if (!count) return;

            const assetSubscriptions = {};
            for (let i = 0; i < count; i++) {
                assetSubscriptions[`asset${i}`] = `object.player.activeLayers[${i}].fields[10].sequence.keys`
            }

            videoAssetData.value = props.liveUpdate.subscribe(
                'GuiSystem.currentTransportManager',
                assetSubscriptions
            );
        },
        { immediate: true }
    )

    const videoAssetList = computed(() => {
        if (!videoAssetData.value) return [];

        return Object.entries(videoAssetData.value).map(([key, refValue]) => {
            const raw = refValue?.value ?? refValue;

            let path = '(No path)';
            if (Array.isArray(raw) && raw.length > 0) {
                const fullPath = raw[0]?.r?.path ?? '';
                const pathNoTail = fullPath.replace(/\.apx$/, '');
                path = pathNoTail.replace(/^objects\/videoclip\//, '');
            }

            return {
                id: key,
                path
            }
        })
    })

    const layerReported = computed(() => {
        return layerNames.value.map((layer, i) => ({
            layer: layer.name,
            path: videoAssetList.value[i]?.path || '(No path)',
        }));
    })

    const playLog = ref([]);
    watch(layerReported, (newEntries) => {
        newEntries.forEach(entry => {
            const alreadyLogged = playLog.value.some(log => log.layer === entry.layer && log.path === entry.path);
            if (!alreadyLogged && entry.path !== '(No path)') {
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
</script>

<style scoped>
    .logger-section {
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
</style>