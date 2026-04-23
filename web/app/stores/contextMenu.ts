import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ContextMenuItem = {
  label: string
  icon?: string
  action: () => void
  color?: string
  danger?: boolean
  divider?: boolean
}

export type ContextMenuType = 'global' | 'post' | 'user' | 'link_internal' | 'link_external'

export const useContextMenuStore = defineStore('contextMenu', () => {
  const isOpen = ref(false)
  const x = ref(0)
  const y = ref(0)
  const type = ref<ContextMenuType>('global')
  const data = ref<any>(null)
  const menuKey = ref(0)

  function open(event: MouseEvent, menuType: ContextMenuType = 'global', menuData: any = null) {
    event.preventDefault()
    event.stopPropagation()
    
    x.value = event.clientX
    y.value = event.clientY
    type.value = menuType
    data.value = menuData
    menuKey.value++
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return {
    isOpen,
    x,
    y,
    type,
    data,
    menuKey,
    open,
    close
  }
})
