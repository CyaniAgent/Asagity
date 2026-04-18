import { useNotificationStore } from '~/stores/notifications'
import { useSoundManager } from '~/stores/soundManager'

export const useAppToast = () => {
  const toast = useToast()
  const notificationStore = useNotificationStore()
  const soundManager = useSoundManager()

  const add = (options: any) => {
    // Default persistence to true unless explicitly disabled
    const persist = options.persist !== false

    // Call the original toast addition
    toast.add(options)

    // Push to notification store if persistent
    if (persist) {
      notificationStore.addNotification({
        type: 'system',
        content: `${options.title}${options.description ? ': ' + options.description : ''}`
      })
    }

    // Play notification sound based on toast color
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

  // Map other methods if necessary
  return {
    add,
    remove: toast.remove,
    clear: toast.clear
  }
}
