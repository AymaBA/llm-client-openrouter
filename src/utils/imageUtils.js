// Image utilities for multimodal input

// Supported image types
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 4 * 1024 * 1024 // 4MB
const MAX_IMAGES = 5

/**
 * Check if a model supports image input
 * @param {Object} model - Model object from OpenRouter API
 * @returns {boolean}
 */
export function modelSupportsImageInput(model) {
  if (!model?.architecture?.input_modalities) return false
  return model.architecture.input_modalities.includes('image')
}

/**
 * Validate an image file
 * @param {File} file - File to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' }
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté. Utilisez: ${SUPPORTED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
    }
  }

  if (file.size > MAX_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `Fichier trop volumineux (${sizeMB}MB). Maximum: 4MB`
    }
  }

  return { valid: true }
}

/**
 * Convert a file to base64 data URL
 * @param {File} file - File to convert
 * @returns {Promise<string>} Data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image if it's too large
 * @param {string} dataUrl - Original data URL
 * @param {number} maxWidth - Maximum width (default 2048)
 * @param {number} quality - JPEG quality 0-1 (default 0.85)
 * @returns {Promise<string>} Compressed data URL
 */
export function compressImage(dataUrl, maxWidth = 2048, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // If image is small enough, return original
      if (img.width <= maxWidth && img.height <= maxWidth) {
        resolve(dataUrl)
        return
      }

      // Calculate new dimensions
      let width = img.width
      let height = img.height
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height)
          height = maxWidth
        }
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG for smaller size
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Erreur de chargement de l\'image'))
    img.src = dataUrl
  })
}

/**
 * Process an image file: validate, convert to base64, and optionally compress
 * @param {File} file - File to process
 * @param {boolean} compress - Whether to compress large images
 * @returns {Promise<{ url: string, name: string } | null>}
 */
export async function processImageFile(file, compress = true) {
  const validation = validateImage(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  let dataUrl = await fileToBase64(file)

  if (compress) {
    dataUrl = await compressImage(dataUrl)
  }

  return {
    url: dataUrl,
    name: file.name
  }
}

/**
 * Get image from clipboard data
 * @param {DataTransfer} clipboardData - Clipboard data from paste event
 * @returns {File | null}
 */
export function getImageFromClipboard(clipboardData) {
  if (!clipboardData?.items) return null

  for (const item of clipboardData.items) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile()
    }
  }

  return null
}

// Export constants for use in components
export const IMAGE_CONSTANTS = {
  SUPPORTED_TYPES,
  MAX_SIZE,
  MAX_IMAGES
}
