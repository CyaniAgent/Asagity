import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInstanceStore = defineStore('instance', () => {
  const name = ref('Asagity')
  const alias = ref('asagity.io')
  const description = ref('Asagity - 一个为创作者与梦想家打造的多维社交平台。连接、分享，并构建属于你的世界。')
  const version = ref('Ver 2026.Indevelopment')
  const logoURL = ref('/favicon.ico') // Use local favicon as logo

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
