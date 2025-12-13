import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Configure PDF.js worker using Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * Supported file types for text extraction
 */
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { extension: 'pdf', name: 'PDF' },
  'text/plain': { extension: 'txt', name: 'Texte' },
  'text/markdown': { extension: 'md', name: 'Markdown' },
  'text/x-markdown': { extension: 'md', name: 'Markdown' },
  'application/json': { extension: 'json', name: 'JSON' },
  'text/javascript': { extension: 'js', name: 'JavaScript' },
  'text/typescript': { extension: 'ts', name: 'TypeScript' },
  'text/html': { extension: 'html', name: 'HTML' },
  'text/css': { extension: 'css', name: 'CSS' },
  'text/csv': { extension: 'csv', name: 'CSV' },
  'application/xml': { extension: 'xml', name: 'XML' },
  'text/xml': { extension: 'xml', name: 'XML' },
}

// File extensions that should be treated as text
const TEXT_EXTENSIONS = [
  'txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx',
  'html', 'htm', 'css', 'scss', 'less', 'csv', 'xml', 'yaml',
  'yml', 'toml', 'ini', 'conf', 'config', 'env', 'sh', 'bash',
  'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
  'go', 'rs', 'swift', 'kt', 'scala', 'sql', 'graphql', 'vue',
  'svelte', 'astro'
]

/**
 * Check if a file is supported for text extraction
 */
export function isFileSupported(file) {
  // Check MIME type
  if (SUPPORTED_FILE_TYPES[file.type]) {
    return true
  }

  // Check extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return true
  if (TEXT_EXTENSIONS.includes(extension)) return true

  return false
}

/**
 * Get file type info
 */
export function getFileTypeInfo(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'pdf' || file.type === 'application/pdf') {
    return { type: 'pdf', name: 'PDF' }
  }

  if (SUPPORTED_FILE_TYPES[file.type]) {
    return { type: 'text', name: SUPPORTED_FILE_TYPES[file.type].name }
  }

  if (TEXT_EXTENSIONS.includes(extension)) {
    return { type: 'text', name: extension.toUpperCase() }
  }

  return { type: 'unknown', name: 'Inconnu' }
}

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => item.str)
      .join(' ')

    fullText += pageText + '\n\n'
  }

  return fullText.trim()
}

/**
 * Extract text from a text-based file
 */
async function extractTextFromTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsText(file)
  })
}

/**
 * Extract text from any supported file
 * @param {File} file - The file to extract text from
 * @returns {Promise<{content: string, name: string, type: string}>}
 */
export async function extractTextFromFile(file) {
  if (!isFileSupported(file)) {
    throw new Error(`Type de fichier non supporté: ${file.type || file.name}`)
  }

  const fileInfo = getFileTypeInfo(file)
  let content = ''

  if (fileInfo.type === 'pdf') {
    content = await extractTextFromPDF(file)
  } else {
    content = await extractTextFromTextFile(file)
  }

  return {
    content,
    name: file.name,
    type: fileInfo.name,
    size: file.size,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Get accept string for file input
 */
export function getAcceptedFileTypes() {
  const mimeTypes = Object.keys(SUPPORTED_FILE_TYPES)
  const extensions = TEXT_EXTENSIONS.map(ext => `.${ext}`)
  return [...mimeTypes, '.pdf', ...extensions].join(',')
}
