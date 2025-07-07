<template>
    <div class="assets-section">
        <h2>Local Transport Manager</h2>
        <h3>Running Video assets</h3>
        <div class="assets-header">Active Layers playing: {{ activeLayerCount }}</div>
        
        <!-- Debug overlay component -->
        <DebugOverlay 
            :liveUpdate="liveUpdate" 
            :showDebug="showDebug"
            :additionalData="{ layerCount: activeLayerCount }"
        >
            <template #additional-info>
                Layer Count: {{ activeLayerCount }}<br>
            </template>
        </DebugOverlay>
        
        <div class="assets-list">
            <ul>
                <li v-for="item in layerReported" :key="item.layer">
                    <span class="layer-name">{{ item.layer }}</span>
                    <span class="separator">:</span>
                    <span class="path-name">{{ item.paths.join(', ') }}</span>
                </li>
            </ul>
        </div>
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

    // Debug state
    const showDebug = ref(true);

    // Get active layers count and basic info using autoSubscribe
    const activeLayers = props.liveUpdate.autoSubscribe('GuiSystem.currentTransportManager', ['object.player.activeLayers']);

    // Subscribe to all sequence.keys for all layers using subscribe (complex Python expression)
    const { allLayerSequenceKeys } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', {
        allLayerSequenceKeys: '[{"layerIndex": i, "layerName": l.name, "sequenceKeys": l.fields[10].sequence.keys} for i, l in enumerate(object.player.activeLayers)]'
    });

    // Watch for changes to log data
    watch(allLayerSequenceKeys, (newValue) => {
        console.log('allLayerSequenceKeys data:', newValue);
    });

    // Process the data structure
    const activeLayerCount = computed(() => {
        // Try multiple ways to access the active layers data
        const layersData = activeLayers.player_activeLayers?.value || 
                          activeLayers.player_activeLayers || 
                          activeLayers.activeLayers?.value ||
                          activeLayers.activeLayers;
        
        console.log('activeLayers object:', activeLayers);
        console.log('layersData:', layersData);
        console.log('layersData type:', typeof layersData);
        console.log('isArray:', Array.isArray(layersData));
        
        return Array.isArray(layersData) ? layersData.length : 0;
    });

    const layerReported = computed(() => {
        if (!Array.isArray(allLayerSequenceKeys.value)) return [];

        return allLayerSequenceKeys.value.map((layerData) => {
            let paths = [];
            
            // Extract video paths from sequence.keys data for this layer
            if (layerData?.sequenceKeys && Array.isArray(layerData.sequenceKeys)) {
                // Iterate through all keys in the sequence using for loop
                for (let i = 0; i < layerData.sequenceKeys.length; i++) {
                    const key = layerData.sequenceKeys[i];
                    if (key?.r?.path) {
                        const fullPath = key.r.path;
                        const pathNoTail = fullPath.replace(/\.apx$/, '');
                        const cleanPath = pathNoTail.replace(/^objects\/videoclip\//, '');
                        paths.push(cleanPath);
                    }
                }
            }

            // Better layer name handling
            let layerName = 'Unknown Layer';
            if (layerData?.layerName && layerData.layerName !== '') {
                layerName = layerData.layerName;
            } else if (layerData?.layerIndex !== undefined) {
                layerName = `Layer ${layerData.layerIndex}`;
            }

            return {
                layer: layerName,
                paths: paths.length > 0 ? paths : ['(No path)']
            };
        });
    });
</script>

<style scoped>
    .assets-section {
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        position: relative;
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