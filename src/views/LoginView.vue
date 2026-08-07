<template>
  <div class="login-wrapper">
    <div class="card login-card">
      <h2>🌾 Farm Tracker Login</h2>
      <p>Sign in with your account to manage crop cycles and expenses.</p>
      
      <form @submit.prevent="handleLogin">
        <label>Email</label>
        <input type="email" v-model="email" required placeholder="dad@farm.com" />

        <label>Password</label>
        <input type="password" v-model="password" required />

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref<string>('')
const password = ref<string>('')
const errorMessage = ref<string>('')
const loading = ref<boolean>(false)

async function handleLogin(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Failed to sign in'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}
.login-card {
  width: 100%;
  max-width: 400px;
}
.full-width {
  width: 100%;
  padding: 10px;
  font-size: 1rem;
}
.error {
  color: var(--danger);
  font-size: 0.9rem;
}
</style>