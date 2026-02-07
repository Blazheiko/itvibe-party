<script setup lang="ts">
import { ref } from 'vue'
import baseApi from '@/utils/base-api'
import { useUserStore } from '@/stores/user'
import type { User } from '@/stores/user'
import { useRouter } from 'vue-router'
import { useEventBus } from '@/utils/event-bus'
import VoiceInput from './VoiceInput.vue'
const router = useRouter()
const userStore = useUserStore()
const eventBus = useEventBus()

const props = defineProps({
    showLogin: {
        type: Boolean,
        default: false,
    },
    showRegister: {
        type: Boolean,
        default: false,
    },
    token: {
        type: String,
        default: '',
    },
})

const emit = defineEmits(['close', 'show-login', 'show-register', 'auth-success'])

const email = ref('')
const password = ref('')
const name = ref('')
const confirmPassword = ref('')
const rememberMe = ref(false)
const agreeToManifesto = ref(false)
const showAgreementError = ref(false)

// Ошибки валидации
const emailError = ref('')
const passwordError = ref('')
const nameError = ref('')
const confirmPasswordError = ref('')
const loginError = ref('')
const registerError = ref('')

// Loading states for buttons
const isLoginLoading = ref(false)
const isRegisterLoading = ref(false)

const closeLoginModal = () => {
    emit('close')
}

const closeRegisterModal = () => {
    emit('close')
    showAgreementError.value = false
}

const switchToRegister = () => {
    emit('show-register')
}

const switchToLogin = () => {
    showAgreementError.value = false
    emit('show-login')
}

// Voice input handler
const handleNameVoiceInput = (text: string) => {
    name.value = name.value ? name.value + ' ' + text : text
}

const handleLogin = async () => {
    // Сброс ошибок
    emailError.value = ''
    passwordError.value = ''
    loginError.value = ''

    // Валидация
    const isValid = validateEmailPassword()

    if (!isValid) return

    isLoginLoading.value = true

    try {
        const { data, error } = await baseApi.http('POST', '/api/auth/login', {
            email: email.value,
            password: password.value,
            token: props.token,
        })

        if (error) {
            loginError.value = error.message || 'Authorization error'
        } else if (data && data.status === 'success' && data.user) {
            userStore.setUser(data.user as User)
            emit('close')
            emit('auth-success')
            console.log('user', userStore.user)
            router.push({ name: 'Chat' })
            eventBus.emit('init_app')
        } else {
            loginError.value = (data?.message as string) || 'Authorization error'
        }
    } catch (error: unknown) {
        console.error(error)
        loginError.value = 'Server error. Please try again later.'
    } finally {
        isLoginLoading.value = false
    }
}

const validateEmailPassword = (): boolean => {
    let isValid = true
    if (!email.value.trim()) {
        emailError.value = 'Email is required'
        isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        emailError.value = 'Enter a valid email'
        isValid = false
    }

    if (!password.value) {
        passwordError.value = 'Password is required'
        isValid = false
    } else if (password.value.length < 8) {
        passwordError.value = 'Password must be at least 8 characters long'
        isValid = false
    }

    return isValid
}

const handleRegister = async () => {
    // Сброс ошибок
    nameError.value = ''
    emailError.value = ''
    passwordError.value = ''
    registerError.value = ''
    confirmPasswordError.value = ''
    showAgreementError.value = false

    // Валидация
    let isValid = true

    if (!name.value.trim()) {
        nameError.value = 'Name is required'
        isValid = false
    }
    isValid = validateEmailPassword()

    if (password.value !== confirmPassword.value) {
        confirmPasswordError.value = 'Passwords do not match'
        isValid = false
    }

    if (!agreeToManifesto.value) {
        showAgreementError.value = true
        isValid = false
    }

    if (!isValid) return

    isRegisterLoading.value = true

    try {
        const { data, error } = await baseApi.http('POST', '/api/auth/register', {
            name: name.value,
            email: email.value,
            password: password.value,
            token: props.token,
        })

        if (error) {
            if (error.code === 422) {
                console.log(data)
                registerError.value = error.message
            } else {
                registerError.value = error.message || 'Server error. Please try again later.'
            }
        } else if (data && data.status === 'success' && data.user) {
            userStore.setUser(data.user as User)
            emit('close')
            emit('auth-success')
            router.push({ name: 'Chat' })
            eventBus.emit('init_app')
        } else if (data && data.status === 'error') {
            registerError.value = (data?.message as string) || 'Registration error'
        } else {
            registerError.value = 'Server error. Please try again later.'
        }
    } catch (error: unknown) {
        console.error(error)
        registerError.value = 'Server error. Please try again later.'
    } finally {
        isRegisterLoading.value = false
    }
}
</script>

