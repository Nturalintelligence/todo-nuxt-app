import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 1. Инициализируем переменные, безопасно проверяя клиентскую сторону
  const token = ref<string | null>(null)
  const userEmail = ref<string | null>(null)

  // Функция для загрузки данных из localStorage (вызываем один раз при старте)
  function initAuth() {
    if (import.meta.client) {
      try {
        const savedToken = localStorage.getItem('token')
        const savedEmail = localStorage.getItem('userEmail')
        
        if (savedToken && savedEmail) {
          token.value = savedToken
          userEmail.value = savedEmail
          console.log('AuthStore: Данные восстановлены из localStorage:', savedEmail)
        } else {
          console.log('AuthStore: В localStorage пусто, пользователь не залогинен.')
        }
      } catch (e) {
        console.error('AuthStore: Ошибка чтения localStorage:', e)
      }
    }
  }

  // Действие: Логин
  async function login(email: string, password: string) {
    try {
      // вызываем useApi внутри, чтобы избежать круговой зависимости
      const api = useApi() 
      const { data } = await api.post('/login', { email, password })
      
      // Записываем в реактивные переменные
      token.value = data.token
      userEmail.value = email
      
      // Сохраняем в localStorage
      if (import.meta.client) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userEmail', email)
        console.log('✅ AuthStore: Успешный вход, токен сохранен.')
      }
      return true
    } catch (error) {
      console.error('❌ AuthStore: Ошибка входа:', error)
      throw error
    }
  }

  // Действие: Выход
  function logout() {
    token.value = null
    userEmail.value = null
    if (import.meta.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('userEmail')
      console.log('ℹ️ AuthStore: Пользователь вышел, данные очищены.')
    }
    return navigateTo('/login')
  }

  return { 
    token, 
    userEmail, 
    initAuth, 
    login, 
    logout 
  }
})