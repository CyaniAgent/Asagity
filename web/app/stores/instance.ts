import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInstanceStore = defineStore('instance', () => {
  const name = ref('Asagity Example')
  const description = ref('A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.')

  function setName(newName: string) {
    name.value = newName
  }

  function setDescription(newDescription: string) {
    description.value = newDescription
  }

  return {
    name,
    description,
    setName,
    setDescription
  }
})
