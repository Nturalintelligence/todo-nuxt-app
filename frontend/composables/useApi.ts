import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export const useApi = () => {
  const authStore = useAuthStore()

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
  })

  api.interceptors.request.use((config) => {
    const token = authStore.token
    if (token) {
      
      config.headers['Authorization'] = 'Bearer ' + token
      console.log('Запрос с токеном:', token) 
    } else {
      console.log('Токена нет в Store!')
    }
    return config
  }, (error) => {
    return Promise.reject(error)
  })

  return api
}