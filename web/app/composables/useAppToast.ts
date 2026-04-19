import { useNotificationStore } from '~/stores/notifications'
import { useSoundManager } from '~/stores/soundManager'

type ToastColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'

interface ToastOptions {
  title?: string
  description?: string
  color?: ToastColor
  icon?: string
  persist?: boolean
  silent?: boolean
}

export const useAppToast = () => {
  const toast = useToast()
  const notificationStore = useNotificationStore()
  const soundManager = useSoundManager()

  const add = (options: ToastOptions) => {
    const persist = options.persist !== false

    toast.add(options)

    if (persist) {
      notificationStore.addNotification({
        type: 'system',
        content: `${options.title}${options.description ? ': ' + options.description : ''}`
      })
    }

    if (import.meta.client && !options.silent) {
      if (options.color === 'error') {
        soundManager.playIfAvailable('sys_error')
      } else if (options.color === 'success' && options.icon === 'i-material-symbols-cloud-done-rounded') {
        soundManager.playIfAvailable('sys_net_restored')
      } else {
        soundManager.playIfAvailable('ca')
      }
    }
  }

  return {
    add,
    remove: toast.remove,
    clear: toast.clear
  }
}
