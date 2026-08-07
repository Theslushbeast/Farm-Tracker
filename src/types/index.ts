export type CycleStatus = 'active' | 'closed'

export interface CropCycle {
    id: string
    name: string
    start_date: string
    end_date: string | null
    status: CycleStatus
    created_by: string | null
    created_at: string
}

export interface Category {
    id: string
    cycle_id: string
    name: string
    budget_amount: number
    created_at: string
}

export interface Expense {
    id: string
    cycle_id: string
    category_id: string
    amount: number
    description: string
    paid_to: string | null
    date: string
    receipt_confirmed: boolean
    created_by: string | null
    created_at: string
}

export interface CategorySummary extends Category {
    spent: number
    remaining: number
    isOverBudget: boolean
}

export interface Laborer {
    id: string
    name: string
    daily_rate: number | null
    created_at: string
}

export interface Attendance {
    id: string
    cycle_id: string
    laborer_id: string
    date: string
    present: boolean
    evidence_confirmed: boolean
    created_at: string
}

export interface LaborerAttendanceSummary {
    laborer: Laborer
    daysPresent: number
    expectedCost: number
    hasRate: boolean
}

// Phase C Additions
export type LoanCondition = 'Good' | 'Damaged' | 'Missing'

export interface Item {
    id: string
    name: string
    created_at: string
}

export interface ItemLoan {
    id: string
    item_id: string
    borrower_name: string
    date_out: string
    date_in: string | null
    condition: LoanCondition | null
    notes: string | null
    created_by: string | null
    created_at: string
    item?: Item
}