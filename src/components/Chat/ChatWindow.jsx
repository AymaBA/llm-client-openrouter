import { useEffect, useRef } from 'react'
import { MessageSquare, Zap } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import useStore from '../../store/useStore'

export function ChatWindow() {
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  // Get state from store
  const conversations = useStore((state) => state.conversations)
  const activeConversationId = useStore((state) => state.activeConversationId)
  const isStreaming = useStore((state) => state.isStreaming)
  const streamingContent = useStore((state) => state.streamingContent)
  const apiKey = useStore((state) => state.apiKey)
  const selectedModel = useStore((state) => state.selectedModel)

  // Get the active conversation
  const conversation = conversations.find((c) => c.id === activeConversationId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages, streamingContent])

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

  const messages = conversation.messages || []
  const displayMessages = [...messages]

  // Add streaming message if currently streaming
  if (isStreaming && streamingContent) {
    displayMessages.push({
      role: 'assistant',
      content: streamingContent,
    })
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
          <div className="py-4">
            {displayMessages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}

            {/* Loading indicator */}
            {isStreaming && !streamingContent && (
              <div
                className="py-6"
                style={{ background: 'var(--color-assistant-soft)' }}
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput disabled={!apiKey || !selectedModel} />
    </div>
  )
}
