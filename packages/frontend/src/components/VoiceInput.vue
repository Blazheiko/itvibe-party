<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'

const emit = defineEmits<{
    (e: 'text-recognized', text: string): void
}>()

const isRecording = ref(false)
const isProcessing = ref(false)
const showUnsupportedModal = ref(false)
const showNoMicrophoneModal = ref(false)
let recognition: SpeechRecognition | null = null
const speechLang = ref('ru-RU')

// Load language preference from localStorage
onMounted(() => {
    const savedLang = localStorage.getItem('speechRecognitionLang')
    if (savedLang) {
        speechLang.value = savedLang
    }
})

// Check if browser supports speech recognition
const isSpeechRecognitionSupported = () => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

// Check if microphone is available
const checkMicrophoneAvailability = async (): Promise<boolean> => {
    try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return false
        }

        // Try to enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputDevices = devices.filter((device) => device.kind === 'audioinput')

        if (audioInputDevices.length === 0) {
            return false
        }

        // Try to get access to microphone
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            // Stop all tracks immediately after checking
            stream.getTracks().forEach((track) => track.stop())
            return true
        } catch (error) {
            console.error('Microphone access error:', error)
            return false
        }
    } catch (error) {
        console.error('Error checking microphone availability:', error)
        return false
    }
}

const startRecording = async () => {
    if (!isSpeechRecognitionSupported()) {
        showUnsupportedModal.value = true
        return
    }

    // Check microphone availability
    const micAvailable = await checkMicrophoneAvailability()
    if (!micAvailable) {
        showNoMicrophoneModal.value = true
        return
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()

    // Configure recognition
    recognition.lang = speechLang.value // Use language from settings
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
        isRecording.value = true
        console.log('Speech recognition started')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        console.log('Recognized text:', transcript)

        isProcessing.value = true

        // Emit the recognized text
        emit('text-recognized', transcript)

        // Stop recording after getting result
        stopRecording()
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)

        // Show user-friendly error messages
        if (event.error === 'no-speech') {
            alert('No speech detected. Please try again.')
        } else if (event.error === 'not-allowed') {
            alert(
                'Microphone access denied. Please allow microphone access in your browser settings.',
            )
        } else {
            alert(`Speech recognition error: ${event.error}`)
        }

        stopRecording()
    }

    recognition.onend = () => {
        isRecording.value = false
        isProcessing.value = false
        console.log('Speech recognition ended')
    }

    // Start recognition
    try {
        recognition.start()
    } catch (error) {
        console.error('Failed to start speech recognition:', error)
        alert('Failed to start speech recognition. Please try again.')
        isRecording.value = false
    }
}

const stopRecording = () => {
    if (recognition) {
        recognition.stop()
        recognition = null
    }
    isRecording.value = false
    isProcessing.value = false
}

const handleClick = () => {
    if (isRecording.value) {
        stopRecording()
    } else {
        startRecording()
    }
}

const closeUnsupportedModal = () => {
    showUnsupportedModal.value = false
}

const closeNoMicrophoneModal = () => {
    showNoMicrophoneModal.value = false
}

// Cleanup on component unmount
onUnmounted(() => {
    if (recognition) {
        recognition.stop()
    }
})
</script>

<template>
    <button
        class="voice-input-button"
        :class="{ recording: isRecording, processing: isProcessing }"
        @click="handleClick"
        :title="isRecording ? 'Click to stop recording' : 'Click to start voice input'"
    >
        <svg
            v-if="!isRecording && !isProcessing"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
        >
            <!-- Microphone icon -->
            <path
                d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
            />
            <path
                d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
            />
        </svg>

        <svg
            v-else-if="isRecording"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
            class="recording-icon"
        >
            <!-- Stop icon -->
            <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>

        <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
            class="processing-icon"
        >
            <!-- Processing/Loading icon -->
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
    </button>

    <!-- Modal for unsupported browser -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showUnsupportedModal" class="modal-overlay" @click="closeUnsupportedModal">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>Speech Recognition Not Supported</h3>
                        <button class="close-button" @click="closeUnsupportedModal">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                fill="currentColor"
                            >
                                <path
                                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                                />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="icon-container">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="64"
                                height="64"
                                fill="currentColor"
                                class="warning-icon"
                            >
                                <path
                                    d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                                />
                                <path
                                    d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                                />
                            </svg>
                        </div>
                        <p class="modal-message">
                            Speech recognition is not supported in your current browser.
                        </p>
                        <p class="modal-submessage">
                            To use voice input functionality, please use one of the following
                            browsers:
                        </p>
                        <div class="browser-list">
                            <div class="browser-item">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="32"
                                    height="32"
                                >
                                    <circle cx="12" cy="12" r="10" fill="#4285F4" />
                                    <circle cx="12" cy="12" r="7" fill="#fff" />
                                    <circle cx="12" cy="12" r="4" fill="#4285F4" />
                                </svg>
                                <span>Google Chrome</span>
                            </div>
                            <div class="browser-item">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="32"
                                    height="32"
                                >
                                    <circle cx="12" cy="12" r="10" fill="#0078D4" />
                                    <path d="M12 6 L18 12 L12 18 L6 12 Z" fill="#fff" />
                                </svg>
                                <span>Microsoft Edge</span>
                            </div>
                            <div class="browser-item">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="32"
                                    height="32"
                                >
                                    <circle cx="12" cy="12" r="10" fill="#006CFF" />
                                    <path
                                        d="M12 4 Q16 8 16 12 Q16 16 12 20 Q8 16 8 12 Q8 8 12 4"
                                        fill="#fff"
                                    />
                                </svg>
                                <span>Safari</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-button primary" @click="closeUnsupportedModal">
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>

    <!-- Modal for no microphone available -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showNoMicrophoneModal" class="modal-overlay" @click="closeNoMicrophoneModal">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>Microphone Not Available</h3>
                        <button class="close-button" @click="closeNoMicrophoneModal">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                fill="currentColor"
                            >
                                <path
                                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                                />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="icon-container">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="64"
                                height="64"
                                fill="currentColor"
                                class="error-icon"
                            >
                                <path
                                    d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                                />
                                <path
                                    d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                                />
                                <path
                                    d="M2 2 L22 22"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </div>
                        <p class="modal-message">No microphone detected or access denied</p>
                        <p class="modal-submessage">
                            Please check the following to use voice input:
                        </p>
                        <div class="steps-list">
                            <div class="step-item">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <div class="step-title">Connect a Microphone</div>
                                    <div class="step-description">
                                        Make sure a microphone is connected to your device
                                    </div>
                                </div>
                            </div>
                            <div class="step-item">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <div class="step-title">Grant Permission</div>
                                    <div class="step-description">
                                        Allow microphone access when prompted by your browser
                                    </div>
                                </div>
                            </div>
                            <div class="step-item">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <div class="step-title">Check Browser Settings</div>
                                    <div class="step-description">
                                        Verify that microphone permissions are enabled in your
                                        browser settings
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-button primary" @click="closeNoMicrophoneModal">
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.voice-input-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 5px rgba(26, 115, 232, 0.2);
}

