import { createRouter, createWebHistory } from 'vue-router'
import FlowEditor from '../views/FlowEditor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/editor'  // 默认重定向到 FlowEditor
    },
    {
      path: '/editor',
      name: 'editor',
      component: FlowEditor
    }
  ]
})

export default router
