import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)

    async function fetchSession(): Promise<void> {
        const { data } = await supabase.auth.getSession()
        session.value = data.session
        user.value = data.session?.user || null

        supabase.auth.onAuthStateChange((_event, _session) => {
            session.value = _session
            user.value = _session?.user || null
        })
    }

    async function login(email: string, password: string): Promise<void> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        user.value = data.user
        session.value = data.session
    }

    async function logout(): Promise<void> {
        await supabase.auth.signOut()
        user.value = null
        session.value = null
    }

    return { user, session, fetchSession, login, logout }
})