<template>
    <!-- Login Modal -->
    <div class="modal-overlay" :class="{ show: props.showLogin }">
        <div class="modal login-modal">
            <div class="modal-header">
                <h3>Sign In</h3>
                <button class="close-modal" @click="closeLoginModal" aria-label="Close modal">
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
            <div class="modal-content">
                <div v-if="loginError" class="error-message form-error">{{ loginError }}</div>
                <div class="form-group">
                    <label for="login-email">Email</label>
                    <div class="input-wrapper">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="currentColor"
                            class="input-icon"
                        >
                            <path
                                d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                            />
                        </svg>
                        <input
                            type="email"
                            id="login-email"
                            v-model="email"
                            placeholder="yourname@example.com"
                            autocomplete="email"
                            :class="{ 'has-error': emailError }"
                        />
                    </div>
                    <div v-if="emailError" class="error-message">{{ emailError }}</div>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <div class="input-wrapper">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="currentColor"
                            class="input-icon"
                        >
                            <path
                                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                            />
                        </svg>
                        <input
                            type="password"
                            id="login-password"
                            v-model="password"
                            placeholder="Your password"
                            autocomplete="current-password"
                            :class="{ 'has-error': passwordError }"
                        />
                    </div>
                    <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
                </div>

                <div class="form-options">
                    <label class="checkbox-container">
                        <input type="checkbox" v-model="rememberMe" />
                        <span class="checkmark"></span>
                        Remember me
                    </label>
                    <a href="#" class="forgot-password">Forgot password?</a>
                </div>

                <button class="auth-button" @click="handleLogin" :disabled="isLoginLoading">
                    <span v-if="isLoginLoading">Signing In...</span>
                    <span v-else>Sign In</span>
                </button>
                <p class="auth-switch">
                    Don't have an account?
                    <a href="#" @click.prevent="switchToRegister">Register</a>
                </p>
            </div>
        </div>
    </div>

    <!-- Register Modal -->
    <div class="modal-overlay" :class="{ show: props.showRegister }">
        <div class="modal register-modal">
            <div class="modal-header">
                <h3>Create Account</h3>
                <button class="close-modal" @click="closeRegisterModal" aria-label="Close modal">
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
            <div class="modal-content">
                <div v-if="registerError" class="error-message form-error">{{ registerError }}</div>
                <div class="form-group">
                    <label for="register-name">Full Name</label>
                    <div class="input-wrapper-with-voice">
                        <div class="input-wrapper">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="currentColor"
                                class="input-icon"
                            >
                                <path
                                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                />
                            </svg>
                            <input
                                type="text"
                                id="register-name"
                                v-model="name"
                                placeholder="John Smith"
                                autocomplete="name"
                                :class="{ 'has-error': nameError }"
                            />
                        </div>
                        <VoiceInput @text-recognized="handleNameVoiceInput" />
                    </div>
                    <div v-if="nameError" class="error-message">{{ nameError }}</div>
                </div>
                <div class="form-group">
                    <label for="register-email">Email</label>
                    <div class="input-wrapper">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="currentColor"
                            class="input-icon"
                        >
                            <path
                                d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                            />
                        </svg>
                        <input
                            type="email"
                            id="register-email"
                            v-model="email"
                            placeholder="yourname@example.com"
                            autocomplete="email"
                            :class="{ 'has-error': emailError }"
                        />
                    </div>
                    <div v-if="emailError" class="error-message">{{ emailError }}</div>
                </div>
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <div class="input-wrapper">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="currentColor"
                            class="input-icon"
                        >
                            <path
                                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                            />
                        </svg>
                        <input
                            type="password"
                            id="register-password"
                            v-model="password"
                            placeholder="Min. 8 characters"
                            autocomplete="new-password"
                            :class="{ 'has-error': passwordError }"
                        />
                    </div>
                    <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
                </div>
                <div class="form-group">
                    <label for="register-confirm-password">Confirm Password</label>
                    <div class="input-wrapper">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="currentColor"
                            class="input-icon"
                        >
                            <path
                                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                            />
                        </svg>
                        <input
                            type="password"
                            id="register-confirm-password"
                            v-model="confirmPassword"
                            placeholder="Confirm your password"
                            autocomplete="new-password"
                            :class="{ 'has-error': confirmPasswordError }"
                        />
                    </div>
                    <div v-if="confirmPasswordError" class="error-message">
                        {{ confirmPasswordError }}
                    </div>
                </div>
                <div class="form-group terms-agreement">
                    <label class="checkbox-container">
                        <input type="checkbox" v-model="agreeToManifesto" />
                        <span class="checkmark"></span>
                        I agree with the
                        <router-link to="/manifesto" class="manifesto-link" target="_blank"
                            >Manifesto</router-link
                        >
                        of a free social network
                    </label>
                    <p class="error-message" v-if="showAgreementError">
                        You must agree with the Manifesto to create an account
                    </p>
                </div>
                <button class="auth-button" @click="handleRegister" :disabled="isRegisterLoading">
                    <span v-if="isRegisterLoading">Creating Account...</span>
                    <span v-else>Create Account</span>
                </button>
                <p class="auth-switch">
                    Already have an account? <a href="#" @click.prevent="switchToLogin">Sign In</a>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.dark-theme .modal-overlay {
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.modal {
    background-color: white;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    min-height: 600px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-20px);
    transition: all 0.3s ease;
    position: relative;
    display: flex;
    flex-direction: column;
}

