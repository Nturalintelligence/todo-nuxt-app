<script setup>
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'

const auth = useAuthStore()

// Это выполнится один раз при загрузке приложения на клиенте
onMounted(() => {
  console.log('App.vue: Приложение смонтировано, запускаем восстановление сессии.')
  auth.initAuth()
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>