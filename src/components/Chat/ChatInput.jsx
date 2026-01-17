import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, Globe, ImagePlus, X } from 'lucide-react'
import useStore from '../../store/useStore'
import {
  modelSupportsImageInput,
  processImageFile,
  getImageFromClipboard,
  IMAGE_CONSTANTS
} from '../../utils/imageUtils'

export function ChatInput({ disabled }) {
  const [message, setMessage] = useState('')
  const [pendingImages, setPendingImages] = useState([])
  const [imageError, setImageError] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Get state and actions from store
  const isStreaming = useStore((state) => state.isStreaming)
  const sendMessage = useStore((state) => state.sendMessage)
  const stopStreaming = useStore((state) => state.stopStreaming)
  const conversations = useStore((state) => state.conversations)
  const activeConversationId = useStore((state) => state.activeConversationId)
  const toggleWebSearch = useStore((state) => state.toggleWebSearch)
  const models = useStore((state) => state.models)
  const selectedModel = useStore((state) => state.selectedModel)

  // Get active conversation and check model capabilities
  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  const webSearchEnabled = activeConversation?.webSearchEnabled || false
  const modelToCheck = activeConversation?.model || selectedModel
  const currentModel = models.find((m) => m.id === modelToCheck)
  const supportsImageInput = modelSupportsImageInput(currentModel)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [message])

  // Clear image error after a delay
  useEffect(() => {
    if (imageError) {
      const timer = setTimeout(() => setImageError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [imageError])

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Check max images
    const remainingSlots = IMAGE_CONSTANTS.MAX_IMAGES - pendingImages.length
    if (remainingSlots <= 0) {
      setImageError(`Maximum ${IMAGE_CONSTANTS.MAX_IMAGES} images par message`)
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    const newImages = []

    for (const file of filesToProcess) {
      try {
        const processed = await processImageFile(file)
        newImages.push(processed)
      } catch (err) {
        setImageError(err.message)
      }
    }

    if (newImages.length > 0) {
      setPendingImages(prev => [...prev, ...newImages])
    }
  }, [pendingImages.length])

  const handlePaste = useCallback(async (e) => {
    if (!supportsImageInput) return

    const imageFile = getImageFromClipboard(e.clipboardData)
    if (!imageFile) return

    // Prevent default paste if we found an image
    e.preventDefault()

    // Check max images
    if (pendingImages.length >= IMAGE_CONSTANTS.MAX_IMAGES) {
      setImageError(`Maximum ${IMAGE_CONSTANTS.MAX_IMAGES} images par message`)
      return
    }

    try {
      const processed = await processImageFile(imageFile)
      setPendingImages(prev => [...prev, processed])
    } catch (err) {
      setImageError(err.message)
    }
  }, [supportsImageInput, pendingImages.length])

  const removeImage = useCallback((index) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const hasContent = message.trim() || pendingImages.length > 0
    if (hasContent && !disabled && !isStreaming) {
      sendMessage(message.trim(), pendingImages)
      setMessage('')
      setPendingImages([])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const canSend = (message.trim() || pendingImages.length > 0) && !disabled

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Toggle buttons row */}
        {activeConversationId && (
          <div className="flex items-center gap-2 mb-2">
            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={() => toggleWebSearch(activeConversationId)}
              disabled={disabled || isStreaming}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: webSearchEnabled ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
                color: webSearchEnabled ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: `1px solid ${webSearchEnabled ? 'var(--color-border-accent)' : 'var(--color-border)'}`,
              }}
              title={webSearchEnabled ? 'Désactiver la recherche web' : 'Activer la recherche web'}
            >
              <Globe size={14} />
              <span>Recherche web</span>
              {webSearchEnabled && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--color-accent)' }}
                />
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {imageError && (
          <div
            className="mb-2 px-3 py-2 rounded-lg text-xs font-medium animate-fade-in"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {imageError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            className="relative flex flex-col rounded-xl transition-all duration-200"
            style={{
              background: 'var(--color-bg-elevated)',
              boxShadow: '0 0 0 1px var(--color-border), 0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Pending images preview */}
            {pendingImages.length > 0 && (
              <div
                className="flex items-center gap-2 p-3 overflow-x-auto"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                {pendingImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 group animate-scale-in"
                  >
                    <img
                      src={img.url}
                      alt={img.name || `Image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                      style={{
                        border: '1px solid var(--color-border)',
                      }}
                    />
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-all duration-200
                               hover:scale-110 active:scale-95"
                      style={{
                        background: 'var(--color-danger)',
                        color: 'white',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                      }}
                      title="Supprimer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {/* Image count indicator */}
                <div
                  className="flex-shrink-0 text-xs font-medium px-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {pendingImages.length}/{IMAGE_CONSTANTS.MAX_IMAGES}
                </div>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2">
              {/* Image upload button */}
              {supportsImageInput && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={IMAGE_CONSTANTS.SUPPORTED_TYPES.join(',')}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isStreaming || pendingImages.length >= IMAGE_CONSTANTS.MAX_IMAGES}
                    className="flex-shrink-0 p-2 ml-2 mb-2 rounded-lg transition-all duration-200
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:scale-105 active:scale-95 disabled:hover:scale-100"
                    style={{
                      color: 'var(--color-text-muted)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = 'var(--color-bg-hover)'
                        e.currentTarget.style.color = 'var(--color-accent)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--color-text-muted)'
                    }}
                    title="Ajouter une image (ou Ctrl+V)"
                  >
                    <ImagePlus size={18} />
                  </button>
                </>
              )}

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={supportsImageInput ? "Écris ton message ou colle une image..." : "Écris ton message..."}
                disabled={disabled}
                rows={1}
                className="flex-1 resize-none px-4 py-3 bg-transparent rounded-xl
                         outline-none focus:outline-none focus:ring-0 border-none
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-sm leading-relaxed max-h-[160px]"
                style={{
                  color: 'var(--color-text-primary)',
                  caretColor: 'var(--color-accent)',
                  paddingLeft: supportsImageInput ? '0' : '1rem',
                }}
              />

              {/* Send button */}
              <div className="flex-shrink-0 p-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'var(--color-danger)',
                      color: 'white'
                    }}
                    title="Arrêter"
                  >
                    <Square size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="p-2 rounded-lg transition-all duration-200
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:scale-105 active:scale-95 disabled:hover:scale-100"
                    style={{
                      background: canSend
                        ? 'var(--color-accent)'
                        : 'var(--color-bg-hover)',
                      color: canSend ? '#000' : 'var(--color-text-muted)'
                    }}
                    title="Envoyer"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
