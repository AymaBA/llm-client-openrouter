import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MessageSquare, Zap } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { StreamingMessage } from './StreamingMessage'
import { ChatInput } from './ChatInput'
import useStore from '../../store/useStore'

export function ChatWindow() {
  const containerRef = useRef(null)

  // Get state from store
  const conversations = useStore((state) => state.conversations)
  const activeConversationId = useStore((state) => state.activeConversationId)
  const isStreaming = useStore((state) => state.isStreaming)
  const streamingContent = useStore((state) => state.streamingContent)
  const streamingReasoning = useStore((state) => state.streamingReasoning)
  const streamingImages = useStore((state) => state.streamingImages)
  const apiKey = useStore((state) => state.apiKey)
  const selectedModel = useStore((state) => state.selectedModel)

  // Get the active conversation
  const conversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  )

  // Memoize display messages with fallback IDs for old messages
  // Don't include streaming message here - it's rendered separately for performance
  const displayMessages = useMemo(() => {
    if (!conversation) return []
    return (conversation.messages || []).map((msg, index) => ({
      ...msg,
      // Ensure every message has an ID (for old messages without IDs)
      id: msg.id || `msg-${index}-${msg.role}`,
    }))
  }, [conversation])

  // Check if we have streaming content to show
  const hasStreamingContent = isStreaming && (streamingContent || streamingReasoning)

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: displayMessages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 150, // Estimated message height
    overscan: 3, // Render 3 extra items above/below viewport
  })

  // Scroll to bottom when new messages arrive or during streaming
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    // Small delay to allow virtual list to update
    const timer = setTimeout(scrollToBottom, 50)
    return () => clearTimeout(timer)
  }, [displayMessages.length, hasStreamingContent, scrollToBottom])

  if (!conversation) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, var(--color-accent-soft) 0%, transparent 70%)',
            opacity: 0.6
          }}
        />

        <div className="text-center max-w-lg relative z-10 animate-fade-in">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 mx-auto animate-float"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
              boxShadow: 'var(--shadow-glow-lg)'
            }}
          >
            <Zap size={48} className="text-black" fill="currentColor" />
          </div>
          <h2
            className="text-4xl font-display mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Bienvenue
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Sélectionne un modèle et crée une nouvelle conversation pour commencer à discuter avec l'IA.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-4"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="font-semibold truncate text-lg"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {conversation.title}
          </h2>
          <p
            className="text-sm mt-0.5 font-mono"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {conversation.model}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
      >
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center animate-fade-in">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'var(--color-bg-elevated)' }}
              >
                <MessageSquare size={28} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p
                className="text-lg"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Commence la conversation en envoyant un message
              </p>
            </div>
          </div>
        ) : (
          <div
            className="py-4"
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const msg = displayMessages[virtualRow.index]
              return (
                <div
                  key={msg.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ChatMessage message={msg} />
                </div>
              )
            })}

            {/* Streaming message - rendered separately for performance */}
            {hasStreamingContent && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualizer.getTotalSize()}px)`,
                }}
              >
                <StreamingMessage
                  content={streamingContent}
                  reasoning={streamingReasoning}
                  images={streamingImages}
                />
              </div>
            )}

            {/* Loading indicator - only show when nothing is being streamed yet */}
            {isStreaming && !streamingContent && !streamingReasoning && (
              <div
                className="py-6"
                style={{
                  background: 'var(--color-assistant-soft)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualizer.getTotalSize()}px)`,
                }}
              >
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                  <div className="flex gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-assistant) 0%, #10b981 100%)',
                        boxShadow: '0 0 20px rgba(52, 211, 153, 0.3)'
                      }}
                    >
                      <div className="flex gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-typing"
                          style={{ background: 'white', animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-typing"
                          style={{ background: 'white', animationDelay: '200ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-typing"
                          style={{ background: 'white', animationDelay: '400ms' }}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: 'var(--color-assistant)' }}
                      >
                        Assistant
                      </p>
                      <p style={{ color: 'var(--color-text-muted)' }}>
                        Réflexion en cours...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput disabled={!apiKey || !selectedModel} />
    </div>
  )
}
