<template>
  <div>
    <!-- Section 1: Currently Out (Active Loans) -->
    <div class="card">
      <div class="flex-between section-head">
        <div>
          <h2>Currently Out Equipment</h2>
          <p class="sub-text">Items currently borrowed and not yet returned.</p>
        </div>
        <button @click="openLogLoanModal" class="btn-primary" :disabled="equipmentStore.items.length === 0">
          + Log New Loan
        </button>
      </div>

      <div v-if="equipmentStore.loading">Loading active loans...</div>
      <div v-else-if="equipmentStore.activeLoans.length === 0" class="empty">
        All equipment is currently accounted for and in storage.
      </div>
      <div v-else class="loan-grid">
        <div 
          v-for="loan in equipmentStore.activeLoans" 
          :key="loan.id" 
          class="loan-card"
          :class="{ overdue: equipmentStore.isOverdue(loan.date_out) }"
        >
          <div class="flex-between">
            <strong class="item-name">🛠️ {{ loan.item?.name || 'Unknown Item' }}</strong>
            <span 
              v-if="equipmentStore.isOverdue(loan.date_out)" 
              class="badge overdue-badge"
            >
              ⚠️ Out > 14 days
            </span>
          </div>

          <div class="loan-details">
            <div><strong>Borrower:</strong> {{ loan.borrower_name }}</div>
            <div><strong>Date Out:</strong> {{ loan.date_out }}</div>
          </div>

          <div class="flex-end mt-10">
            <button @click="openReturnModal(loan)" class="btn-primary btn-sm">
              Mark Returned
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Equipment Roster -->
    <div class="card">
      <div class="flex-between section-head">
        <div>
          <h3>Equipment Roster</h3>
          <p class="sub-text">Manage fixed list of borrowable farm tools.</p>
        </div>
        <button @click="openAddItemModal" class="btn-secondary">+ Add Item</button>
      </div>

      <div v-if="equipmentStore.items.length === 0" class="empty">
        No equipment added to roster yet.
      </div>
      <div v-else class="item-list">
        <div v-for="item in equipmentStore.items" :key="item.id" class="item-chip">
          <span>🛠️ {{ item.name }}</span>
          <div class="chip-actions">
            <button @click="openEditItemModal(item)" class="btn-icon">✏️</button>
            <button @click="confirmDeleteItem(item.id)" class="btn-icon">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Loan History & Search -->
    <div class="card">
      <h3>Loan History</h3>
      
      <!-- Filters -->
      <div class="grid-2 mb-12">
        <div>
          <label>Filter by Item</label>
          <select v-model="filterItemId">
            <option value="">All Items</option>
            <option v-for="item in equipmentStore.items" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>
        <div>
          <label>Search Borrower</label>
          <input 
            type="text" 
            v-model="filterBorrower" 
            placeholder="Search borrower name..." 
          />
        </div>
      </div>

      <div v-if="filteredHistoryLoans.length === 0" class="empty">
        No returned loan history found matching filters.
      </div>
      <div v-else class="table-responsive">
        <table class="history-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Borrower</th>
              <th>Date Out</th>
              <th>Date Returned</th>
              <th>Condition</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loan in filteredHistoryLoans" :key="loan.id">
              <td class="font-bold">{{ loan.item?.name || 'Unknown' }}</td>
              <td>{{ loan.borrower_name }}</td>
              <td>{{ loan.date_out }}</td>
              <td>{{ loan.date_in }}</td>
              <td>
                <span class="condition-tag" :class="loan.condition?.toLowerCase()">
                  {{ loan.condition }}
                </span>
              </td>
              <td>
                <span v-if="loan.notes" class="notes-text">{{ loan.notes }}</span>
                <span v-else class="text-muted">None</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Add / Edit Item -->
    <div v-if="showItemModal" class="modal-backdrop">
      <div class="card modal-content">
        <h3>{{ editingItem ? 'Edit Item' : 'Add Equipment Item' }}</h3>
        <form @submit.prevent="handleItemSubmit">
          <label>Item Name</label>
          <input type="text" v-model="itemForm.name" required placeholder="e.g. Grass cutter, Ladder" />

          <div class="flex-end gap" style="margin-top: 12px;">
            <button type="button" @click="showItemModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Item</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Log New Loan -->
    <div v-if="showLoanModal" class="modal-backdrop">
      <div class="card modal-content">
        <h3>Log Equipment Loan</h3>
        <form @submit.prevent="handleLoanSubmit">
          <label>Equipment Item</label>
          <select v-model="loanForm.item_id" required>
            <option disabled value="">Select item</option>
            <option v-for="item in equipmentStore.items" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>

          <label>Borrower Name <span class="text-muted">(Free text, e.g. Cousin / Laborer)</span></label>
          <input type="text" v-model="loanForm.borrower_name" required placeholder="e.g. Cousin Jun" />

          <label>Date Out</label>
          <input type="date" v-model="loanForm.date_out" required />

          <div class="flex-end gap" style="margin-top: 12px;">
            <button type="button" @click="showLoanModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Log Loan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Return Loan -->
    <div v-if="showReturnModal" class="modal-backdrop">
      <div class="card modal-content">
        <h3>Mark Equipment Returned</h3>
        <form @submit.prevent="handleReturnSubmit">
          <p><strong>Item:</strong> {{ returningLoan?.item?.name }}</p>
          <p><strong>Borrower:</strong> {{ returningLoan?.borrower_name }}</p>

          <label>Return Date</label>
          <input type="date" v-model="returnForm.date_in" required />

          <label>Condition on Return</label>
          <select v-model="returnForm.condition" required>
            <option value="Good">Good</option>
            <option value="Damaged">Damaged</option>
            <option value="Missing">Missing</option>
          </select>

          <label>Notes <span class="text-muted">(Optional, e.g. blade bent)</span></label>
          <textarea v-model="returnForm.notes" rows="3" placeholder="Enter condition details..."></textarea>

          <div class="flex-end gap" style="margin-top: 12px;">
            <button type="button" @click="showReturnModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Return Record</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEquipmentStore } from '../stores/equipment'
