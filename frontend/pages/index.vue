<template>
  <div class="main-wrapper">
    <div class="bubbles">
      <div v-for="n in 10" :key="n" class="bubble"></div>
    </div>

    <div class="container glass">
      <header class="header">
        <div class="user-profile">
          <img 
            :src="avatarUrl" 
            class="avatar" 
            alt="User Avatar" 
          />
          <div class="user-info">
            <span class="user-email">{{ authStore.userEmail || 'Загрузка...' }}</span>
          </div>
        </div>
        
        <button @click="authStore.logout()" class="btn-logout">
          <span>Выйти</span> 🚪
        </button>
      </header>

      <section class="task-form glass-dark">
        <h3>✨ Создать новую задачу</h3>
        <div class="form-group">
          <input 
            v-model="newTask.title" 
            placeholder="Название задачи (например, Покормить кота)" 
            class="input-field"
          >
          <textarea 
            v-model="newTask.description" 
            placeholder="Описание (необязательно)" 
            class="input-field"
          ></textarea>
          
          <div class="row">
            <input 
              v-model="newTask.dueDate" 
              type="date" 
              class="input-field date-input"
            >
            <button 
              @click="createTask" 
              :disabled="creating || !newTask.title" 
              class="btn-primary"
            >
              <span v-if="creating">👀 Сохраняю...</span>
              <span v-else>Добавить ➕</span>
            </button>
          </div>
        </div>
      </section>

      <section class="filters glass-light">
        <input v-model="searchQuery" placeholder="🔍 Быстрый поиск..." class="search-input">
        
        <div class="filter-controls">
          <select v-model="statusFilter" class="select-field">
            <option value="all">📊 Все задачи</option>
            <option value="active">🏃 Активные</option>
            <option value="completed">✅ Выполненные</option>
          </select>

          <select v-model="sortBy" class="select-field">
            <option value="createdAt">🆕 Сначала новые</option>
            <option value="title">🔤 По алфавиту</option>
            <option value="dueDate">📅 По дедлайну</option>
          </select>
        </div>
      </section>

      <div v-if="loading" class="status-msg loading-msg">⏳ Загрузка списка котиками...</div>
      
      <div v-else-if="filteredTasks.length === 0" class="status-msg empty-msg">
        {{ tasks.length === 0 ? 'Список пуст. Добавьте задачу!' : 'Ничего не найдено 🔍' }}
      </div>

      <transition-group name="task-list" tag="ul" class="task-list">
        <li v-for="task in filteredTasks" :key="task.id" class="task-item glass-item" :class="{ 'is-done': task.isCompleted }">
          <div class="task-info">
            <h4>{{ task.title }}</h4>
            <p>{{ task.description }}</p>
            <small v-if="task.dueDate" class="deadline">📅 {{ task.dueDate }}</small>
          </div>

          <div class="task-actions">
            <button @click="toggleTask(task)" class="btn-status" :title="task.isCompleted ? 'Вернуть' : 'Выполнить'">
              <span v-if="task.isCompleted">↩️</span>
              <span v-else>✔️</span>
            </button>
            <button @click="deleteTask(task.id)" class="btn-delete" title="Удалить">🗑️</button>
          </div>
        </li>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const avatarUrl = computed(() => {
  const email = authStore.userEmail || 'guest'
  return 'https://robohash.org/' + email + '.png?set=set4'
})

const authStore = useAuthStore()
const api = useApi()

// Состояние
const tasks = ref([])
const loading = ref(true)
const creating = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const sortBy = ref('createdAt')

const newTask = ref({
  title: '',
  description: '',
  dueDate: '',
  isCompleted: false
})

// Загрузка
const fetchTasks = async () => {
  try {
    const { data } = await api.get('/tasks')
    tasks.value = data
  } catch (e) {
    console.error(e)
  } finally {
    setTimeout(() => loading.value = false, 500) // Искусственная задержка для красоты
  }
}

// Создание
const createTask = async () => {
  if (!newTask.value.title) return
  creating.value = true
  try {
    const { data } = await api.post('/tasks', { ...newTask.value })
    tasks.value.push(data)
    newTask.value = { title: '', description: '', dueDate: '', isCompleted: false }
  } catch (e) {
    alert('Ошибка создания')
  } finally {
    creating.value = false
  }
}

// Удаление
const deleteTask = async (id) => {
  if (!confirm('🗑️ Удалить эту задачу?')) return
  try {
    await api.delete(`/tasks/${id}`)
    tasks.value = tasks.value.filter(t => t.id !== id)
  } catch (e) {
    alert('Ошибка удаления')
  }
}

// Статус
const toggleTask = async (task) => {
  const oldStatus = task.isCompleted
  task.isCompleted = !task.isCompleted
  try {
    await api.put(`/tasks/${task.id}`, task)
  } catch (e) {
    task.isCompleted = oldStatus
    alert('Ошибка обновления')
  }
}

// Фильтрация
const filteredTasks = computed(() => {
  let result = [...tasks.value]
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
  }
  if (statusFilter.value === 'active') result = result.filter(t => !t.isCompleted)
  if (statusFilter.value === 'completed') result = result.filter(t => t.isCompleted)

  result.sort((a, b) => {
    if (sortBy.value === 'title') return a.title.localeCompare(b.title)
    if (sortBy.value === 'dueDate') return (new Date(a.dueDate || 0)).getTime() - (new Date(b.dueDate || 0)).getTime()
    return b.id - a.id
  })
  return result
})

