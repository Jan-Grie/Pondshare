const supportedExtensions = [
  'avi', 'aac', 'cdr', 'ai', '3ds', 'cad', 'dat', 'bmp', 'css', 'fla',
  'dmg', 'eps', 'doc', 'dll', 'html', 'gif', 'flv', 'iso', 'indd', 'mpg',
  'pdf', 'mov', 'ppt', 'midi', 'png', 'php', 'mp3', 'js', 'jpg', 'xml',
  'ps', 'xls', 'tif', 'sql', 'raw', 'psd', 'wmv', 'txt', 'zip'
]

const extensionAliases: Record<string, string> = {
  jpeg: 'jpg',
  tiff: 'tif',
  docx: 'doc',
  pptx: 'ppt',
  xlsx: 'xls',
  mpeg: 'mpg',
  wave: 'wav',
  webp: 'png', // fallback für Bild
  mp4: 'mpg', // fallback für Video
}

export function getFileIconPath(extension: string): string {
  const ext = extension.toLowerCase()
  const normalized = extensionAliases[ext] ?? ext

  if (supportedExtensions.includes(normalized)) {
    return `/icons/${normalized}.svg`
  }

  return '/icons/blank.svg'
}
