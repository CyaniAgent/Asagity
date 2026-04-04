export const useAppToast = () => {
  const toast = useToast()

  const add = (options: any) => {
    // Call the original toast addition
    toast.add(options)

    // Play the notification sound
    if (process.client) {
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
