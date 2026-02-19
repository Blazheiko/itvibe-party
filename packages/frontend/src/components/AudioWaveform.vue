<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
    src: string
}

const props = defineProps<Props>()

const containerRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
const fallbackToNativePlayer = ref(false)
let waveSurfer: {
    load: (url: string) => void
    playPause: () => void
    on: (event: string, cb: () => void) => void
    destroy: () => void
} | null = null

const initWaveSurfer = async () => {
    if (!containerRef.value || !props.src) {
        return
    }

    const module = await import('wavesurfer.js')
    const WaveSurfer = module.default
    waveSurfer = WaveSurfer.create({
        container: containerRef.value,
        waveColor: '#9cb8f5',
        progressColor: '#1a73e8',
        cursorColor: '#1a73e8',
        barWidth: 2,
        barGap: 1.5,
        barRadius: 2,
        height: 52,
        normalize: true,
    })

    waveSurfer.on('play', () => {
        isPlaying.value = true
    })
    waveSurfer.on('pause', () => {
        isPlaying.value = false
    })
    waveSurfer.on('finish', () => {
        isPlaying.value = false
    })
    waveSurfer.on('error', () => {
        fallbackToNativePlayer.value = true
    })

    Promise.resolve(waveSurfer.load(props.src)).catch((error) => {
        console.error('WaveSurfer load failed, fallback to native audio player', error)
        fallbackToNativePlayer.value = true
    })
}

const togglePlay = () => {
    waveSurfer?.playPause()
}

watch(
    () => props.src,
    () => {
        fallbackToNativePlayer.value = false
        if (waveSurfer && props.src) {
            Promise.resolve(waveSurfer.load(props.src)).catch((error) => {
                console.error('WaveSurfer reload failed, fallback to native audio player', error)
                fallbackToNativePlayer.value = true
            })
        }
    },
)

onMounted(() => {
    initWaveSurfer().catch((error) => {
        console.error('Failed to init WaveSurfer', error)
    })
})

onUnmounted(() => {
    waveSurfer?.destroy()
    waveSurfer = null
})
</script>

<template>
    <div class="audio-waveform" v-if="!fallbackToNativePlayer">
        <button
            class="play-toggle"
            @click="togglePlay"
            :title="isPlaying ? 'Pause audio' : 'Play audio'"
            :aria-label="isPlaying ? 'Pause audio' : 'Play audio'"
        >
            <svg
                v-if="!isPlaying"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden="true"
            >
                <path d="M8 5v14l11-7z" />
            </svg>
            <svg
                v-else
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden="true"
            >
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
            </svg>
        </button>
        <div ref="containerRef" class="wave-container"></div>
    </div>
    <div v-else class="audio-fallback">
        <audio :src="src" controls preload="metadata"></audio>
    </div>
</template>

<style scoped>
.audio-waveform {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: center;
    width: min(320px, 70vw);
}

.play-toggle {
    border: none;
    border-radius: 999px;
    width: 34px;
    height: 34px;
    background: rgba(255, 255, 255, 0.3);
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.wave-container {
    min-height: 52px;
}

.audio-fallback audio {
    width: min(320px, 70vw);
}
</style>
