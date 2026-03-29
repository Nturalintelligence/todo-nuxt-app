<template>
  <div class="main-wrapper">
    <div class="bubbles">
      <div v-for="n in 10" :key="n" class="bubble"></div>
    </div>

    <div class="login-container glass">
      <div class="login-box">
        <div class="logo">🐱</div>
        <h2>{{ isLogin ? 'Вход в ToDo' : 'Регистрация' }}</h2>
        <p class="subtitle">{{ isLogin ? 'С возвращением!' : 'Присоединяйся к котикам' }}</p>

        <form @submit.prevent="handleSubmit" class="login-form">
          <input v-model="form.email" type="email" placeholder="Email" required class="input-field" />
          <input v-model="form.password" type="password" placeholder="Пароль" required class="input-field" />
          
          <button type="submit" :disabled="loading" class="btn-login">
            <span v-if="!loading">{{ isLogin ? 'Войти ✨' : 'Создать аккаунт 🚀' }}</span>
            <div v-else class="spinner"></div>
          </button>
        </form>
        
        <p v-if="message" :class="['msg', { 'error': isError }]">{{ message }}</p>

        <div class="toggle-mode">
          <button @click="toggleMode" class="btn-link">
            {{ isLogin ? 'Нет аккаунта? Зарегистрируйся' : 'Уже есть аккаунт? Войди' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isLogin = ref(true)
const loading = ref(false)
const message = ref('')
const isError = ref(false)

const form = ref({ email: '', password: '' })

const toggleMode = () => {
  isLogin.value = !isLogin.value
  message.value = ''
  isError.value = false
}

const handleSubmit = async () => {
  loading.value = true
  message.value = ''
  isError.value = false

  try {
    if (isLogin.value) {
      await auth.login(form.value.email, form.value.password)
      navigateTo('/')
    } else {
      // Регистрация через прокси Nuxt (наш useApi)
      const api = useApi()
      await api.post('/register', form.value)
      message.value = 'Аккаунт создан! Теперь введите данные для входа.'
      isLogin.value = true // Переключаем на вход
      form.value.password = '' // Очищаем пароль для безопасности
    }
  } catch (err) {
    isError.value = true
    message.value = err.response?.data?.error || 'Ошибка соединения с сервером'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Центрирование всей страницы */
.main-wrapper {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c3e0dc 0%, #e2d5ed 100%);
  position: fixed; /* Чтобы фон не дергался */
  top: 0;
  left: 0;
  overflow: hidden;
  font-family: sans-serif;
}

.glass {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  text-align: center;
  z-index: 10;
  margin: 20px;
}

.logo { font-size: 50px; margin-bottom: 10px; }
h2 { margin: 0; color: #333; }
.subtitle { color: #666; font-size: 0.9em; margin-bottom: 30px; }

.login-form { display: flex; flex-direction: column; gap: 15px; }

.input-field {
  width: 100%;
  padding: 12px 15px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.6);
  box-sizing: border-box;
  font-size: 16px;
}

.btn-login {
  background: #42b883;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  transition: transform 0.2s;
}

.btn-login:hover:not(:disabled) { transform: scale(1.02); background: #3aa675; }
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.
  8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.msg { margin-top: 15px; font-size: 0.9em; color: #27ae60; font-weight: bold; }
.msg.error { color: #e74c3c; }

.toggle-mode { margin-top: 25px; }
.btn-link { 
  background: none; 
  border: none; 
  color: #3498db; 
  cursor: pointer; 
  text-decoration: underline; 
  font-size: 0.9em; 
}

/* Пузыри */
.bubbles { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
.bubble { 
  position: absolute; 
  bottom: -100px; 
  background: rgba(255, 255, 255, 0.2); 
  border-radius: 50%; 
  animation: rise 10s infinite ease-in; 
}

.bubble:nth-child(1) { left: 10%; width: 80px; height: 80px; animation-duration: 8s; }
.bubble:nth-child(2) { left: 20%; width: 30px; height: 30px; animation-delay: 2s; }
.bubble:nth-child(3) { left: 70%; width: 50px; height: 50px; animation-delay: 4s; }
.bubble:nth-child(4) { left: 90%; width: 20px; height: 20px; animation-duration: 6s; }

@keyframes rise {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 0.5; }
  100% { transform: translateY(-120vh); opacity: 0; }
}
</style>