onMounted(fetchTasks)
</script>

<style>
/* Глобальные сбросы, чтобы "не текло" */
body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow-x: hidden;
  background-color: #f0f7f4;
}
</style>

<style scoped>
/* Основной wrapper с живым фоном */
.main-wrapper {
  min-height: 100vh;
  width: 100vw;
  position: relative;
  background: linear-gradient(135deg, #c3e0dc 0%, #e2d5ed 100%);
  padding: 40px 20px;
  box-sizing: border-box;
}

/* Эффект матового стекла */
.glass {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
}

.glass-dark {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-light {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.container {
  max-width: 700px;
  margin: 0 auto;
  border-radius: 30px;
  padding: 40px;
  position: relative;
  z-index: 10;
}

/* Хедер и аватарка */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 50%;
  padding: 5px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  border: 2px solid #fff;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.welcome-text {
  font-size: 0.9em;
  color: #666;
}

.user-email {
  font-weight: 700;
  font-size: 1.1em;
  color: #333;
}

/* Форма */
.task-form {
  padding: 25px;
  border-radius: 20px;
  margin-bottom: 30px;
}

.task-form h3 {
  margin-top: 0;
  color: #444;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-field {
  padding: 12px 15px;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 10px;
  background: rgba(255,255,255,0.7);
  font-size: 14px;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #42b883;
  background: #fff;
}

textarea.input-field {
  resize: vertical;
  height: 60px;
}

.row {
  display: flex;
  gap: 12px;
}

.date-input {
  flex: 1;
}

/* Фильтры */
.filters {
  padding: 15px;
  border-radius: 15px;
  margin-bottom: 25px;
}

.search-input {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.05);
  box-sizing: border-box;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.select-field {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.05);
  background: rgba(255,255,255,0.5);
}

/* Список задач */
.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255,255,255,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-item:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}

.is-done {
  background: rgba(200, 230, 201, 0.4);
  opacity: 0.8;
  border-color: rgba(0,0,0,0.05);
}

.task-info h4 {
  margin: 0 0 5px 0;
  font-size: 1.1em;
  color: #2c3e50;
}

.is-done h4 {
  text-decoration: line-through;
  color: #7f8c8d;
}

.task-info p {
  margin: 0;
  font-size: 0.9em;
  color: #7f8c8d;
}

.deadline {
  display: inline-block;
  margin-top: 5px;
  background: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8em;
  color: #e67e22;
}

/* Кнопки */
button {
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #42b883;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: bold;
}

.btn-primary:hover:not(:disabled) {
  background: #33a06f;
  transform: scale(1.03);
}

.btn-primary:disabled {
  background: #a8d5c2;
  cursor: not-allowed;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.btn-status, .btn-delete {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  padding: 10px;
  border-radius: 10px;
  font-size: 1.1em;
}

.btn-status:hover {
  background: #e8f5e9;
  border-color: #42b883;
}

.btn-delete:hover {
  background: #ffebee;
  border-color: #ef5350;
}

.btn-logout {
  background: none;
  border: 1px solid rgba(0,0,0,0.1);
  color: #666;
  padding: 8px 15px;
  border-radius: 8px;
}

.btn-logout:hover {
  background: rgba(255,255,255,0.3);
  color: #333;
}

/* Анимации списка */
.task-list-enter-active, .task-list-leave-active {
  transition: all 0.5s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* CSS Пузыри (залипательный фон) */
.bubbles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.bubble {
  position: absolute;
  bottom: -100px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  opacity: 0.5;
  animation: rise 10s infinite ease-in;
}

.bubble:nth-child(1) { left: 10%; width: 80px; height: 80px; animation-duration: 8s; }
.bubble:nth-child(2) { left: 20%; width: 20px; height: 20px; animation-duration: 12s; animation-delay: 1s; }
.bubble:nth-child(3) { left: 35%; width: 50px; height: 50px; animation-duration: 9s; animation-delay: 2s; }
.bubble:nth-child(4) { left: 50%; width: 80px; height: 80px; animation-duration: 11s; animation-delay: 0s; }
.bubble:nth-child(5) { left: 65%; width: 30px; height: 30px; animation-duration: 7s; animation-delay: 4s; }
.bubble:nth-child(6) { left: 80%; width: 45px; height: 45px; animation-duration: 10s; animation-delay: 1s; }
.bubble:nth-child(7) { left: 70%; width: 90px; height: 90px; animation-duration: 13s; animation-delay: 3s; }
.bubble:nth-child(8) { left: 15%; width: 25px; height: 25px; animation-duration: 8s; animation-delay: 5s; }
.bubble:nth-child(9) { left: 90%; width: 15px; height: 15px; animation-duration: 6s; }
.bubble:nth-child(10) { left: 45%; width: 35px; height: 35px; animation-duration: 12s; animation-delay: 2s; }

@keyframes rise {
  0% { transform: translateY(0); opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { transform: translateY(-100vh); opacity: 0; }
}

.status-msg {
  text-align: center;
  color: #fff;
  background: rgba(0,0,0,0.4);
  padding: 10px;
  border-radius: 10px;
  margin-top: 20px;
}
</style>