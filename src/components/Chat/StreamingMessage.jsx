import { useState, useRef, useEffect, useMemo, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Sparkles, Brain, ChevronDown, ChevronRight, Link2, ExternalLink } from 'lucide-react'

// Simplified markdown components for streaming (no copy buttons, simpler structure)
const streamingMarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    const codeString = String(children).replace(/\n$/, '')

    if (!inline && match) {
      return (
        <div
          className="my-4 rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-4 py-2"
            style={{
              background: 'var(--color-bg-elevated)',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            <span
              className="text-xs font-mono font-medium uppercase tracking-wide"
              style={{ color: 'var(--color-accent)' }}
            >
              {match[1]}
            </span>
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '0.875rem',
              lineHeight: '1.7',
              padding: '1rem',
              background: '#1a1a1f',
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      )
    }

    if (!inline) {
      return (
        <pre
          className="my-4 p-4 rounded-xl overflow-x-auto font-mono text-sm"
          style={{
            background: '#1a1a1f',
            border: '1px solid var(--color-border)'
          }}
        >
          <code style={{ color: 'var(--color-text-primary)' }}>
            {codeString}
          </code>
        </pre>
      )
    }

    return (
      <code
        className="px-1.5 py-0.5 rounded-md text-[0.9em] font-mono"
        style={{
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-accent)'
        }}
        {...props}
      >
        {children}
      </code>
    )
  },
  p: ({ children }) => (
    <p className="mb-4 last:mb-0 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </p>
  ),
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
  li: ({ children }) => (
    <li className="leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </li>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium"
      style={{ color: 'var(--color-accent)', borderBottom: '1px solid var(--color-accent-soft)' }}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="pl-4 pr-4 py-3 my-4 rounded-r-xl italic"
      style={{
        borderLeft: '3px solid var(--color-accent)',
        background: 'var(--color-accent-soft)',
        color: 'var(--color-text-secondary)'
      }}
    >
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h1 className="text-2xl font-display mt-8 mb-4" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-display mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-5 mb-2" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </h3>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
    </em>
  ),
  hr: () => (
    <hr className="my-6" style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
  ),
  // Simplified table rendering for streaming
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
      <table className="min-w-full">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ background: 'var(--color-bg-elevated)' }}>{children}</thead>,
  tbody: ({ children }) => <tbody style={{ background: 'var(--color-bg-tertiary)' }}>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </td>
  ),
}

// Custom hook for throttling content updates
function useThrottledValue(value, delay = 150) {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastUpdateRef = useRef(Date.now())
  const timeoutRef = useRef(null)

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateRef.current

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (timeSinceLastUpdate >= delay) {
      // Enough time has passed, update immediately
      setThrottledValue(value)
      lastUpdateRef.current = now
    } else {
      // Schedule an update for later
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value)
        lastUpdateRef.current = Date.now()
      }, delay - timeSinceLastUpdate)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  // Always update on unmount to capture final state
  useEffect(() => {
    return () => {
      setThrottledValue(value)
    }
  }, [])

  return throttledValue
}

export const StreamingMessage = memo(function StreamingMessage({ content, reasoning, images, citations }) {
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const hasReasoning = reasoning && reasoning.length > 0
  const hasCitations = citations && citations.length > 0

  // Throttle markdown rendering to every 200ms for smooth updates without glitching
  // Increased from 150ms to reduce CPU usage during fast streaming
  const throttledContent = useThrottledValue(content, 200)

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
              <span
                className="ml-2 inline-flex items-center gap-1 text-xs font-normal"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                en cours...
              </span>
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
                    Raisonnement (en cours...)
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
                    }}
                  >
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap font-mono"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {reasoning}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message content - throttled markdown rendering for smooth updates */}
            <div className="prose-custom">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={streamingMarkdownComponents}
              >
                {throttledContent || ''}
              </ReactMarkdown>
            </div>

            {/* Citations/Sources during streaming */}
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
