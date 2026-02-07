<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { Message } from '@/stores/messages'

interface Props {
    message: Message
    index: number
    isOwner: boolean
    isEditing: boolean
    editText: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'start-edit': [index: number, text: string]
    'save-edit': []
    'cancel-edit': []
    'context-menu': [event: MouseEvent, index: number, text: string]
    'update:edit-text': [text: string]
}>()

const editTextarea = ref<HTMLTextAreaElement | null>(null)

const handleContextMenu = (event: MouseEvent) => {
    if (props.isOwner) {
        emit('context-menu', event, props.index, props.message.text)
    }
}

const handleDoubleClick = () => {
    if (props.isOwner) {
        emit('start-edit', props.index, props.message.text)
    }
}

const handleSaveEdit = () => {
    emit('save-edit')
}

const handleCancelEdit = () => {
    emit('cancel-edit')
}

const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        handleSaveEdit()
    } else if (event.key === 'Escape') {
        handleCancelEdit()
    }
}

const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault()
        const textarea = event.target as HTMLTextAreaElement
        const cursorPosition = textarea.selectionStart
        const newText =
            props.editText.slice(0, cursorPosition) + '\n' + props.editText.slice(cursorPosition)
        emit('update:edit-text', newText)
        // Восстанавливаем позицию курсора после следующего тика
        nextTick(() => {
            if (editTextarea.value) {
                editTextarea.value.setSelectionRange(cursorPosition + 1, cursorPosition + 1)
            }
        })
    }
}

// Автофокус при входе в режим редактирования
watch(
    () => props.isEditing,
    (isEditing) => {
        if (isEditing) {
            nextTick(() => {
                if (editTextarea.value) {
                    editTextarea.value.focus()
                    editTextarea.value.select()
                }
            })
        }
    },
    { immediate: true },
)
</script>

<template>
    <div
        :class="[
            'message',
            message.isSent ? 'sent' : 'received',
            { editable: isOwner },
            {
                'with-calendar': !!message.calendarId,
                'with-task': !!message.taskId,
            },
        ]"
        @contextmenu.prevent="handleContextMenu"
        @dblclick="handleDoubleClick"
    >
        <div v-if="isEditing" class="message-edit-mode">
            <textarea
                :value="editText"
                @input="(e) => emit('update:edit-text', (e.target as HTMLTextAreaElement).value)"
                class="message-edit-input"
                @keyup="handleKeyUp"
                @keydown.enter.shift.exact.prevent="handleKeyDown"
                ref="editTextarea"
            ></textarea>
            <div class="message-edit-actions">
                <button @click="handleSaveEdit" class="message-edit-button save">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19L21 7l-1.41-1.41L9 16.17z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
                <button @click="handleCancelEdit" class="message-edit-button cancel">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
        </div>
        <template v-else>
            {{ message.text }}
            <div class="message-footer">
                <span>{{ message.time }}</span>
                <span
                    v-if="message.isSent"
                    class="message-status"
                    :class="message.isRead ? 'read' : 'delivered'"
                >
                    <svg
                        v-if="message.isRead"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                    >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        <path
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                            transform="translate(8 0)"
                        />
                    </svg>
                    <svg
                        v-else
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                    >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                </span>
            </div>
        </template>
    </div>
</template>

<style scoped>
.message {
    margin-bottom: 15px;
    padding: 12px 16px;
    border-radius: 18px;
    max-width: 70%;
    position: relative;
    word-wrap: break-word;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    line-height: 1.5;
    font-size: 15px;
    cursor: context-menu;
}

/* Акцентный фон по кругу для календаря/задачи */
.message.with-calendar {
    box-shadow:
        0 0 0 3px var(--calendar-color),
        0 1px 2px rgba(0, 0, 0, 0.05);
}

.message.with-task {
    box-shadow:
        0 0 0 3px var(--task-color),
        0 1px 2px rgba(0, 0, 0, 0.05);
}

.message.sent {
    background-color: var(--primary-color);
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}

.dark-theme .message.sent {
    background-color: #0d47a1;
    color: white;
}

.message.received {
    background-color: white;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
    color: var(--text-color);
}

.dark-theme .message.received {
    background-color: #2a2a2a;
    color: #e0e0e0;
}

.message-footer {
    font-size: 12px;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.message.received .message-footer {
    justify-content: flex-start;
    color: #adb5bd;
}

.message.sent .message-footer {
    justify-content: flex-end;
    color: rgba(255, 255, 255, 0.9);
}

.dark-theme .message.sent .message-footer {
    color: rgba(255, 255, 255, 0.9);
}

.message-status {
    display: inline-flex;
    align-items: center;
}

.message-status svg {
    width: 16px;
    height: 16px;
}

.message.sent .message-status.delivered svg {
    fill: rgba(255, 255, 255, 0.8);
    color: rgba(255, 255, 255, 0.8);
}

.message.sent .message-status.read svg {
    fill: #a3ffcd;
    color: #a3ffcd;
}

.dark-theme .message.sent .message-status.read svg {
    fill: #a3ffcd;
    color: #a3ffcd;
}

.message {
    cursor: default;
}

.message.editable {
    cursor: context-menu;
}

.message.editable:hover {
    opacity: 0.9;
}

.message.sent {
    cursor: default;
}

.message.sent.editable {
    cursor: context-menu;
}

.message.received {
    cursor: default;
}

.message.received.editable {
    cursor: context-menu;
}

.message-edit-mode {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.message-edit-input {
    width: 100%;
    min-height: 60px;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 15px;
    line-height: 1.5;
    resize: none;
    background-color: white;
    color: var(--text-color);
    font-family: inherit;
}

.dark-theme .message-edit-input {
    background-color: #333;
    border-color: #444;
    color: #e0e0e0;
}

.message-edit-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.dark-theme .message-edit-input:focus {
    box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.2);
}

.message-edit-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.message-edit-button {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.message-edit-button svg {
    width: 20px;
    height: 20px;
}

.message-edit-button.save {
    background-color: var(--primary-color);
    color: white;
}

.message-edit-button.save:hover {
    background-color: var(--accent-color);
    transform: translateY(-1px);
}

.message-edit-button.cancel {
    background-color: #e9ecef;
    color: #6c757d;
}

.dark-theme .message-edit-button.cancel {
    background-color: #444;
    color: #adb5bd;
}

.message-edit-button.cancel:hover {
    background-color: #dee2e6;
    transform: translateY(-1px);
}

.dark-theme .message-edit-button.cancel:hover {
    background-color: #555;
}

@media (max-width: 768px) {
    .message {
        max-width: 85%;
        font-size: 14px;
        padding: 10px 14px;
    }

    .message-footer {
        font-size: 11px;
    }
}
</style>
