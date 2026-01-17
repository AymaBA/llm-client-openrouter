import { useRef, useEffect, useState, memo, useLayoutEffect, useCallback } from 'react'
import { Sparkles, Brain, ChevronDown, ChevronRight, Link2, ExternalLink } from 'lucide-react'

/**
 * Optimized streaming message component that bypasses React re-renders
 * Uses requestAnimationFrame to update DOM directly from refs
 */

// Simple markdown-to-HTML converter for streaming (fast, no heavy deps)
function simpleMarkdownToHtml(text) {
  if (!text) return ''

  let html = text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (```language\ncode```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="streaming-code-block" data-lang="${lang || 'code'}"><code>${code}</code></pre>`
  })

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="streaming-inline-code">$1</code>')

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // Italic (*text* or _text_) - be careful not to match inside words
  html = html.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>')
  html = html.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>')

  // Headers (# ## ###)
  html = html.replace(/^### (.+)$/gm, '<h3 class="streaming-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="streaming-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="streaming-h1">$1</h1>')

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li class="streaming-li">$1</li>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="streaming-li-ordered">$1</li>')

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="streaming-link">$1</a>')

  // Line breaks - double newline = paragraph break
  html = html.replace(/\n\n+/g, '</p><p class="streaming-p">')

  // Single newline = <br> (but not inside code blocks)
  html = html.replace(/\n/g, '<br>')

  // Wrap in paragraph
  return `<p class="streaming-p">${html}</p>`
}

export const StreamingMessageOptimized = memo(function StreamingMessageOptimized({
  contentRef,
  reasoningRef,
  imagesRef,
  citationsRef,
  isStreaming,
}) {
  const contentDomRef = useRef(null)
  const reasoningDomRef = useRef(null)
  const lastContentLengthRef = useRef(0)
  const lastReasoningLengthRef = useRef(0)

  // Auto-expand reasoning when streaming to show thinking in real-time
  const [reasoningExpanded, setReasoningExpanded] = useState(true)
  const [hasReasoning, setHasReasoning] = useState(false)
  const [citations, setCitations] = useState([])

  // Pending reasoning text to apply when DOM is ready
  const pendingReasoningRef = useRef(null)

  // Track if we've detected reasoning to trigger hasReasoning state
  const hasReasoningRef = useRef(false)

  // Callback ref for reasoning DOM - ensures we update content when ref is attached
  const setReasoningDomRef = useCallback((node) => {
    reasoningDomRef.current = node
    if (node) {
      // If we have pending reasoning content, apply it now that DOM is ready
      if (pendingReasoningRef.current) {
        node.textContent = pendingReasoningRef.current
        pendingReasoningRef.current = null
      } else if (isStreaming) {
        // Show placeholder while waiting for content
        node.innerHTML = '<span style="color: var(--color-text-muted); font-style: italic;">Réflexion en cours...</span>'
      }
    }
  }, [isStreaming])

  // Main animation loop - runs continuously while streaming
  useEffect(() => {
    // Reset refs when streaming starts/ends
    lastContentLengthRef.current = 0
    lastReasoningLengthRef.current = 0
    hasReasoningRef.current = false
    pendingReasoningRef.current = null

    if (!isStreaming) {
      // Final update when streaming ends
      if (contentDomRef.current && contentRef.current) {
        contentDomRef.current.innerHTML = simpleMarkdownToHtml(contentRef.current)
      }
      if (reasoningRef.current && reasoningRef.current.length > 0) {
        setHasReasoning(true)
        // Store pending content - will be applied when DOM is ready via callback ref
        pendingReasoningRef.current = reasoningRef.current
        if (reasoningDomRef.current) {
          reasoningDomRef.current.textContent = reasoningRef.current
          pendingReasoningRef.current = null
        }
      }
      if (citationsRef.current && citationsRef.current.length > 0) {
        setCitations([...citationsRef.current])
      }
      return
    }

    let rafId = null
    let isRunning = true

    const updateLoop = () => {
      if (!isRunning) return

      // Check if content has changed (compare lengths for speed)
      const currentContentLength = contentRef.current?.length || 0
      const currentReasoningLength = reasoningRef.current?.length || 0

      // Update reasoning if changed - do this FIRST so the section appears
      if (currentReasoningLength > 0) {
        // Show reasoning section if not already shown
        if (!hasReasoningRef.current) {
          hasReasoningRef.current = true
          setHasReasoning(true)
        }
        // Update reasoning text if changed
        if (currentReasoningLength !== lastReasoningLengthRef.current) {
          lastReasoningLengthRef.current = currentReasoningLength
          // Store as pending - will be applied by callback ref or next check
          pendingReasoningRef.current = reasoningRef.current
          // Also try to apply immediately if DOM is ready
          if (reasoningDomRef.current) {
            reasoningDomRef.current.textContent = reasoningRef.current
            pendingReasoningRef.current = null
          }
        }
      }

      // Update content if changed
      if (currentContentLength !== lastContentLengthRef.current) {
        if (contentDomRef.current) {
          contentDomRef.current.innerHTML = simpleMarkdownToHtml(contentRef.current)
        }
        lastContentLengthRef.current = currentContentLength
      }

      // Check for new citations
      const citationsLength = citationsRef.current?.length || 0
      if (citationsLength !== citations.length) {
        setCitations([...citationsRef.current])
      }

      // Continue the loop
      rafId = requestAnimationFrame(updateLoop)
    }

    // Start the loop immediately
    rafId = requestAnimationFrame(updateLoop)

    // Cleanup
    return () => {
      isRunning = false
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isStreaming]) // Only depend on isStreaming to avoid recreating the loop

  // Update reasoning DOM when expand state changes
  useEffect(() => {
    if (reasoningExpanded && reasoningDomRef.current && reasoningRef.current) {
      reasoningDomRef.current.textContent = reasoningRef.current
    }
  }, [reasoningExpanded])

  const hasCitations = citations.length > 0

  return (
    <div
      className="py-6 animate-fade-in"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--color-assistant) 0%, #10b981 100%)',
              boxShadow: '0 0 20px rgba(52, 211, 153, 0.3)'
            }}
          >
            <Sparkles size={18} className="text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            {/* Role label */}
            <p
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--color-assistant)' }}
            >
              Assistant
              {isStreaming && (
                <span
                  className="ml-2 inline-flex items-center gap-1 text-xs font-normal"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  en cours...
                </span>
              )}
            </p>

            {/* Reasoning section (collapsible) */}
            {hasReasoning && (
              <div
                className="mb-4 rounded-xl overflow-hidden"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => setReasoningExpanded(!reasoningExpanded)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200"
                  style={{
                    background: reasoningExpanded ? 'var(--color-bg-hover)' : 'transparent',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                      boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Brain size={16} className="text-white" />
                  </div>
                  <span
                    className="flex-1 text-left font-medium text-sm"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Raisonnement {isStreaming && '(en cours...)'}
                  </span>
                  {reasoningExpanded ? (
                    <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />
                  ) : (
                    <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </button>

                {reasoningExpanded && (
                  <div
                    className="px-4 pb-4 pt-2 border-t"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-bg-tertiary)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                    {/* Content managed via callback ref - no React children to avoid conflicts */}
                    <div
                      ref={setReasoningDomRef}
                      className="text-sm leading-relaxed whitespace-pre-wrap font-mono"
                      style={{ color: 'var(--color-text-secondary)', minHeight: '1.5em' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Message content - Direct DOM updates via ref */}
            <div
              ref={contentDomRef}
              className="streaming-content prose-custom"
              style={{ color: 'var(--color-text-primary)' }}
            />

            {/* Citations/Sources */}
            {hasCitations && (
              <div
                className="mt-4 pt-4"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Link2 size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Sources ({citations.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {citations.map((cite, idx) => {
                    let hostname = ''
                    try {
                      hostname = new URL(cite.url).hostname.replace('www.', '')
                    } catch {
                      hostname = cite.url
                    }
                    return (
                      <a
                        key={idx}
                        href={cite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 group"
                        style={{
                          background: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                          alt=""
                          className="w-4 h-4 rounded-sm"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                        <span className="truncate max-w-[200px]">
                          {cite.title || hostname}
                        </span>
                        <ExternalLink
                          size={12}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--color-accent)' }}
                        />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
