export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (process.server) return

  if (!authStore.token) {
    const savedToken = localStorage.getItem('token')
    const savedEmail = localStorage.getItem('userEmail')
    
    if (savedToken) {
      authStore.token = savedToken
      authStore.userEmail = savedEmail
    }
  }

  if (!authStore.token && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (authStore.token && to.path === '/login') {
    return navigateTo('/')
  }
})