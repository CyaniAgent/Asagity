import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInstanceStore = defineStore('instance', () => {
  const name = ref('Asagity Example')
  const alias = ref('example.asagity.io')
  const description = ref('A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.')
  const version = ref('Ver 2026.Indevelopment')
  const logoURL = ref('https://avatars.githubusercontent.com/u/739984?v=4') // Default placeholder or null

  function setName(newName: string) {
    name.value = newName
  }

  function setAlias(newAlias: string) {
    alias.value = newAlias
  }

  function setDescription(newDescription: string) {
    description.value = newDescription
  }

  function setVersion(newVersion: string) {
    version.value = newVersion
  }

  function setLogoURL(newLogo: string) {
    logoURL.value = newLogo
  }

  return {
    name,
    alias,
    description,
    version,
    logoURL,
    setName,
    setAlias,
    setDescription,
    setVersion,
    setLogoURL
  }
})
