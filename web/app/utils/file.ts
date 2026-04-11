type ByteUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB'

const UNIT_FACTORS: Record<ByteUnit, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4
}

const UNITS: ByteUnit[] = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatBytes(value: number, inputUnit: ByteUnit = 'MB'): string {
  if (value === 0) return '0 B'

  const bytes = value * UNIT_FACTORS[inputUnit]

  let i = Math.floor(Math.log(bytes) / Math.log(1024))
  i = Math.max(0, Math.min(i, UNITS.length - 1))

  const unit = UNITS[i] || 'B'
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${unit}`
}

export function parseFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ext
}

export function getFileIcon(mimeType: string, filename: string): string {
  if (mimeType.startsWith('image/')) return 'i-material-symbols-image'
  if (mimeType.startsWith('video/')) return 'i-material-symbols-videocam'
  if (mimeType.startsWith('audio/')) return 'i-material-symbols-music-note'
  if (mimeType.startsWith('text/')) return 'i-material-symbols-description'
  if (mimeType.includes('pdf')) return 'i-material-symbols-picture-as-pdf'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'i-material-symbols-folder-zip'

  const ext = parseFileExtension(filename)
  const iconMap: Record<string, string> = {
    md: 'i-material-symbols-data-object',
    json: 'i-material-symbols-data-object',
    ts: 'i-material-symbols-code',
    js: 'i-material-symbols-code',
    vue: 'i-material-symbols-code',
    py: 'i-material-symbols-code',
    png: 'i-material-symbols-image',
    jpg: 'i-material-symbols-image',
    jpeg: 'i-material-symbols-image',
    gif: 'i-material-symbols-image',
    webp: 'i-material-symbols-image',
    mp3: 'i-material-symbols-music-note',
    wav: 'i-material-symbols-music-note',
    flac: 'i-material-symbols-music-note'
  }

  return iconMap[ext] || 'i-material-symbols-draft-rounded'
}

export function formatFileSize(bytes: number): string {
  return formatBytes(bytes, 'B')
}

export function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) return filename

  const ext = parseFileExtension(filename)
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'))

  const availableLength = maxLength - ext.length - 4
  if (availableLength <= 0) return filename.slice(0, maxLength - 3) + '...'

  return `${nameWithoutExt.slice(0, availableLength)}...${ext}`
}
