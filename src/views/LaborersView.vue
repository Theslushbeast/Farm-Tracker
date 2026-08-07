<template>
  <div>
    <div class="card flex-between section-head">
      <div>
        <h2>Laborer Roster</h2>
        <p class="sub-text">Manage farm workers across all crop cycles.</p>
      </div>
      <button @click="openAddModal" class="btn-primary">+ Add Laborer</button>
    </div>

    <div v-if="attendanceStore.loading">Loading roster...</div>
    <div v-else-if="attendanceStore.laborers.length === 0" class="card empty">
      No laborers added yet. Add laborers to start tracking daily attendance.
    </div>
    <div v-else class="card">
      <div class="table-responsive">
      <table class="roster-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Daily Rate (₱)</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="laborer in attendanceStore.laborers" :key="laborer.id">
            <td class="font-bold">{{ laborer.name }}</td>
            <td>
              <span v-if="laborer.daily_rate !== null">₱{{ Number(laborer.daily_rate).toLocaleString() }}</span>
              <span v-else class="text-muted">Not Set</span>
            </td>
            <td class="text-right">
              <button @click="openEditModal(laborer)" class="btn-secondary btn-sm">Edit</button>
              <button @click="confirmDelete(laborer.id)" class="btn-danger btn-sm" style="margin-left: 6px;">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- Modal: Add / Edit Laborer -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="card modal-content">
        <h3>{{ editingLaborer ? 'Edit Laborer' : 'Add Laborer' }}</h3>
        <form @submit.prevent="handleSubmit">
          <label>Laborer Name</label>
          <input type="text" v-model="form.name" required placeholder="e.g. Juan Dela Cruz" />

          <label>Daily Rate (₱) <span class="text-muted">(Optional)</span></label>
          <input type="number" step="0.01" v-model.number="form.daily_rate" placeholder="e.g. 500" />

          <div class="flex-end gap" style="margin-top: 12px;">
            <button type="button" @click="showModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Laborer</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAttendanceStore } from '../stores/attendance'
import type { Laborer } from '../types'

const attendanceStore = useAttendanceStore()

const showModal = ref<boolean>(false)
const editingLaborer = ref<Laborer | null>(null)
const form = ref<{ name: string; daily_rate: number | null }>({ name: '', daily_rate: null })

onMounted(() => {
  attendanceStore.fetchLaborers()
})

function openAddModal(): void {
  editingLaborer.value = null
  form.value = { name: '', daily_rate: null }
  showModal.value = true
}

function openEditModal(laborer: Laborer): void {
  editingLaborer.value = laborer
  form.value = {
    name: laborer.name,
    daily_rate: laborer.daily_rate !== null ? Number(laborer.daily_rate) : null
  }
  showModal.value = true
}

async function handleSubmit(): Promise<void> {
  if (editingLaborer.value) {
    await attendanceStore.updateLaborer(editingLaborer.value.id, form.value.name, form.value.daily_rate)
  } else {
    await attendanceStore.addLaborer(form.value.name, form.value.daily_rate)
  }
  showModal.value = false
}

async function confirmDelete(id: string): Promise<void> {
  if (confirm('Delete this laborer from the roster?')) {
    await attendanceStore.deleteLaborer(id)
  }
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
.sub-text {
  font-size: 0.85rem;
  color: #666;
  margin-top: 2px;
}
.roster-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
}
.roster-table th, .roster-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.font-bold {
  font-weight: 600;
}
.text-right {
  text-align: right;
}
.text-muted {
  color: #888;
  font-style: italic;
  font-size: 0.85rem;
}
.btn-sm {
  font-size: 0.75rem;
  padding: 4px 8px;
}
.table-responsive {
  overflow-x: auto;
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

  .text-right {
    white-space: nowrap;
  }

  .modal-content {
    margin-top: 12px;
  }
}
</style>