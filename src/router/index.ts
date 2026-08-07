import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import CyclesView from '../views/CyclesView.vue'
import CycleDetailView from '../views/CycleDetailView.vue'
import LaborersView from '../views/LaborersView.vue'
import EquipmentView from '../views/EquipmentView.vue'

const routes: RouteRecordRaw[] = [
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/', name: 'Cycles', component: CyclesView, meta: { requiresAuth: true } },
    { path: '/cycle/:id', name: 'CycleDetail', component: CycleDetailView, meta: { requiresAuth: true } },
    { path: '/laborers', name: 'Laborers', component: LaborersView, meta: { requiresAuth: true } },
    { path: '/equipment', name: 'Equipment', component: EquipmentView, meta: { requiresAuth: true } }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()
    if (!authStore.session) {
        await authStore.fetchSession()
    }

    if (to.meta.requiresAuth && !authStore.user) {
        next('/login')
    } else if (to.path === '/login' && authStore.user) {
        next('/')
    } else {
        next()
    }
})

export default router