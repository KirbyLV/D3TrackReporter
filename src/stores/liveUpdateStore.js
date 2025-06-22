import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLiveUpdateStore = defineStore('liveUpdate', () => {
    const currentPlayhead = ref(0)

    function updatePlayhead(newValue) {
        currentPlayhead.value = newValue
    }

    const formattedPlayhead = computed(() => {
        const secs = Math.floor(currentPlayhead.value % 60)
        const mins = Math.floor(currentPlayhead.value / 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    })

    const ipAddress = ref(0)

    function updateIP(newValue) {
        ipAddress.value = newValue
    }

    return {
        currentPlayhead,
        formattedPlayhead,
        ipAddress,
        updatePlayhead,
        updateIP
    }
    
})

