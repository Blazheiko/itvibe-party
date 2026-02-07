import { ref, onUnmounted } from 'vue'
import { useEventBus } from '@/utils/event-bus'

export interface WebRTCConfig {
    iceServers: RTCIceServer[]
}

export interface MediaDevice {
    deviceId: string
    label: string
    kind: MediaDeviceKind
}

export interface CallState {
    isConnecting: boolean
    isConnected: boolean
    isLocalVideoEnabled: boolean
    isLocalAudioEnabled: boolean
    isRemoteVideoEnabled: boolean
    isRemoteAudioEnabled: boolean
    isScreenSharing: boolean
    error: string | null
}

export const useWebRTC = () => {
    const eventBus = useEventBus()

    // WebRTC состояние
    let peerConnection: RTCPeerConnection | null = null // Не реактивный - используется только внутри composable
    let localStream: MediaStream | null = null // Не реактивный - управляется через JavaScript
    let remoteStream: MediaStream | null = null // Не реактивный - управляется через JavaScript
    let currentTargetUserId: string | number | null = null // ID пользователя для текущего звонка
    let pendingIceCandidates: RTCIceCandidateInit[] = [] // Буфер для ICE candidates до инициализации peer connection
    let selectedVideoDeviceId: string | null = null // ID выбранной камеры
    let selectedAudioDeviceId: string | null = null // ID выбранного микрофона
    let screenStream: MediaStream | null = null // Поток для screen sharing
    let originalVideoTrack: MediaStreamTrack | null = null // Оригинальный видео трек (камера) для восстановления
    const callState = ref<CallState>({
        isConnecting: false,
        isConnected: false,
        isLocalVideoEnabled: false,
        isLocalAudioEnabled: false,
        isRemoteVideoEnabled: false,
        isRemoteAudioEnabled: false,
        isScreenSharing: false,
        error: null,
    })

    // Состояние для медиа устройств
    const availableVideoDevices = ref<MediaDevice[]>([])
    const availableAudioDevices = ref<MediaDevice[]>([])
    const currentVideoDevice = ref<string | null>(null)
    const currentAudioDevice = ref<string | null>(null)

    // Конфигурация ICE серверов (можно вынести в настройки)
    const defaultConfig: WebRTCConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ],
    }

    // Инициализация WebRTC соединения
    const initializePeerConnection = (config: WebRTCConfig = defaultConfig) => {
        try {
            peerConnection = new RTCPeerConnection(config)

            // Обработчики событий WebRTC
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && currentTargetUserId) {
                    console.log('ICE candidate:', event.candidate)
                    // Отправляем ICE candidate через WebSocket с targetUserId
                    eventBus.emit('webrtc_ice_candidate', {
                        candidate: event.candidate,
                        targetUserId: currentTargetUserId,
                    })
                }
            }

            peerConnection.oniceconnectionstatechange = () => {
                const state = peerConnection?.iceConnectionState
                console.log('ICE connection state:', state)

                if (!state) return

                switch (state as RTCIceConnectionState) {
                    case 'checking':
                    case 'new':
                        callState.value.isConnecting = true
                        callState.value.isConnected = false
                        callState.value.error = null
                        // Эмитируем событие изменения состояния соединения
                        eventBus.emit('webrtc_connection_state_changed', {
                            state: 'connecting',
                            isConnecting: true,
                            isConnected: false,
                        })
                        break
                    case 'connected':
                    case 'completed':
                        callState.value.isConnecting = false
                        callState.value.isConnected = true
                        callState.value.error = null
                        // Эмитируем событие успешного соединения
                        eventBus.emit('webrtc_connection_state_changed', {
                            state: 'connected',
                            isConnecting: false,
                            isConnected: true,
                        })
                        break
                    case 'disconnected':
                    case 'failed':
                    case 'closed':
                        callState.value.isConnecting = false
                        callState.value.isConnected = false
                        if (state === 'failed') {
                            callState.value.error = 'Connection failed'
                        }
                        // Эмитируем событие разрыва соединения
                        eventBus.emit('webrtc_connection_state_changed', {
                            state: state,
                            isConnecting: false,
                            isConnected: false,
                            error: state === 'failed' ? 'Connection failed' : null,
                        })
                        break
                }
            }

            peerConnection.ontrack = (event) => {
                console.log('🎥 ontrack: Remote track received:', event)
                if (event.streams && event.streams[0]) {
                    remoteStream = event.streams[0]
                    console.log(
                        '🎥 ontrack: Remote stream set, tracks:',
                        remoteStream.getTracks().length,
                    )

                    // Проверяем типы треков
                    event.streams[0].getTracks().forEach((track) => {
                        console.log(`🎥 Remote track: ${track.kind}, enabled: ${track.enabled}`)
                        if (track.kind === 'video') {
                            callState.value.isRemoteVideoEnabled = track.enabled
                        } else if (track.kind === 'audio') {
                            callState.value.isRemoteAudioEnabled = track.enabled
                        }
                    })

                    // Эмитируем событие для немедленного обновления UI
                    console.log('🎥 ontrack: emitting webrtc_remote_stream_updated event')
                    eventBus.emit('webrtc_remote_stream_updated', { stream: remoteStream })
                    console.log('🎥 ontrack: event emitted')
                }
            }

            peerConnection.ondatachannel = (event) => {
                console.log('Data channel received:', event.channel)
                // Можно добавить обработку data channel для дополнительных функций
            }

            return peerConnection
        } catch (error) {
            console.error('Failed to initialize peer connection:', error)
            callState.value.error = 'Failed to initialize connection'
            return null
        }
    }

    // Получение списка доступных медиа устройств
    const getMediaDevices = async (): Promise<{
        videoDevices: MediaDevice[]
        audioDevices: MediaDevice[]
    }> => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()

            const videoDevices: MediaDevice[] = devices
                .filter((device) => device.kind === 'videoinput')
                .map((device) => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
                    kind: device.kind,
                }))

            const audioDevices: MediaDevice[] = devices
                .filter((device) => device.kind === 'audioinput')
                .map((device) => ({
                    deviceId: device.deviceId,
                    label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
                    kind: device.kind,
                }))

            availableVideoDevices.value = videoDevices
            availableAudioDevices.value = audioDevices

            console.log('📹 Available video devices:', videoDevices)
            console.log('🎤 Available audio devices:', audioDevices)

            return { videoDevices, audioDevices }
        } catch (error) {
            console.error('Failed to get media devices:', error)
            return { videoDevices: [], audioDevices: [] }
        }
    }

    // Получение пользовательских медиа (камера/микрофон)
    const getUserMedia = async (constraints: MediaStreamConstraints) => {
        try {
            callState.value.error = null
            console.log('📹 getUserMedia: requesting media with constraints:', constraints)
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            localStream = stream
            console.log('📹 getUserMedia: got stream with tracks:', stream.getTracks().length)

            // Обновляем состояние локальных медиа
            stream.getTracks().forEach((track) => {
                console.log(`📹 Track: ${track.kind}, enabled: ${track.enabled}`)
                if (track.kind === 'video') {
                    callState.value.isLocalVideoEnabled = track.enabled
                } else if (track.kind === 'audio') {
                    callState.value.isLocalAudioEnabled = track.enabled
                }
            })

            // Эмитируем событие для обновления UI
            console.log('📹 getUserMedia: emitting webrtc_local_stream_updated event')
            eventBus.emit('webrtc_local_stream_updated', { stream: localStream })
            console.log('📹 getUserMedia: event emitted')

            return stream
        } catch (error) {
            console.error('Failed to get user media:', error)
            callState.value.error = 'Failed to access camera/microphone'
            throw error
        }
    }

    // Подготовка к звонку - получение медиа потока без отправки offer
    const prepareCall = async (callType: 'video' | 'audio', targetUserId: string | number) => {
        try {
            callState.value.isConnecting = true
            callState.value.error = null

            // Сохраняем targetUserId для использования в ICE кандидатах
            currentTargetUserId = targetUserId

            // Инициализируем peer connection
            const pc = initializePeerConnection()
            if (!pc) throw new Error('Failed to initialize peer connection')

            // Получаем пользовательские медиа с учетом выбранных устройств
            const constraints: MediaStreamConstraints = {
                audio: selectedAudioDeviceId
                    ? { deviceId: { exact: selectedAudioDeviceId } }
                    : true,
                video:
                    callType === 'video'
                        ? selectedVideoDeviceId
                            ? { deviceId: { exact: selectedVideoDeviceId } }
                            : true
                        : false,
            }

            const stream = await getUserMedia(constraints)

            // Добавляем локальные треки в peer connection
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream)
            })

            console.log('Call prepared, media stream ready')
            return true
        } catch (error) {
            console.error('Failed to prepare call:', error)
            callState.value.isConnecting = false
            callState.value.error = 'Failed to prepare call'
            return false
        }
    }

    // Отправка offer после подготовки
    const sendOffer = async (callType: 'video' | 'audio', targetUserId: string | number) => {
        try {
            if (!peerConnection) {
                throw new Error('Peer connection not initialized')
            }

            // Создаем offer
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)

            // Отправляем offer через WebSocket
            eventBus.emit('webrtc_call_offer', {
                targetUserId,
                callType,
                offer: offer,
            })

            console.log('Offer sent')
            return true
        } catch (error) {
            console.error('Failed to send offer:', error)
            callState.value.error = 'Failed to send offer'
            return false
        }
    }

    // Начало исходящего звонка (объединяет prepareCall и sendOffer)
    const startCall = async (callType: 'video' | 'audio', targetUserId: string | number) => {
        try {
            const prepared = await prepareCall(callType, targetUserId)
            if (!prepared) return false

            const sent = await sendOffer(callType, targetUserId)
            if (!sent) return false

            console.log('Call started, offer sent')
            return true
        } catch (error) {
            console.error('Failed to start call:', error)
            callState.value.isConnecting = false
            callState.value.error = 'Failed to start call'
            return false
        }
    }

    // Подготовка к принятию звонка - получение медиа потока без отправки answer
    const prepareAcceptCall = async (
        callType: 'video' | 'audio',
        offer: RTCSessionDescriptionInit,
        targetUserId: string | number,
    ) => {
        try {
            callState.value.isConnecting = true
            callState.value.error = null

            // Сохраняем targetUserId для использования в ICE кандидатах
            currentTargetUserId = targetUserId

            // Инициализируем peer connection
            const pc = initializePeerConnection()
            if (!pc) throw new Error('Failed to initialize peer connection')

            // Получаем пользовательские медиа с учетом выбранных устройств
            const constraints: MediaStreamConstraints = {
                audio: selectedAudioDeviceId
                    ? { deviceId: { exact: selectedAudioDeviceId } }
                    : true,
                video:
                    callType === 'video'
                        ? selectedVideoDeviceId
                            ? { deviceId: { exact: selectedVideoDeviceId } }
                            : true
                        : false,
            }

            const stream = await getUserMedia(constraints)

            // Добавляем локальные треки в peer connection
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream)
            })

            console.log('Local stream set up in prepareAcceptCall, tracks added to peer connection')

            // Устанавливаем удаленное описание (offer)
            await pc.setRemoteDescription(offer)

            // Применяем отложенные ICE candidates после установки remote description
            await applyPendingIceCandidates()

            console.log('Call prepared for acceptance, media stream ready')
            return true
        } catch (error) {
            console.error('Failed to prepare accept call:', error)
            callState.value.isConnecting = false
            callState.value.error = 'Failed to prepare accept call'
            return false
        }
    }

    // Отправка answer после подготовки
    const sendAnswer = async (targetUserId: string | number) => {
        try {
            if (!peerConnection) {
                throw new Error('Peer connection not initialized')
            }

            // Создаем answer
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)

            // Отправляем answer через WebSocket с targetUserId
            console.log('Emitting webrtc_call_answer event with targetUserId:', targetUserId)
            eventBus.emit('webrtc_call_answer', {
                answer: answer,
                targetUserId: targetUserId,
            })

            console.log('Answer sent')
            return true
        } catch (error) {
            console.error('Failed to send answer:', error)
            callState.value.error = 'Failed to send answer'
            return false
        }
    }

    // Принятие входящего звонка (объединяет prepareAcceptCall и sendAnswer)
    const acceptCall = async (
        callType: 'video' | 'audio',
        offer: RTCSessionDescriptionInit,
        targetUserId: string | number,
    ) => {
        try {
            const prepared = await prepareAcceptCall(callType, offer, targetUserId)
            if (!prepared) return false

            const sent = await sendAnswer(targetUserId)
            if (!sent) return false

            console.log('Call accepted, answer sent')
            return true
        } catch (error) {
            console.error('Failed to accept call:', error)
            callState.value.isConnecting = false
            callState.value.error = 'Failed to accept call'
            return false
        }
    }

    // Применение отложенных ICE candidates
    const applyPendingIceCandidates = async () => {
        if (!peerConnection || pendingIceCandidates.length === 0) {
            return
        }

        console.log(`Applying ${pendingIceCandidates.length} pending ICE candidates`)

        for (const candidate of pendingIceCandidates) {
            try {
                await peerConnection.addIceCandidate(candidate)
                console.log('Pending ICE candidate added successfully')
            } catch (error) {
                console.error('Failed to add pending ICE candidate:', error)
            }
        }

        // Очищаем буфер после применения
        pendingIceCandidates = []
    }

    // Обработка полученного answer
    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        try {
            if (!peerConnection) {
                throw new Error('Peer connection not initialized')
            }

            await peerConnection.setRemoteDescription(answer)
            console.log('Answer processed successfully')

            // Применяем отложенные ICE candidates после установки remote description
            await applyPendingIceCandidates()
        } catch (error) {
            console.error('Failed to handle answer:', error)
            callState.value.error = 'Failed to process answer'
        }
    }

    // Обработка ICE candidate
    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
        try {
            if (!peerConnection) {
                console.warn('Peer connection not initialized yet, buffering ICE candidate')
                pendingIceCandidates.push(candidate)
                return
            }

            // Проверяем, установлено ли remote description
            if (!peerConnection.remoteDescription) {
                console.warn('Remote description not set yet, buffering ICE candidate')
                pendingIceCandidates.push(candidate)
                return
            }

            await peerConnection.addIceCandidate(candidate)
            console.log('ICE candidate added successfully')
        } catch (error) {
            console.error('Failed to add ICE candidate:', error)
        }
    }

    // Смена видео устройства
    const switchVideoDevice = async (deviceId: string) => {
        try {
            if (!localStream) {
                console.warn('No local stream available for video device switch')
                return false
            }

            selectedVideoDeviceId = deviceId
            currentVideoDevice.value = deviceId

            // Получаем новый видео поток с выбранного устройства
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                audio: false, // Получаем только видео
            })

            const newVideoTrack = newStream.getVideoTracks()[0]
            const oldVideoTrack = localStream.getVideoTracks()[0]

            if (newVideoTrack && peerConnection) {
                // Заменяем видео трек в peer connection
                const sender = peerConnection
                    .getSenders()
                    .find((s) => s.track && s.track.kind === 'video')

                if (sender) {
                    await sender.replaceTrack(newVideoTrack)
                }

                // Останавливаем старый трек
                if (oldVideoTrack) {
                    oldVideoTrack.stop()
                    localStream.removeTrack(oldVideoTrack)
                }

                // Добавляем новый трек в локальный поток
                localStream.addTrack(newVideoTrack)

                // Обновляем состояние
                callState.value.isLocalVideoEnabled = newVideoTrack.enabled

                // Эмитируем событие обновления локального потока
                eventBus.emit('webrtc_local_stream_updated', { stream: localStream })

                console.log('📹 Video device switched successfully to:', deviceId)
                return true
            }

            return false
        } catch (error) {
            console.error('Failed to switch video device:', error)
            callState.value.error = 'Failed to switch camera'
            return false
        }
    }

    // Смена аудио устройства
    const switchAudioDevice = async (deviceId: string) => {
        try {
            if (!localStream) {
                console.warn('No local stream available for audio device switch')
                return false
            }

            selectedAudioDeviceId = deviceId
            currentAudioDevice.value = deviceId

            // Получаем новый аудио поток с выбранного устройства
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } },
                video: false, // Получаем только аудио
            })

            const newAudioTrack = newStream.getAudioTracks()[0]
            const oldAudioTrack = localStream.getAudioTracks()[0]

            if (newAudioTrack && peerConnection) {
                // Заменяем аудио трек в peer connection
                const sender = peerConnection
                    .getSenders()
                    .find((s) => s.track && s.track.kind === 'audio')

                if (sender) {
                    await sender.replaceTrack(newAudioTrack)
                }

                // Останавливаем старый трек
                if (oldAudioTrack) {
                    oldAudioTrack.stop()
                    localStream.removeTrack(oldAudioTrack)
                }

                // Добавляем новый трек в локальный поток
                localStream.addTrack(newAudioTrack)

                // Обновляем состояние
                callState.value.isLocalAudioEnabled = newAudioTrack.enabled

                // Эмитируем событие обновления локального потока
                eventBus.emit('webrtc_local_stream_updated', { stream: localStream })

                console.log('🎤 Audio device switched successfully to:', deviceId)
                return true
            }

            return false
        } catch (error) {
            console.error('Failed to switch audio device:', error)
            callState.value.error = 'Failed to switch microphone'
            return false
        }
    }

    // Переключение локального видео
    const toggleLocalVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                callState.value.isLocalVideoEnabled = videoTrack.enabled
            }
        }
    }

    // Переключение локального аудио
    const toggleLocalAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                callState.value.isLocalAudioEnabled = audioTrack.enabled
            }
        }
    }

    // Начало screen sharing
    const startScreenShare = async () => {
        try {
            if (!localStream || !peerConnection) {
                console.warn('No local stream or peer connection available for screen sharing')
                return false
            }

            // Запрашиваем доступ к screen sharing
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                } as MediaTrackConstraints,
                audio: false,
            })

            const screenTrack = screenStream.getVideoTracks()[0]

            if (screenTrack) {
                // Сохраняем оригинальный видео трек (камеру)
                const currentVideoTrack = localStream.getVideoTracks()[0]
                if (currentVideoTrack) {
                    originalVideoTrack = currentVideoTrack
                }

                // Заменяем видео трек в peer connection
                const sender = peerConnection
                    .getSenders()
                    .find((s) => s.track && s.track.kind === 'video')

                if (sender) {
                    await sender.replaceTrack(screenTrack)
                }

                // Заменяем видео трек в локальном потоке
                if (currentVideoTrack) {
                    localStream.removeTrack(currentVideoTrack)
                }
                localStream.addTrack(screenTrack)

                // Обновляем состояние
                callState.value.isScreenSharing = true
                callState.value.isLocalVideoEnabled = true

                // Обрабатываем остановку screen sharing пользователем через UI браузера
                screenTrack.onended = () => {
                    console.log('Screen sharing stopped by user')
                    stopScreenShare()
                }

                // Эмитируем событие обновления локального потока
                eventBus.emit('webrtc_local_stream_updated', { stream: localStream })

                console.log('🖥️ Screen sharing started successfully')
                return true
            }

            return false
        } catch (error) {
            console.error('Failed to start screen sharing:', error)
            callState.value.error = 'Failed to start screen sharing'
            return false
        }
    }

    // Остановка screen sharing и возврат к камере
    const stopScreenShare = async () => {
        try {
            if (!localStream || !peerConnection || !screenStream) {
                console.warn('No screen stream to stop')
                return false
            }

            // Останавливаем screen sharing поток
            screenStream.getTracks().forEach((track) => {
                track.stop()
            })

            // Убираем screen track из локального потока
            const screenTrack = localStream.getVideoTracks()[0]
            if (screenTrack) {
                localStream.removeTrack(screenTrack)
            }

            // Если есть сохраненный оригинальный видео трек, восстанавливаем его
            if (originalVideoTrack) {
                // Заменяем трек в peer connection
                const sender = peerConnection
                    .getSenders()
                    .find((s) => s.track && s.track.kind === 'video')

                if (sender) {
                    await sender.replaceTrack(originalVideoTrack)
                }

                // Добавляем оригинальный трек обратно в локальный поток
                localStream.addTrack(originalVideoTrack)
                originalVideoTrack = null
            } else {
                // Если оригинального трека нет, получаем новый поток с камеры
                const constraints: MediaStreamConstraints = {
                    video: selectedVideoDeviceId
                        ? { deviceId: { exact: selectedVideoDeviceId } }
                        : true,
                    audio: false,
                }

                const newStream = await navigator.mediaDevices.getUserMedia(constraints)
                const newVideoTrack = newStream.getVideoTracks()[0]

                if (newVideoTrack) {
                    const sender = peerConnection
                        .getSenders()
                        .find((s) => s.track && s.track.kind === 'video')

                    if (sender) {
                        await sender.replaceTrack(newVideoTrack)
                    }

                    localStream.addTrack(newVideoTrack)
                }
            }

            // Обновляем состояние
            callState.value.isScreenSharing = false
            callState.value.isLocalVideoEnabled = true

            screenStream = null

            // Эмитируем событие обновления локального потока
            eventBus.emit('webrtc_local_stream_updated', { stream: localStream })

            console.log('🖥️ Screen sharing stopped, camera restored')
            return true
        } catch (error) {
            console.error('Failed to stop screen sharing:', error)
            callState.value.error = 'Failed to stop screen sharing'
            return false
        }
    }

    // Переключение между камерой и screen sharing
    const toggleScreenShare = async () => {
        if (callState.value.isScreenSharing) {
            return await stopScreenShare()
        } else {
            return await startScreenShare()
        }
    }

    // Завершение звонка
    const endCall = (reason?: string, skipEmitEvent = false) => {
        try {
            const targetUserId = currentTargetUserId

            // Останавливаем локальные треки
            if (localStream) {
                localStream.getTracks().forEach((track) => {
                    track.stop()
                })
                localStream = null
            }

            // Закрываем peer connection
            if (peerConnection) {
                peerConnection.close()
                peerConnection = null
            }

            // Останавливаем screen sharing если активен
            if (screenStream) {
                screenStream.getTracks().forEach((track) => {
                    track.stop()
                })
                screenStream = null
            }

            // Очищаем сохраненный оригинальный видео трек
            if (originalVideoTrack) {
                originalVideoTrack.stop()
                originalVideoTrack = null
            }

            // Сбрасываем состояние
            callState.value = {
                isConnecting: false,
                isConnected: false,
                isLocalVideoEnabled: false,
                isLocalAudioEnabled: false,
                isRemoteVideoEnabled: false,
                isRemoteAudioEnabled: false,
                isScreenSharing: false,
                error: null,
            }

            remoteStream = null
            pendingIceCandidates = [] // Очищаем буфер ICE candidates

            // Эмитируем событие завершения звонка, если есть targetUserId и не пропускаем событие
            if (targetUserId && !skipEmitEvent) {
                console.log('Emitting webrtc_call_end event for targetUserId:', targetUserId)
                eventBus.emit('webrtc_call_end', {
                    targetUserId,
                    reason: reason || 'call_ended',
                })
            } else if (skipEmitEvent) {
                console.log('Skipping webrtc_call_end event emission (local cleanup only)')
            }

            // Эмитируем событие об очистке стримов
            eventBus.emit('webrtc_streams_cleared', {})

            // Очищаем ID пользователя после эмитирования события
            currentTargetUserId = null

            console.log('Call ended successfully')
        } catch (error) {
            console.error('Error ending call:', error)
        }
    }

    // Очистка ресурсов при размонтировании
    onUnmounted(() => {
        endCall()
    })

    // Геттеры для доступа к потокам
    const getLocalStream = () => {
        console.log('getLocalStream called, returning:', !!localStream)
        return localStream
    }
    const getRemoteStream = () => {
        console.log('getRemoteStream called, returning:', !!remoteStream)
        return remoteStream
    }

    return {
        // Состояние
        callState,

        // Геттеры для медиа потоков
        getLocalStream,
        getRemoteStream,

        // Медиа устройства
        availableVideoDevices,
        availableAudioDevices,
        currentVideoDevice,
        currentAudioDevice,
        getMediaDevices,
        switchVideoDevice,
        switchAudioDevice,

        // Методы
        prepareCall,
        sendOffer,
        startCall,
        prepareAcceptCall,
        sendAnswer,
        acceptCall,
        handleAnswer,
        handleIceCandidate,
        toggleLocalVideo,
        toggleLocalAudio,
        startScreenShare,
        stopScreenShare,
        toggleScreenShare,
        endCall,
    }
}