.voice-input-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(26, 115, 232, 0.3);
}

.voice-input-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(26, 115, 232, 0.2);
}

.voice-input-button.recording {
    background-color: #e74c3c;
    animation: pulse 1.5s infinite;
}

.voice-input-button.recording:hover {
    background-color: #c0392b;
}

.voice-input-button.processing {
    background-color: #f39c12;
    cursor: wait;
}

.voice-input-button svg {
    width: 20px;
    height: 20px;
}

.recording-icon {
    animation: none;
}

.processing-icon {
    animation: spin 1s linear infinite;
}

@keyframes pulse {
    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
    }
    50% {
        box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {
    .voice-input-button {
        width: 38px;
        height: 38px;
    }

    .voice-input-button svg {
        width: 18px;
        height: 18px;
    }
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 20px;
    backdrop-filter: blur(4px);
}

.modal-content {
    background-color: white;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: slideUp 0.3s ease;
}

.dark-theme .modal-content {
    background-color: #2a2a2a;
}

.modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dark-theme .modal-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color, #333);
}

.dark-theme .modal-header h3 {
    color: #e0e0e0;
}

.close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
    color: #6c757d;
}

.close-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #333;
}

.dark-theme .close-button {
    color: #adb5bd;
}

.dark-theme .close-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: #e0e0e0;
}

.close-button svg {
    width: 20px;
    height: 20px;
}

.modal-body {
    padding: 32px 24px;
    text-align: center;
}

.icon-container {
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
}

.warning-icon {
    color: #ff9800;
    opacity: 0.8;
}

.error-icon {
    color: #f44336;
    opacity: 0.8;
}

.modal-message {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color, #333);
    margin: 0 0 12px 0;
}

.dark-theme .modal-message {
    color: #e0e0e0;
}

.modal-submessage {
    font-size: 14px;
    color: #6c757d;
    margin: 0 0 24px 0;
    line-height: 1.5;
}

.dark-theme .modal-submessage {
    color: #adb5bd;
}

.browser-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
}

.browser-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    transition: all 0.2s ease;
}

.dark-theme .browser-item {
    background-color: rgba(255, 255, 255, 0.05);
}

.browser-item:hover {
    background-color: rgba(0, 0, 0, 0.06);
    transform: translateX(4px);
}

.dark-theme .browser-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
}

.browser-item span {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-color, #333);
}

.dark-theme .browser-item span {
    color: #e0e0e0;
}

.steps-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
    text-align: left;
}

.step-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    transition: all 0.2s ease;
}

.dark-theme .step-item {
    background-color: rgba(255, 255, 255, 0.05);
}

.step-item:hover {
    background-color: rgba(0, 0, 0, 0.06);
    transform: translateX(4px);
}

.dark-theme .step-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
}

.step-number {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 50%;
    background-color: var(--primary-color, #1a73e8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
}

.step-content {
    flex: 1;
}

.step-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color, #333);
    margin-bottom: 4px;
}

.dark-theme .step-title {
    color: #e0e0e0;
}

.step-description {
    font-size: 13px;
    color: #6c757d;
    line-height: 1.4;
}

.dark-theme .step-description {
    color: #adb5bd;
}

.modal-footer {
    padding: 20px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: flex-end;
}

.dark-theme .modal-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-button {
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modal-button.primary {
    background-color: var(--primary-color, #1a73e8);
    color: white;
}

.modal-button.primary:hover {
    background-color: var(--accent-color, #1557b0);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

.modal-button.primary:active {
    transform: translateY(0);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
    transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
    transform: translateY(20px) scale(0.95);
}

@keyframes slideUp {
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .modal-content {
        max-width: 100%;
        margin: 0 16px;
    }

    .modal-header {
        padding: 16px 20px;
    }

    .modal-body {
        padding: 24px 20px;
    }

    .modal-footer {
        padding: 16px 20px;
    }

    .browser-list {
        gap: 10px;
    }

    .browser-item {
        padding: 10px 12px;
    }

    .browser-item span {
        font-size: 14px;
    }

    .steps-list {
        gap: 12px;
    }

    .step-item {
        padding: 12px;
        gap: 12px;
    }

    .step-number {
        width: 28px;
        height: 28px;
        min-width: 28px;
        font-size: 14px;
    }

    .step-title {
        font-size: 14px;
    }

    .step-description {
        font-size: 12px;
    }
}
</style>