import type { Item, ItemLoan, LoanCondition } from '../types'

const equipmentStore = useEquipmentStore()

// Filter states for History
const filterItemId = ref<string>('')
const filterBorrower = ref<string>('')

// Modals State
const showItemModal = ref<boolean>(false)
const editingItem = ref<Item | null>(null)
const itemForm = ref<{ name: string }>({ name: '' })

const showLoanModal = ref<boolean>(false)
const loanForm = ref<{ item_id: string; borrower_name: string; date_out: string }>({
  item_id: '',
  borrower_name: '',
  date_out: new Date().toISOString().split('T')[0]
})

const showReturnModal = ref<boolean>(false)
const returningLoan = ref<ItemLoan | null>(null)
const returnForm = ref<{ date_in: string; condition: LoanCondition; notes: string }>({
  date_in: new Date().toISOString().split('T')[0],
  condition: 'Good',
  notes: ''
})

onMounted(async () => {
  await Promise.all([
    equipmentStore.fetchItems(),
    equipmentStore.fetchLoans()
  ])
})

const filteredHistoryLoans = computed<ItemLoan[]>(() => {
  return equipmentStore.historyLoans.filter(loan => {
    const matchesItem = filterItemId.value ? loan.item_id === filterItemId.value : true
    const matchesBorrower = filterBorrower.value 
      ? loan.borrower_name.toLowerCase().includes(filterBorrower.value.toLowerCase())
      : true
    return matchesItem && matchesBorrower
  })
})

function openAddItemModal(): void {
  editingItem.value = null
  itemForm.value = { name: '' }
  showItemModal.value = true
}

function openEditItemModal(item: Item): void {
  editingItem.value = item
  itemForm.value = { name: item.name }
  showItemModal.value = true
}

async function handleItemSubmit(): Promise<void> {
  if (editingItem.value) {
    await equipmentStore.updateItem(editingItem.value.id, itemForm.value.name)
  } else {
    await equipmentStore.addItem(itemForm.value.name)
  }
  showItemModal.value = false
}

async function confirmDeleteItem(id: string): Promise<void> {
  if (confirm('Delete this item from roster?')) {
    await equipmentStore.deleteItem(id)
  }
}

function openLogLoanModal(): void {
  loanForm.value = {
    item_id: equipmentStore.items[0]?.id || '',
    borrower_name: '',
    date_out: new Date().toISOString().split('T')[0]
  }
  showLoanModal.value = true
}

async function handleLoanSubmit(): Promise<void> {
  await equipmentStore.createLoan(
    loanForm.value.item_id,
    loanForm.value.borrower_name,
    loanForm.value.date_out
  )
  showLoanModal.value = false
}

function openReturnModal(loan: ItemLoan): void {
  returningLoan.value = loan
  returnForm.value = {
    date_in: new Date().toISOString().split('T')[0],
    condition: 'Good',
    notes: ''
  }
  showReturnModal.value = true
}

async function handleReturnSubmit(): Promise<void> {
  if (!returningLoan.value) return
  await equipmentStore.returnLoan(
    returningLoan.value.id,
    returnForm.value.date_in,
    returnForm.value.condition,
    returnForm.value.notes
  )
  showReturnModal.value = false
}
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.flex-end {
  display: flex;
  justify-content: flex-end;
}
.gap {
  gap: 8px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.section-head {
  gap: 12px;
}
.sub-text {
  font-size: 0.85rem;
  color: #666;
  margin-top: 2px;
}
.loan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.loan-card {
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: 6px;
  background: #fafafa;
}
.loan-card.overdue {
  border-color: var(--danger);
  background: #fff8f8;
}
.item-name {
  font-size: 1rem;
}
.loan-details {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #444;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.overdue-badge {
  background: #ffebee;
  color: var(--danger);
}
.item-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.item-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  min-width: 0;
}
.chip-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  font-size: 0.8rem;
}
.btn-sm {
  font-size: 0.75rem;
  padding: 4px 8px;
}
.table-responsive {
  overflow-x: auto;
}
.history-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  margin-top: 8px;
}
.history-table th, .history-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}
.condition-tag {
  font-weight: bold;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
}
.condition-tag.good {
  background: #e8f5e9;
  color: #2e7d32;
}
.condition-tag.damaged {
  background: #fff3e0;
  color: #e65100;
}
.condition-tag.missing {
  background: #ffebee;
  color: #c62828;
}
.notes-text {
  font-style: italic;
  color: #555;
  word-break: break-word;
}
.empty {
  color: #777;
  font-style: italic;
  margin-top: 8px;
}
.mb-12 {
  margin-bottom: 12px;
}
.mt-10 {
  margin-top: 10px;
}
.font-bold {
  font-weight: bold;
}
.text-muted {
  color: #888;
  font-size: 0.8rem;
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

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .loan-grid {
    grid-template-columns: 1fr;
  }

  .item-chip {
    width: 100%;
    border-radius: 10px;
  }

  .btn-sm {
    font-size: 0.8rem;
  }

  .modal-content {
    margin-top: 12px;
  }
}
</style>