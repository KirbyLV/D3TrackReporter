<template>
    <div class="assets-section">
        <h2>Local Transport Manager</h2>
        <h3>Running Video assets</h3>
        <div class="assets-header">Active Layers playing: {{ activeLayerCount }}</div>
        <div class="assets-list">
            <ul>
                <li v-for="item in layerReported" :key="item.layer">
                    <span class="layer-name">{{ item.layer }}</span>
                    <span class="separator">:</span>
                    <span class="path-name">{{ item.path }}</span>
                </li>
            </ul>
        </div>
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

    // console.log('videoAssetData snapshot:', videoAssetData)

    /*
    <!-- The raw subscription value for the video file names in a specific layer, For debugging -->
    const { videoAsset } = props.liveUpdate.subscribe('GuiSystem.currentTransportManager', { videoAsset: 'object.player.activeLayers[0].fields[10].sequence.keys'})

    console.log('videoAsset.value:', videoAsset.value)
    */
</script>

<style scoped>
    .assets-section {
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
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