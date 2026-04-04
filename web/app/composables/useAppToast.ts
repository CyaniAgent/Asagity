import { useNotificationStore } from '~/stores/notifications'

export const useAppToast = () => {
  const toast = useToast()
  const notificationStore = useNotificationStore()

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

    // Play the notification sound if not silent
    if (process.client && !options.silent) {
      const audio = new Audio('/sounds/YunaAyase/ca.wav')
      audio.play().catch(e => {
        // Handle browser autoplay restriction gracefully
        console.warn('Audio playback prevented by browser:', e)
      })
    }
  }

  // Map other methods if necessary
  return {
    add,
    remove: toast.remove,
    clear: toast.clear
  }
}
