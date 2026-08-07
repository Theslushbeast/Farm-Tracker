import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { Item, ItemLoan, LoanCondition } from '../types'

export const useEquipmentStore = defineStore('equipment', () => {
    const items = ref<Item[]>([])
    const loans = ref<ItemLoan[]>([])
    const loading = ref<boolean>(false)

    // Fetch equipment item roster
    async function fetchItems(): Promise<void> {
        loading.value = true
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('name', { ascending: true })
        if (!error && data) items.value = data as Item[]
        loading.value = false
    }

    async function addItem(name: string): Promise<void> {
        const { error } = await supabase.from('items').insert([{ name }])
        if (error) throw error
        await fetchItems()
    }

    async function updateItem(id: string, name: string): Promise<void> {
        const { error } = await supabase.from('items').update({ name }).eq('id', id)
        if (error) throw error
        await fetchItems()
    }

    async function deleteItem(id: string): Promise<void> {
        const { error } = await supabase.from('items').delete().eq('id', id)
        if (error) throw error
        await fetchItems()
    }

    // Fetch all loans (open and closed)
    async function fetchLoans(): Promise<void> {
        loading.value = true
        const { data, error } = await supabase
            .from('item_loans')
            .select('*, item:items(*)')
            .order('date_out', { ascending: false })
        if (!error && data) loans.value = data as ItemLoan[]
        loading.value = false
    }

    // Create new loan entry
    async function createLoan(itemId: string, borrowerName: string, dateOut: string): Promise<void> {
        const { data: userData } = await supabase.auth.getUser()
        const { error } = await supabase.from('item_loans').insert([{
            item_id: itemId,
            borrower_name: borrowerName,
            date_out: dateOut,
            created_by: userData.user?.id || null
        }])
        if (error) throw error
        await fetchLoans()
    }

    // Mark loan as returned
    async function returnLoan(
        loanId: string,
        dateIn: string,
        condition: LoanCondition,
        notes: string | null
    ): Promise<void> {
        const { error } = await supabase
            .from('item_loans')
            .update({
                date_in: dateIn,
                condition,
                notes: notes || null
            })
            .eq('id', loanId)
        if (error) throw error
        await fetchLoans()
    }

    // Active loans (not yet returned)
    const activeLoans = computed(() => {
        return loans.value.filter(loan => !loan.date_in)
    })

    // Loans history (returned)
    const historyLoans = computed(() => {
        return loans.value.filter(loan => !!loan.date_in)
    })

    // Helper check for overdue loans (> 14 days out without return)
    function isOverdue(dateOutStr: string): boolean {
        const dateOut = new Date(dateOutStr)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - dateOut.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 14
    }

    return {
        items,
        loans,
        loading,
        activeLoans,
        historyLoans,
        fetchItems,
        addItem,
        updateItem,
        deleteItem,
        fetchLoans,
        createLoan,
        returnLoan,
        isOverdue
    }
})