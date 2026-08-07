<template>
  <div class="app-container">
    <header v-if="authStore.user" class="header">
      <div class="brand-nav">
        <router-link to="/" class="logo">🌾 Farm Tracker</router-link>
        <nav class="nav-links">
          <router-link to="/" class="nav-item">Cycles</router-link>
          <router-link to="/laborers" class="nav-item">Labor Roster</router-link>
          <router-link to="/equipment" class="nav-item">Equipment Loans</router-link>
        </nav>
      </div>
      <div class="user-nav">
        <span class="user-email">{{ authStore.user.email }}</span>
        <button @click="handleLogout" class="btn-secondary">Logout</button>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout(): Promise<void> {
  await authStore.logout()
  router.push('/login')
}
</script>

<style>
:root {
  --primary: #2e7d32;
  --primary-dark: #1b5e20;
  --danger: #d32f2f;
  --warning: #f57c00;
  --bg: #f4f6f8;
  --card: #ffffff;
  --border: #e0e0e0;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg);
  color: #333;
  overflow-x: hidden;
}

.app-container {
  width: min(950px, 100%);
  margin: 0 auto;
  padding: 12px;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: var(--card);
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.brand-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  flex-wrap: wrap;
}

.logo {
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--primary);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-item {
  color: #555;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-item.router-link-exact-active {
  color: var(--primary);
  font-weight: bold;
  border-bottom: 2px solid var(--primary);
}

.user-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  min-width: 0;
  flex-wrap: wrap;
}

.user-email {
  font-size: 0.85rem;
  color: #666;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  min-width: 0;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background-color: #eee;
  color: #333;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-danger {
  background-color: var(--danger);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.card {
  background: var(--card);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  margin-bottom: 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit;
}

@media (max-width: 900px) {
  .app-container {
    padding: 10px;
  }

  .header {
    align-items: stretch;
    padding: 12px;
  }

  .brand-nav {
    gap: 10px;
  }

  .logo {
    font-size: 1.1rem;
  }

  .nav-links {
    width: 100%;
    gap: 8px;
  }

  .nav-item {
    font-size: 0.85rem;
  }

  .user-nav {
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
  }

  .user-email {
    max-width: 70%;
  }
}
</style>