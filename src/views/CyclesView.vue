<template>
  <div>
    <div class="card flex-between section-head">
      <h2>Crop Cycles</h2>
      <button @click="showModal = true" class="btn-primary">+ New Cycle</button>
    </div>

    <!-- Active Cycles -->
    <h3>Active Cycles</h3>
    <div v-if="farmStore.loading">Loading cycles...</div>
    <div v-else-if="activeCycles.length === 0" class="card empty">
      No active crop cycles. Create one to start logging expenses!
    </div>
    <div v-else class="grid">
      <div 
        v-for="cycle in activeCycles" 
        :key="cycle.id" 
        class="card cycle-card"
        @click="goToCycle(cycle.id)"
      >
        <div class="flex-between">
          <h4>{{ cycle.name }}</h4>
          <span class="badge active">Active</span>
        </div>
        <p class="date">Started: {{ cycle.start_date }}</p>
      </div>
    </div>

    <!-- Closed Cycles -->
    <h3 style="margin-top: 24px;">Closed Cycles</h3>
    <div v-if="closedCycles.length === 0" class="card empty">No closed cycles.</div>
    <div v-else class="grid">
      <div 
        v-for="cycle in closedCycles" 
        :key="cycle.id" 
        class="card cycle-card closed"
        @click="goToCycle(cycle.id)"
      >
        <div class="flex-between">
          <h4>{{ cycle.name }}</h4>
          <span class="badge closed">Closed</span>
        </div>
        <p class="date">{{ cycle.start_date }} to {{ cycle.end_date }}</p>
      </div>
    </div>

    <!-- Create Cycle Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="card modal-content">
        <h3>Create New Crop Cycle</h3>
        <form @submit.prevent="handleCreate">
          <label>Cycle Name</label>
          <input type="text" v-model="name" placeholder="e.g. Tomato - August 2026" required />

          <label>Start Date</label>
          <input type="date" v-model="startDate" required />

          <div class="flex-end gap">
            <button type="button" @click="showModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create Cycle</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFarmStore } from '../stores/farm'
import { useRouter } from 'vue-router'

const farmStore = useFarmStore()
const router = useRouter()

const showModal = ref<boolean>(false)
const name = ref<string>('')
const startDate = ref<string>(new Date().toISOString().split('T')[0])

onMounted(() => {
  farmStore.fetchCycles()
})

const activeCycles = computed(() => farmStore.cycles.filter(c => c.status === 'active'))
const closedCycles = computed(() => farmStore.cycles.filter(c => c.status === 'closed'))

async function handleCreate(): Promise<void> {
  if (!name.value) return
  const created = await farmStore.createCycle(name.value, startDate.value)
  showModal.value = false
  name.value = ''
  router.push(`/cycle/${created.id}`)
}

function goToCycle(id: string): void {
  router.push(`/cycle/${id}`)
}
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-head {
  gap: 12px;
}
.flex-end {
  display: flex;
  justify-content: flex-end;
}
.gap {
  gap: 8px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.cycle-card {
  cursor: pointer;
  transition: transform 0.1s ease;
}
.cycle-card:hover {
  transform: translateY(-2px);
}
.cycle-card.closed {
  opacity: 0.75;
}
.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}
.badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge.closed {
  background: #eee;
  color: #666;
}
.date {
  font-size: 0.85rem;
  color: #666;
  margin-top: 8px;
  margin-bottom: 0;
}
.empty {
  color: #777;
  font-style: italic;
}
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 16px;
  overflow-y: auto;
}
.modal-content {
  width: 100%;
  max-width: 450px;
  margin-top: 32px;
}

@media (max-width: 760px) {
  .flex-between {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head > button {
    width: 100%;
  }

  .modal-content {
    margin-top: 12px;
  }
}
</style>