.dark-theme .modal {
    background-color: #1e1e1e;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.modal-header {
    padding: 24px 32px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dark-theme .modal-header {
    border-bottom-color: #333;
}

.modal-header h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
}

.dark-theme .modal-header h3 {
    color: #e0e0e0;
}

.close-modal {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s ease;
    border-radius: 50%;
}

.dark-theme .close-modal {
    color: #adb5bd;
}

.close-modal:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #333;
}

.dark-theme .close-modal:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.modal-content {
    padding: 32px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.form-group {
    margin-bottom: 24px;
}

.form-group label {
    display: block;
    margin-bottom: 10px;
    font-weight: 500;
    font-size: 15px;
    color: var(--text-color);
}

.dark-theme .form-group label {
    color: #e0e0e0;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 12px;
    color: #666;
    z-index: 1;
}

.dark-theme .input-icon {
    color: #adb5bd;
}

.error-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 6px;
}

.form-error {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
}

.dark-theme .form-error {
    background-color: rgba(220, 53, 69, 0.2);
    color: #ff6b6b;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
}

.checkbox-group label {
    margin: 0;
    font-weight: normal;
    font-size: 14px;
    color: #666;
    cursor: pointer;
}

.dark-theme .checkbox-group label {
    color: #adb5bd;
}

.checkbox-group input[type='checkbox'] {
    width: 16px;
    height: 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
}

.dark-theme .checkbox-group input[type='checkbox'] {
    border-color: #444;
    background-color: #2a2a2a;
}

.submit-button {
    width: 100%;
    padding: 12px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.dark-theme .submit-button {
    background-color: #0d47a1;
}

.submit-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-1px);
}

.dark-theme .submit-button:hover {
    background-color: #1565c0;
}

.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    text-align: center;
}

.dark-theme .modal-footer {
    border-top-color: #333;
}

.switch-modal-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.dark-theme .switch-modal-link {
    color: #64b5f6;
}

.switch-modal-link:hover {
    text-decoration: underline;
    opacity: 0.9;
}

.manifesto-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
}

.dark-theme .manifesto-link {
    color: #64b5f6;
}

.manifesto-link:hover {
    text-decoration: underline;
    opacity: 0.9;
}

.agreement-error {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
}

.dark-theme .agreement-error {
    color: #ff6b6b;
}

.modal-overlay.show {
    opacity: 1;
    visibility: visible;
}

.modal-overlay.show .modal {
    transform: translateY(0);
    opacity: 1;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    position: relative;
}

.modal-header h3 {
    margin: 0;
    color: var(--primary-color);
    font-size: 24px;
    font-weight: 700;
}

.close-modal {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c757d;
    transition: all 0.2s ease;
    padding: 8px;
    line-height: 1;
}

.close-modal:hover {
    color: var(--primary-color);
    transform: rotate(90deg);
}

