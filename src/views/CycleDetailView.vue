<template>
  <div v-if="farmStore.loading">Loading cycle details...</div>
  <div v-else-if="farmStore.currentCycle">
    <!-- Cycle Header -->
    <div class="card">
      <div class="flex-between section-head">
        <div>
          <h2>{{ farmStore.currentCycle.name }}</h2>
          <span class="status-tag" :class="farmStore.currentCycle.status">
            {{ farmStore.currentCycle.status.toUpperCase() }}
          </span>
        </div>
        <button 
          v-if="farmStore.currentCycle.status === 'active'" 
          @click="confirmClose" 
          class="btn-danger"
        >
          Close Cycle
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'ledger' }"
          @click="activeTab = 'ledger'"
        >
          Ledger & Budgets
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'attendance' }"
          @click="activeTab = 'attendance'"
        >
          Attendance & Labor
        </button>
      </div>
    </div>

    <!-- TAB 1: LEDGER & BUDGETS -->
    <div v-if="activeTab === 'ledger'">
      <!-- Budget vs Actual & Labor Cross-check -->
      <div class="card">
        <h3>Cycle Summary</h3>
        <div class="summary-grid">
          <div class="summary-box">
            <span class="label">Total Budget</span>
            <span class="val">₱{{ farmStore.totalBudgeted.toLocaleString() }}</span>
          </div>
          <div class="summary-box">
            <span class="label">Total Spent</span>
            <span class="val" :class="{ 'text-danger': farmStore.totalSpent > farmStore.totalBudgeted }">
              ₱{{ farmStore.totalSpent.toLocaleString() }}
            </span>
          </div>
          <div class="summary-box">
            <span class="label">Remaining</span>
            <span class="val">
              ₱{{ (farmStore.totalBudgeted - farmStore.totalSpent).toLocaleString() }}
            </span>
          </div>
        </div>

        <!-- Labor Cost Cross-check Widget -->
        <div class="labor-crosscheck">
          <div class="flex-between">
            <strong>Labor Cost Cross-check</strong>
            <span class="sub-text">Expected vs Actual Spend</span>
          </div>
          <div class="crosscheck-grid">
            <div>
              <span class="label">Expected Labor Cost (from Attendance):</span>
              <div class="cost-val">₱{{ attendanceStore.totalExpectedLaborCost.toLocaleString() }}</div>
              <small v-if="attendanceStore.unratedPresentDaysCount > 0" class="warn-text">
                ⚠️ Excludes {{ attendanceStore.unratedPresentDaysCount }} present day(s) from unrated laborers.
              </small>
            </div>
            <div>
              <span class="label">Actual Labor Expenses Logged:</span>
              <div class="cost-val">₱{{ actualLaborExpense.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Budgets Section -->
      <div class="card">
        <div class="flex-between">
          <h3>Category Budgets</h3>
          <button 
            v-if="farmStore.currentCycle.status === 'active'" 
            @click="openAddCategory" 
            class="btn-secondary"
          >
            + Add Category
          </button>
        </div>

        <div v-if="farmStore.categorySummaries.length === 0" class="empty">
          No categories setup yet. Add a category (e.g., Medicine, Labor) to set budgets.
        </div>
        <div v-else class="cat-list">
          <div 
            v-for="cat in farmStore.categorySummaries" 
            :key="cat.id" 
            class="cat-item"
            :class="{ 'over-budget': cat.isOverBudget }"
          >
            <div class="flex-between">
              <div>
                <strong>{{ cat.name }}</strong>
                <span v-if="cat.isOverBudget" class="over-flag">OVER BUDGET!</span>
              </div>
              <div class="cat-amounts">
                <span>₱{{ cat.spent.toLocaleString() }}</span> / 
                <span class="budget-label">₱{{ Number(cat.budget_amount).toLocaleString() }}</span>
                <button 
                  v-if="farmStore.currentCycle.status === 'active'" 
                  @click="openEditBudget(cat)" 
                  class="btn-icon"
                >
                  ✏️
                </button>
              </div>
            </div>
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill"
                :class="{ danger: cat.isOverBudget }"
                :style="{ width: Math.min((cat.spent / (Number(cat.budget_amount) || 1)) * 100, 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Ledger Section -->
      <div class="card">
        <div class="flex-between">
          <h3>Expense Ledger</h3>
          <button 
            v-if="farmStore.currentCycle.status === 'active'" 
            @click="openAddExpense" 
            class="btn-primary"
          >
            + Log Expense
          </button>
        </div>

        <div class="filter-box">
          <label>Filter Category:</label>
          <select v-model="selectedCategoryFilter">
            <option value="">All Categories</option>
            <option v-for="cat in farmStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div v-if="filteredExpenses.length === 0" class="empty">No expenses logged.</div>
        <div v-else class="expense-list">
          <div v-for="exp in filteredExpenses" :key="exp.id" class="expense-card">
            <div class="flex-between">
              <div>
                <strong>{{ exp.description }}</strong>
                <div class="exp-sub">
                  {{ getCategoryName(exp.category_id) }} • {{ exp.date }} 
                  <span v-if="exp.paid_to">• Paid to: {{ exp.paid_to }}</span>
                </div>
              </div>
              <div class="exp-amount">₱{{ Number(exp.amount).toLocaleString() }}</div>
            </div>

            <div class="flex-between exp-actions">
              <button 
                @click="farmStore.toggleReceiptConfirmed(exp.id, exp.receipt_confirmed)"
                class="receipt-btn"
                :class="{ confirmed: exp.receipt_confirmed }"
              >
                {{ exp.receipt_confirmed ? '✓ Receipt Confirmed' : '❌ Unconfirmed Receipt' }}
              </button>

              <div v-if="farmStore.currentCycle.status === 'active'" class="flex-end gap">
                <button @click="openEditExpense(exp)" class="btn-secondary btn-sm">Edit</button>
                <button @click="confirmDeleteExpense(exp.id)" class="btn-danger btn-sm">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: ATTENDANCE & LABOR LOG -->
    <div v-if="activeTab === 'attendance'">
      <!-- Log Daily Attendance Card -->
      <div class="card">
        <h3>Log Daily Attendance</h3>
        <p class="sub-text">Select a date and check who worked on the farm.</p>

        <form @submit.prevent="handleSaveAttendance">
          <div class="grid-2">
            <div>
              <label>Attendance Date</label>
              <input type="date" v-model="attendanceDate" required />
            </div>
            <div>
              <label class="checkbox-label" style="margin-top: 28px;">
                <input type="checkbox" v-model="attendanceEvidenceConfirmed" />
                Evidence Confirmed (Proof sent via Messenger)
              </label>
            </div>
          </div>

          <div v-if="attendanceStore.laborers.length === 0" class="empty">
            No laborers in the roster. <router-link to="/laborers">Add laborers first</router-link>.
          </div>
          <div v-else class="laborer-checkbox-grid">
            <label 
              v-for="laborer in attendanceStore.laborers" 
              :key="laborer.id" 
              class="laborer-checkbox-card"
              :class="{ selected: selectedLaborerIds.includes(laborer.id) }"
            >
              <input 
                type="checkbox" 
                :value="laborer.id" 
                v-model="selectedLaborerIds" 
              />
              <div class="laborer-info">
                <strong>{{ laborer.name }}</strong>
                <small class="text-muted">
                  {{ laborer.daily_rate !== null ? '₱' + Number(laborer.daily_rate).toLocaleString() + '/day' : 'No rate set' }}
                </small>
              </div>
            </label>
          </div>

          <div class="flex-end" style="margin-top: 16px;">
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="farmStore.currentCycle.status === 'closed' || attendanceStore.laborers.length === 0"
            >
              Save Attendance for {{ attendanceDate }}
            </button>
          </div>
        </form>
      </div>

      <!-- Laborer Summary Matrix -->
      <div class="card">
        <h3>Laborer Days & Expected Cost Summary</h3>
        <div class="table-responsive">
        <table class="roster-table">
          <thead>
            <tr>
              <th>Laborer</th>
              <th>Rate</th>
              <th>Days Present</th>
              <th class="text-right">Expected Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sum in attendanceStore.laborerSummaries" :key="sum.laborer.id">
              <td class="font-bold">{{ sum.laborer.name }}</td>
              <td>
                <span v-if="sum.hasRate">₱{{ Number(sum.laborer.daily_rate).toLocaleString() }}</span>
                <span v-else class="text-muted">Unrated</span>
              </td>
              <td>{{ sum.daysPresent }} day(s)</td>
              <td class="text-right font-bold">
                <span v-if="sum.hasRate">₱{{ sum.expectedCost.toLocaleString() }}</span>
                <span v-else class="text-muted">Excluded</span>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <!-- Daily Attendance Logs History -->
      <div class="card">
        <h3>Attendance History</h3>
        <div v-if="attendanceStore.attendanceByDate.length === 0" class="empty">
          No attendance recorded for this cycle yet.
        </div>
        <div v-else class="history-list">
          <div v-for="group in attendanceStore.attendanceByDate" :key="group.date" class="history-card">
            <div class="flex-between">
              <div>
                <strong>📅 {{ group.date }}</strong>
                <button 
                  @click="attendanceStore.toggleEvidenceForDate(farmStore.currentCycle.id, group.date, group.evidenceConfirmed)"
                  class="receipt-btn"
                  :class="{ confirmed: group.evidenceConfirmed }"
                  style="margin-left: 10px;"
                >
                  {{ group.evidenceConfirmed ? '✓ Evidence Confirmed' : '❌ Unconfirmed' }}
                </button>
              </div>
              <button @click="loadDateForEdit(group.date, group.records, group.evidenceConfirmed)" class="btn-secondary btn-sm">
                Edit Log
              </button>
            </div>
            <div class="present-tags">
              <span 
                v-for="rec in group.records.filter(r => r.present)" 
                :key="rec.id" 
                class="present-tag"
              >
                ✓ {{ getLaborerName(rec.laborer_id) }}
              </span>
              <span v-if="group.records.filter(r => r.present).length === 0" class="text-muted">
                No laborers marked present
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals (Category & Expense) -->
    <div v-if="showCatModal" class="modal-backdrop">
      <div class="card modal-content">
        <h3>{{ editingCategory ? 'Edit Budget' : 'Add Category' }}</h3>
        <form @submit.prevent="handleCatSubmit">
          <label>Category Name</label>
          <input type="text" v-model="catForm.name" :disabled="!!editingCategory" required placeholder="e.g. Labor" />

          <label>Budget Amount (₱)</label>
          <input type="number" step="0.01" v-model.number="catForm.budget_amount" required />

          <div class="flex-end gap">
            <button type="button" @click="showCatModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Category</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showExpModal" class="modal-backdrop">
      <div class="card modal-content">
        <h3>{{ editingExpense ? 'Edit Expense' : 'Log Expense' }}</h3>
        <form @submit.prevent="handleExpSubmit">
          <label>Category</label>
          <select v-model="expForm.category_id" required>
            <option disabled value="">Select category</option>
            <option v-for="cat in farmStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>

          <label>Description</label>
          <input type="text" v-model="expForm.description" required placeholder="e.g. Paid weekly labor" />

          <label>Amount (₱)</label>
          <input type="number" step="0.01" v-model.number="expForm.amount" required />

          <label>Paid To</label>
          <input type="text" v-model="expForm.paid_to" placeholder="e.g. Cousin / Laborers" />

          <label>Date</label>
          <input type="date" v-model="expForm.date" required />

          <label class="checkbox-label">
            <input type="checkbox" v-model="expForm.receipt_confirmed" />
            Receipt Confirmed (Proof sent via Messenger)
          </label>

          <div class="flex-end gap" style="margin-top: 16px;">
            <button type="button" @click="showExpModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFarmStore } from '../stores/farm'
import { useAttendanceStore } from '../stores/attendance'
import type { CategorySummary, Expense, Attendance } from '../types'

const route = useRoute()
const farmStore = useFarmStore()
const attendanceStore = useAttendanceStore()

const activeTab = ref<'ledger' | 'attendance'>('ledger')
const selectedCategoryFilter = ref<string>('')

// Attendance Logger State
const attendanceDate = ref<string>(new Date().toISOString().split('T')[0])
const selectedLaborerIds = ref<string[]>([])
const attendanceEvidenceConfirmed = ref<boolean>(false)

// Category & Expense Modals
const showCatModal = ref<boolean>(false)
const editingCategory = ref<CategorySummary | null>(null)
const catForm = ref<{ name: string; budget_amount: number }>({ name: '', budget_amount: 0 })

const showExpModal = ref<boolean>(false)
const editingExpense = ref<Expense | null>(null)
const expForm = ref<{
  category_id: string
  description: string
  amount: number
  paid_to: string
  date: string
  receipt_confirmed: boolean
}>({
  category_id: '',
  description: '',
  amount: 0,
  paid_to: '',
  date: new Date().toISOString().split('T')[0],
  receipt_confirmed: false
})

onMounted(async () => {
  const cycleId = route.params.id as string
  await Promise.all([
    farmStore.fetchCycleData(cycleId),
    attendanceStore.fetchLaborers(),
    attendanceStore.fetchCycleAttendance(cycleId)
  ])
})

const filteredExpenses = computed<Expense[]>(() => {
  if (!selectedCategoryFilter.value) return farmStore.expenses
  return farmStore.expenses.filter(e => e.category_id === selectedCategoryFilter.value)
})

// Calculate total actual expenses under "Labor" category
const actualLaborExpense = computed<number>(() => {
  const laborCat = farmStore.categories.find(c => c.name.toLowerCase().includes('labor'))
  if (!laborCat) return 0
  return farmStore.expenses
    .filter(e => e.category_id === laborCat.id)
    .reduce((sum, e) => sum + Number(e.amount), 0)
})

function getCategoryName(catId: string): string {
  const cat = farmStore.categories.find(c => c.id === catId)
  return cat ? cat.name : 'Unknown'
}

function getLaborerName(laborerId: string): string {
  const laborer = attendanceStore.laborers.find(l => l.id === laborerId)
  return laborer ? laborer.name : 'Unknown'
}

async function handleSaveAttendance(): Promise<void> {
  if (!farmStore.currentCycle) return
  await attendanceStore.saveDailyAttendance(
    farmStore.currentCycle.id,
    attendanceDate.value,
    selectedLaborerIds.value,
    attendanceEvidenceConfirmed.value
  )
  alert(`Attendance saved for ${attendanceDate.value}`)
}

function loadDateForEdit(date: string, records: Attendance[], evidenceConfirmed: boolean): void {
  attendanceDate.value = date
  selectedLaborerIds.value = records.filter(r => r.present).map(r => r.laborer_id)
  attendanceEvidenceConfirmed.value = evidenceConfirmed
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openAddCategory(): void {
  editingCategory.value = null
  catForm.value = { name: '', budget_amount: 0 }
  showCatModal.value = true
}

function openEditBudget(category: CategorySummary): void {
  editingCategory.value = category
  catForm.value = { name: category.name, budget_amount: category.budget_amount }
  showCatModal.value = true
}

async function handleCatSubmit(): Promise<void> {
  if (!farmStore.currentCycle) return
  if (editingCategory.value) {
    await farmStore.updateCategoryBudget(editingCategory.value.id, catForm.value.budget_amount)
  } else {
    await farmStore.addCategory(farmStore.currentCycle.id, catForm.value.name, catForm.value.budget_amount)
  }
  showCatModal.value = false
}

function openAddExpense(): void {
  editingExpense.value = null
  expForm.value = {
    category_id: farmStore.categories[0]?.id || '',
    description: '',
    amount: 0,
    paid_to: '',
    date: new Date().toISOString().split('T')[0],
    receipt_confirmed: false
  }
  showExpModal.value = true
}

function openEditExpense(exp: Expense): void {
  editingExpense.value = exp
  expForm.value = {
    category_id: exp.category_id,
    description: exp.description,
    amount: exp.amount,
    paid_to: exp.paid_to || '',
    date: exp.date,
    receipt_confirmed: exp.receipt_confirmed
  }
  showExpModal.value = true
}

async function handleExpSubmit(): Promise<void> {
  if (!farmStore.currentCycle) return
  const payload = {
    ...expForm.value,
    cycle_id: farmStore.currentCycle.id
  }
  if (editingExpense.value) {
    await farmStore.updateExpense(editingExpense.value.id, payload)
  } else {
    await farmStore.addExpense(payload)
  }
  showExpModal.value = false
}

async function confirmDeleteExpense(expId: string): Promise<void> {
  if (confirm('Delete this expense?')) {
    await farmStore.deleteExpense(expId)
  }
}

async function confirmClose(): Promise<void> {
  if (!farmStore.currentCycle) return
  if (confirm('Closing a cycle makes it read-only. Are you sure?')) {
    await farmStore.closeCycle(farmStore.currentCycle.id)
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
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.sub-text {
  font-size: 0.85rem;
  color: #666;
  margin-top: 2px;
}
.status-tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}
.status-tag.active {
  background: #e8f5e9;
  color: #2e7d32;
}
.status-tag.closed {
  background: #eee;
  color: #666;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  border-bottom: 2px solid var(--border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.tab-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  color: #666;
  white-space: nowrap;
  flex: 0 0 auto;
}
.tab-btn.active {
  color: var(--primary);
  border-bottom: 3px solid var(--primary);
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}
.summary-box {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}
.summary-box .label {
  font-size: 0.8rem;
  color: #666;
}
.summary-box .val {
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 4px;
}
.labor-crosscheck {
  margin-top: 16px;
  padding: 12px;
  background: #f0f7f0;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
}
.crosscheck-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}
.cost-val {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary-dark);
}
.warn-text {
  color: var(--warning);
  font-size: 0.75rem;
  display: block;
}
.cat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}
.cat-item {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
}
.cat-amounts {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cat-item.over-budget {
  border-color: var(--danger);
  background: #fff8f8;
}
.over-flag {
  color: var(--danger);
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: 8px;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
}
.progress-bar-bg {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--primary);
}
.progress-bar-fill.danger {
  background: var(--danger);
}
.laborer-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.laborer-checkbox-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  background: #fafafa;
}
.laborer-checkbox-card.selected {
  border-color: var(--primary);
  background: #e8f5e9;
}
.laborer-checkbox-card input {
  width: auto;
  margin: 0;
}
.laborer-info {
  display: flex;
  flex-direction: column;
}
.roster-table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  margin-top: 8px;
}
.table-responsive {
  overflow-x: auto;
}
.roster-table th, .roster-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}
.history-card {
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: 6px;
}
.present-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.present-tag {
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}
.filter-box {
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-box select {
  min-width: 220px;
}
.expense-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.expense-card {
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: 6px;
}
.exp-sub {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}
.exp-amount {
  font-weight: bold;
  font-size: 1rem;
}
.exp-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}
.receipt-btn {
  border: 1px solid var(--border);
  background: #f5f5f5;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.receipt-btn.confirmed {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #a5d6a7;
}
.btn-sm {
  font-size: 0.75rem;
  padding: 4px 8px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}
.checkbox-label input {
  width: auto;
  margin: 0;
}
.empty {
  color: #777;
  font-style: italic;
  margin-top: 8px;
}
.text-muted {
  color: #888;
  font-size: 0.8rem;
}
.font-bold {
  font-weight: bold;
}
.text-right {
  text-align: right;
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

@media (max-width: 900px) {
  .flex-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .section-head > button {
    width: 100%;
  }

  .grid-2,
  .crosscheck-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .cat-amounts {
    flex-wrap: wrap;
  }

  .filter-box {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-box select {
    min-width: 0;
    width: 100%;
  }

  .exp-actions .flex-end {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .modal-content {
    margin-top: 12px;
  }
}

@media (max-width: 560px) {
  .tab-btn {
    padding: 8px 10px;
    font-size: 0.85rem;
  }
}
</style>