import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MessageSquare, Zap } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { StreamingMessageOptimized } from './StreamingMessageOptimized'
import { ChatInput } from './ChatInput'
import useStore from '../../store/useStore'
import { streamingManager, useStreamingState } from '../../store/streamingManager'

export function ChatWindow() {
  const containerRef = useRef(null)
  const lastScrollTimeRef = useRef(0)
  const isStreamingRef = useRef(false)

  // Get non-streaming state (doesn't change during streaming)
  const conversations = useStore((state) => state.conversations)
  const activeConversationId = useStore((state) => state.activeConversationId)
  const apiKey = useStore((state) => state.apiKey)
  const selectedModel = useStore((state) => state.selectedModel)

  // Get streaming state from the manager (minimal React state)
  const isStreaming = useStore((state) => state.isStreaming)
  const isWebSearching = useStore((state) => state.isWebSearching)

  // Get refs from streaming manager for direct DOM updates (NO RE-RENDERS)
  const { contentRef, reasoningRef, imagesRef, citationsRef } = streamingManager.getRefs()

  // Keep ref in sync with isStreaming for use in callbacks
  isStreamingRef.current = isStreaming

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

  // Check if we're streaming (content is managed via refs, not React state)
  const hasStreamingContent = isStreaming

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: displayMessages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 150, // Estimated message height
    overscan: 3, // Render 3 extra items above/below viewport
  })

  // Scroll to bottom - stable callback that uses ref for streaming check
  const scrollToBottom = useCallback(() => {
    const now = Date.now()
    // Throttle scroll updates to max once per 150ms during streaming
    if (now - lastScrollTimeRef.current < 150 && isStreamingRef.current) {
      return
    }
    lastScrollTimeRef.current = now

    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, []) // No dependencies - uses refs

  // Scroll on new messages
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50)
    return () => clearTimeout(timer)
  }, [displayMessages.length, scrollToBottom])

  // Scroll during streaming - only when content changes significantly
  useEffect(() => {
    if (hasStreamingContent) {
      const rafId = requestAnimationFrame(scrollToBottom)
      return () => cancelAnimationFrame(rafId)
    }
  }, [hasStreamingContent, scrollToBottom])

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

            {/* Streaming message - uses refs for direct DOM updates, NO React re-renders */}
            {hasStreamingContent && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualizer.getTotalSize()}px)`,
                  zIndex: 10,
                  background: 'var(--color-bg-primary)',
                }}
              >
                <StreamingMessageOptimized
                  contentRef={contentRef}
                  reasoningRef={reasoningRef}
                  imagesRef={imagesRef}
                  citationsRef={citationsRef}
                  isStreaming={isStreaming}
                />
              </div>
            )}

            {/* Loading indicator removed - StreamingMessageOptimized handles display */}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput disabled={!apiKey || !selectedModel} />
    </div>
  )
}