.close-modal:active {
    transform: scale(0.9) rotate(90deg);
}

.modal-content {
    padding-top: 10px;
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.checkbox-container {
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 30px;
    cursor: pointer;
    font-size: 14px;
    color: #495057;
    user-select: none;
}

.checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
    background-color: #f8f9fa;
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

.checkbox-container:hover input ~ .checkmark {
    background-color: #e9ecef;
}

.checkbox-container input:checked ~ .checkmark {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.checkmark:after {
    content: '';
    position: absolute;
    display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
    display: block;
}

.checkbox-container .checkmark:after {
    left: 7px;
    top: 3px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.forgot-password {
    color: var(--primary-color);
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
}

.forgot-password:hover {
    text-decoration: underline;
    color: var(--accent-color);
}

.auth-button {
    width: 100%;
    padding: 14px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
    transform: translateY(0);
}

.auth-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.auth-button:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition:
        width 0.3s ease,
        height 0.3s ease;
}

.auth-button:active::before {
    width: 300px;
    height: 300px;
}

.auth-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.auth-button:disabled:hover {
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.auth-button:disabled::before {
    display: none;
}

.auth-switch {
    margin-top: 20px;
    text-align: center;
    color: #6c757d;
    font-size: 14px;
}

.auth-switch a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
}

.auth-switch a:hover {
    color: var(--accent-color);
    text-decoration: underline;
}

.terms-agreement {
    margin-bottom: 24px;
}

.terms-agreement .checkbox-container {
    font-size: 14px;
    line-height: 20px;
}

.manifesto-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
}

.manifesto-link:hover {
    color: var(--accent-color);
    text-decoration: underline;
}

.error-message {
    color: #dc3545;
    font-size: 13px;
    margin-top: 6px;
    margin-bottom: 0;
    padding-left: 30px;
}

.form-error {
    padding: 10px;
    background-color: rgba(220, 53, 69, 0.1);
    border-radius: 8px;
    margin-bottom: 15px;
    padding-left: 15px;
    font-weight: 500;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .modal {
        padding: 24px 20px;
        max-width: 90%;
        max-height: 80vh;
    }

    .modal-header h3 {
        font-size: 20px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-group input {
        padding: 10px 16px 10px 46px;
        font-size: 14px;
    }

    .form-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .auth-button {
        padding: 12px;
        font-size: 15px;
    }

    .auth-switch {
        font-size: 13px;
    }
}

input[type='email'],
input[type='password'],
input[type='text'] {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    background-color: white;
    color: var(--text-color);
    outline: none;
}

input[type='email']:focus,
input[type='password']:focus,
input[type='text']:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.dark-theme input[type='email'],
.dark-theme input[type='password'],
.dark-theme input[type='text'] {
    background-color: #2a2a2a !important;
    border-color: #444;
    color: #e0e0e0;
}

.dark-theme input[type='email']:focus,
.dark-theme input[type='password']:focus,
.dark-theme input[type='text']:focus {
    border-color: #0d47a1;
    box-shadow: 0 0 0 2px rgba(13, 71, 161, 0.2);
}

.dark-theme input:-webkit-autofill,
.dark-theme input:-webkit-autofill:hover,
.dark-theme input:-webkit-autofill:focus,
.dark-theme input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #2a2a2a inset !important;
    -webkit-text-fill-color: #e0e0e0 !important;
    caret-color: #e0e0e0;
    transition: background-color 5000s ease-in-out 0s;
}

.dark-theme input:-moz-autofill,
.dark-theme input:-moz-autofill:hover,
.dark-theme input:-moz-autofill:focus,
.dark-theme input:-moz-autofill:active {
    background-color: #2a2a2a !important;
    color: #e0e0e0 !important;
    box-shadow: 0 0 0 30px #2a2a2a inset !important;
}

.dark-theme input:-ms-input-placeholder {
    color: rgba(224, 224, 224, 0.6) !important;
}

@-moz-document url-prefix() {
    .dark-theme input {
        background-color: #2a2a2a !important;
        color: #e0e0e0 !important;
    }
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
    transition: background-color 5000s ease-in-out 0s;
}

/* Voice input wrapper for auth modals */
.input-wrapper-with-voice {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.input-wrapper-with-voice .input-wrapper {
    flex: 1;
}
</style>
