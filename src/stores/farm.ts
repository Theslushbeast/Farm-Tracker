import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { CropCycle, Category, Expense, CategorySummary } from '../types'

export const useFarmStore = defineStore('farm', () => {
    const cycles = ref<CropCycle[]>([])
    const currentCycle = ref<CropCycle | null>(null)
    const categories = ref<Category[]>([])
    const expenses = ref<Expense[]>([])
    const loading = ref<boolean>(false)

    async function fetchCycles(): Promise<void> {
        loading.value = true
        const { data, error } = await supabase
            .from('crop_cycles')
            .select('*')
            .order('created_at', { ascending: false })
        if (!error && data) cycles.value = data as CropCycle[]
        loading.value = false
    }

    async function fetchCycleData(cycleId: string): Promise<void> {
        loading.value = true
        const [cycleRes, catRes, expRes] = await Promise.all([
            supabase.from('crop_cycles').select('*').eq('id', cycleId).single(),
            supabase.from('categories').select('*').eq('cycle_id', cycleId).order('name'),
            supabase.from('expenses').select('*').eq('cycle_id', cycleId).order('date', { ascending: false })
        ])

        if (!cycleRes.error && cycleRes.data) currentCycle.value = cycleRes.data as CropCycle
        if (!catRes.error && catRes.data) categories.value = catRes.data as Category[]
        if (!expRes.error && expRes.data) expenses.value = expRes.data as Expense[]
        loading.value = false
    }

    async function createCycle(name: string, startDate: string): Promise<CropCycle> {
        const user = (await supabase.auth.getUser()).data.user
        const { data, error } = await supabase
            .from('crop_cycles')
            .insert([{ name, start_date: startDate, created_by: user?.id }])
            .select()
        if (error || !data) throw error
        await fetchCycles()
        return data[0] as CropCycle
    }

    async function closeCycle(cycleId: string): Promise<void> {
        const { error } = await supabase
            .from('crop_cycles')
            .update({ status: 'closed', end_date: new Date().toISOString().split('T')[0] })
            .eq('id', cycleId)
        if (error) throw error
        await fetchCycleData(cycleId)
    }

    async function addCategory(cycleId: string, name: string, budgetAmount: number): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .insert([{ cycle_id: cycleId, name, budget_amount: budgetAmount }])
        if (error) throw error
        await fetchCycleData(cycleId)
    }

    async function updateCategoryBudget(categoryId: string, budgetAmount: number): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .update({ budget_amount: budgetAmount })
            .eq('id', categoryId)
        if (error) throw error
        if (currentCycle.value) await fetchCycleData(currentCycle.value.id)
    }

    async function addExpense(expenseData: Omit<Expense, 'id' | 'created_at' | 'created_by'>): Promise<void> {
        const user = (await supabase.auth.getUser()).data.user
        const { error } = await supabase
            .from('expenses')
            .insert([{ ...expenseData, created_by: user?.id }])
        if (error) throw error
        await fetchCycleData(expenseData.cycle_id)
    }

    async function updateExpense(expenseId: string, expenseData: Partial<Expense>): Promise<void> {
        const { error } = await supabase
            .from('expenses')
            .update(expenseData)
            .eq('id', expenseId)
        if (error) throw error
        if (currentCycle.value) await fetchCycleData(currentCycle.value.id)
    }

    async function deleteExpense(expenseId: string): Promise<void> {
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
        if (error) throw error
        if (currentCycle.value) await fetchCycleData(currentCycle.value.id)
    }

    async function toggleReceiptConfirmed(expenseId: string, currentStatus: boolean): Promise<void> {
        const { error } = await supabase
            .from('expenses')
            .update({ receipt_confirmed: !currentStatus })
            .eq('id', expenseId)
        if (error) throw error
        if (currentCycle.value) await fetchCycleData(currentCycle.value.id)
    }

    const categorySummaries = computed<CategorySummary[]>(() => {
        return categories.value.map(cat => {
            const spent = expenses.value
                .filter(exp => exp.category_id === cat.id)
                .reduce((sum, exp) => sum + Number(exp.amount), 0)
            const budget = Number(cat.budget_amount)
            return {
                ...cat,
                spent,
                remaining: budget - spent,
                isOverBudget: spent > budget
            }
        })
    })

    const totalBudgeted = computed<number>(() => {
        return categories.value.reduce((sum, cat) => sum + Number(cat.budget_amount), 0)
    })

    const totalSpent = computed<number>(() => {
        return expenses.value.reduce((sum, exp) => sum + Number(exp.amount), 0)
    })

    return {
        cycles,
        currentCycle,
        categories,
        expenses,
        loading,
        categorySummaries,
        totalBudgeted,
        totalSpent,
        fetchCycles,
        fetchCycleData,
        createCycle,
        closeCycle,
        addCategory,
        updateCategoryBudget,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleReceiptConfirmed
    }
})