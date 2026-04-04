export const useIconCache = () => {
  const getIconUrl = (remoteUrl: string | null | undefined) => {
    if (!remoteUrl) return ''
    
    // If it's already a local path or data URL, return as is
    if (remoteUrl.startsWith('/') || remoteUrl.startsWith('data:')) {
      return remoteUrl
    }
    
    // Wrap the remote URL with our Go Backend Asset Service
    return `/api/asset/icon?url=${encodeURIComponent(remoteUrl)}`
  }

  return {
    getIconUrl
  }
}
