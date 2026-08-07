import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { Laborer, Attendance, LaborerAttendanceSummary } from '../types'

export const useAttendanceStore = defineStore('attendance', () => {
    const laborers = ref<Laborer[]>([])
    const cycleAttendance = ref<Attendance[]>([])
    const loading = ref<boolean>(false)

    // Fetch global laborer roster
    async function fetchLaborers(): Promise<void> {
        loading.value = true
        const { data, error } = await supabase
            .from('laborers')
            .select('*')
            .order('name', { ascending: true })
        if (!error && data) laborers.value = data as Laborer[]
        loading.value = false
    }

    async function addLaborer(name: string, dailyRate: number | null): Promise<void> {
        const { error } = await supabase
            .from('laborers')
            .insert([{ name, daily_rate: dailyRate }])
        if (error) throw error
        await fetchLaborers()
    }

    async function updateLaborer(id: string, name: string, dailyRate: number | null): Promise<void> {
        const { error } = await supabase
            .from('laborers')
            .update({ name, daily_rate: dailyRate })
            .eq('id', id)
        if (error) throw error
        await fetchLaborers()
    }

    async function deleteLaborer(id: string): Promise<void> {
        const { error } = await supabase.from('laborers').delete().eq('id', id)
        if (error) throw error
        await fetchLaborers()
    }

    // Fetch attendance records for a specific crop cycle
    async function fetchCycleAttendance(cycleId: string): Promise<void> {
        loading.value = true
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('cycle_id', cycleId)
            .order('date', { ascending: false })
        if (!error && data) cycleAttendance.value = data as Attendance[]
        loading.value = false
    }

    // Save daily attendance for a date (bulk upsert present state)
    async function saveDailyAttendance(
        cycleId: string,
        date: string,
        presentLaborerIds: string[],
        evidenceConfirmed: boolean
    ): Promise<void> {
        if (laborers.value.length === 0) await fetchLaborers()

        const recordsToUpsert = laborers.value.map(laborer => ({
            cycle_id: cycleId,
            laborer_id: laborer.id,
            date,
            present: presentLaborerIds.includes(laborer.id),
            evidence_confirmed: evidenceConfirmed
        }))

        const { error } = await supabase
            .from('attendance')
            .upsert(recordsToUpsert, { onConflict: 'cycle_id,laborer_id,date' })

        if (error) throw error
        await fetchCycleAttendance(cycleId)
    }

    async function toggleEvidenceForDate(cycleId: string, date: string, currentStatus: boolean): Promise<void> {
        const { error } = await supabase
            .from('attendance')
            .update({ evidence_confirmed: !currentStatus })
            .eq('cycle_id', cycleId)
            .eq('date', date)
        if (error) throw error
        await fetchCycleAttendance(cycleId)
    }

    // Attendance grouped by date
    const attendanceByDate = computed(() => {
        const groups: Record<string, { date: string; evidenceConfirmed: boolean; records: Attendance[] }> = {}

        cycleAttendance.value.forEach(record => {
            if (!groups[record.date]) {
                groups[record.date] = {
                    date: record.date,
                    evidenceConfirmed: record.evidence_confirmed,
                    records: []
                }
            }
            groups[record.date].records.push(record)
            if (record.evidence_confirmed) {
                groups[record.date].evidenceConfirmed = true
            }
        })

        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
    })

    // Per Laborer summary for the current cycle
    const laborerSummaries = computed<LaborerAttendanceSummary[]>(() => {
        return laborers.value.map(laborer => {
            const presentRecords = cycleAttendance.value.filter(
                a => a.laborer_id === laborer.id && a.present
            )
            const daysPresent = presentRecords.length
            const rate = laborer.daily_rate ? Number(laborer.daily_rate) : 0

            return {
                laborer,
                daysPresent,
                expectedCost: daysPresent * rate,
                hasRate: laborer.daily_rate !== null && laborer.daily_rate !== undefined
            }
        })
    })

    // Total Expected Labor Cost for current cycle (excluding unrated laborers)
    const totalExpectedLaborCost = computed<number>(() => {
        return laborerSummaries.value.reduce((sum, item) => sum + item.expectedCost, 0)
    })

    // Count of present days for laborers without a set daily rate
    const unratedPresentDaysCount = computed<number>(() => {
        return laborerSummaries.value
            .filter(item => !item.hasRate)
            .reduce((sum, item) => sum + item.daysPresent, 0)
    })

    return {
        laborers,
        cycleAttendance,
        loading,
        attendanceByDate,
        laborerSummaries,
        totalExpectedLaborCost,
        unratedPresentDaysCount,
        fetchLaborers,
        addLaborer,
        updateLaborer,
        deleteLaborer,
        fetchCycleAttendance,
        saveDailyAttendance,
        toggleEvidenceForDate
    }
})