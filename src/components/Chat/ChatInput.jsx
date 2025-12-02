import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import useStore from '../../store/useStore'

export function ChatInput({ disabled }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)

  // Get state and actions from store
  const isStreaming = useStore((state) => state.isStreaming)
  const sendMessage = useStore((state) => state.sendMessage)
  const stopStreaming = useStore((state) => state.stopStreaming)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [message])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled && !isStreaming) {
      sendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div
            className="relative flex items-end gap-2 rounded-xl transition-all duration-200"
            style={{
              background: 'var(--color-bg-elevated)',
              boxShadow: '0 0 0 1px var(--color-border), 0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écris ton message..."
              disabled={disabled}
              rows={1}
              className="flex-1 resize-none px-4 py-3 bg-transparent rounded-xl
                       outline-none focus:outline-none focus:ring-0 border-none
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-sm leading-relaxed max-h-[160px]"
              style={{
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-accent)'
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
                  disabled={!message.trim() || disabled}
                  className="p-2 rounded-lg transition-all duration-200
                           disabled:opacity-30 disabled:cursor-not-allowed
                           hover:scale-105 active:scale-95 disabled:hover:scale-100"
                  style={{
                    background: message.trim() && !disabled
                      ? 'var(--color-accent)'
                      : 'var(--color-bg-hover)',
                    color: message.trim() && !disabled ? '#000' : 'var(--color-text-muted)'
                  }}
                  title="Envoyer"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
