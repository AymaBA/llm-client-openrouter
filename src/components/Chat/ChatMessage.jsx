import { useState, memo, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Sparkles, Copy, Check, Brain, ChevronDown, ChevronRight, Image as ImageIcon, Download, X, ZoomIn } from 'lucide-react'

export const ChatMessage = memo(function ChatMessage({ message }) {
  const [copiedCode, setCopiedCode] = useState(null)
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const isUser = message.role === 'user'
  const hasReasoning = message.reasoning && message.reasoning.length > 0
  const hasImages = message.images && message.images.length > 0

  const downloadImage = useCallback((url, index) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const copyToClipboard = useCallback(async (code, index) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }, [])

  // Memoize markdown components to prevent recreation on every render
  const markdownComponents = useMemo(() => ({
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeString = String(children).replace(/\n$/, '')
                    const codeIndex = node?.position?.start?.line || Math.random()

                    if (!inline && match) {
                      return (
                        <div
                          className="relative group my-4 rounded-xl overflow-hidden"
                          style={{ border: '1px solid var(--color-border)' }}
                        >
                          {/* Code header */}
                          <div
                            className="flex items-center justify-between px-4 py-2"
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
                            <button
                              onClick={() => copyToClipboard(codeString, codeIndex)}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-all duration-200"
                              style={{
                                color: 'var(--color-text-muted)',
                                background: 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--color-bg-hover)'
                                e.currentTarget.style.color = 'var(--color-text-primary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'var(--color-text-muted)'
                              }}
                              title="Copier le code"
                            >
                              {copiedCode === codeIndex ? (
                                <>
                                  <Check size={14} style={{ color: 'var(--color-assistant)' }} />
                                  <span>Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Copier</span>
                                </>
                              )}
                            </button>
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
                        <div
                          className="relative group my-4 rounded-xl overflow-hidden"
                          style={{ border: '1px solid var(--color-border)' }}
                        >
                          <div
                            className="flex items-center justify-between px-4 py-2"
                            style={{
                              background: 'var(--color-bg-elevated)',
                              borderBottom: '1px solid var(--color-border)'
                            }}
                          >
                            <span
                              className="text-xs font-mono"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              Code
                            </span>
                            <button
                              onClick={() => copyToClipboard(codeString, codeIndex)}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-all duration-200"
                              style={{
                                color: 'var(--color-text-muted)',
                                background: 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--color-bg-hover)'
                                e.currentTarget.style.color = 'var(--color-text-primary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'var(--color-text-muted)'
                              }}
                            >
                              {copiedCode === codeIndex ? (
                                <>
                                  <Check size={14} style={{ color: 'var(--color-assistant)' }} />
                                  <span>Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Copier</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre
                            className="p-4 overflow-x-auto font-mono text-sm"
                            style={{ background: '#1a1a1f' }}
                          >
                            <code style={{ color: 'var(--color-text-primary)' }}>
                              {codeString}
                            </code>
                          </pre>
                        </div>
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
                  p({ children }) {
                    return (
                      <p
                        className="mb-4 last:mb-0 leading-relaxed"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {children}
                      </p>
                    )
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
                  },
                  li({ children }) {
                    return (
                      <li
                        className="leading-relaxed"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {children}
                      </li>
                    )
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium transition-colors duration-200"
                        style={{
                          color: 'var(--color-accent)',
                          borderBottom: '1px solid var(--color-accent-soft)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-accent)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-accent-soft)'
                        }}
                      >
                        {children}
                      </a>
                    )
                  },
                  blockquote({ children }) {
                    return (
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
                    )
                  },
                  h1({ children }) {
                    return (
                      <h1
                        className="text-2xl font-display mt-8 mb-4"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {children}
                      </h1>
                    )
                  },
                  h2({ children }) {
                    return (
                      <h2
                        className="text-xl font-display mt-6 mb-3"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {children}
                      </h2>
                    )
                  },
                  h3({ children }) {
                    return (
                      <h3
                        className="text-lg font-semibold mt-5 mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {children}
                      </h3>
                    )
                  },
                  strong({ children }) {
                    return (
                      <strong
                        className="font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {children}
                      </strong>
                    )
                  },
                  em({ children }) {
                    return (
                      <em
                        className="italic"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {children}
                      </em>
                    )
                  },
                  hr() {
                    return (
                      <hr
                        className="my-6"
                        style={{ border: 'none', borderTop: '1px solid var(--color-border)' }}
                      />
                    )
                  },
                  table({ children }) {
                    return (
                      <div
                        className="overflow-x-auto my-6 rounded-xl"
                        style={{ border: '1px solid var(--color-border)' }}
                      >
                        <table className="min-w-full">
                          {children}
                        </table>
                      </div>
                    )
                  },
                  thead({ children }) {
                    return (
                      <thead style={{ background: 'var(--color-bg-elevated)' }}>
                        {children}
                      </thead>
                    )
                  },
                  tbody({ children }) {
                    return (
                      <tbody style={{ background: 'var(--color-bg-tertiary)' }}>
                        {children}
                      </tbody>
                    )
                  },
                  tr({ children }) {
                    return (
                      <tr
                        className="transition-colors duration-150"
                        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-bg-hover)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {children}
                      </tr>
                    )
                  },
    th({ children }) {
      return (
        <th
          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
          style={{
            color: 'var(--color-text-secondary)',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          {children}
        </th>
      )
    },
    td({ children }) {
      return (
        <td
          className="px-4 py-3 text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {children}
        </td>
      )
    },
  }), [copiedCode, copyToClipboard])

  return (
    <div
      className="py-6 animate-fade-in"
      style={{
        background: isUser ? 'transparent' : 'var(--color-bg-secondary)'
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isUser
                ? 'linear-gradient(135deg, var(--color-user) 0%, #3b82f6 100%)'
                : 'linear-gradient(135deg, var(--color-assistant) 0%, #10b981 100%)',
              boxShadow: isUser
                ? '0 0 20px rgba(96, 165, 250, 0.3)'
                : '0 0 20px rgba(52, 211, 153, 0.3)'
            }}
          >
            {isUser ? (
              <User size={18} className="text-white" />
            ) : (
              <Sparkles size={18} className="text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            {/* Role label */}
            <p
              className="text-sm font-medium mb-2"
              style={{
                color: isUser ? 'var(--color-user)' : 'var(--color-assistant)'
              }}
            >
              {isUser ? 'Vous' : 'Assistant'}
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
                  onMouseEnter={(e) => {
                    if (!reasoningExpanded) e.currentTarget.style.background = 'var(--color-bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!reasoningExpanded) e.currentTarget.style.background = 'transparent'
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
                    Raisonnement {message.isStreaming && '(en cours...)'}
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
                      {message.reasoning}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message content */}
            <div className="prose-custom">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Generated images */}
            {hasImages && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon size={16} style={{ color: 'var(--color-text-muted)' }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Images générées ({message.images.length})
                  </span>
                </div>
                <div className="grid gap-4" style={{ gridTemplateColumns: message.images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {message.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden cursor-pointer"
                      style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-elevated)',
                      }}
                      onClick={() => setLightboxImage({ url: img.url, index: idx })}
                    >
                      <img
                        src={img.url}
                        alt={`Image générée ${idx + 1}`}
                        className="w-full h-auto"
                        style={{ display: 'block' }}
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setLightboxImage({ url: img.url, index: idx })
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                          style={{
                            background: 'white',
                            color: 'black',
                          }}
                        >
                          <ZoomIn size={16} />
                          <span className="text-sm font-medium">Agrandir</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadImage(img.url, idx)
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                          style={{
                            background: 'var(--color-accent)',
                            color: 'black',
                          }}
                        >
                          <Download size={16} />
                          <span className="text-sm font-medium">Télécharger</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image modal */}
            {lightboxImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
                style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
                onClick={() => setLightboxImage(null)}
              >
                {/* Modal container */}
                <div
                  className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--color-accent-soft)' }}
                      >
                        <ImageIcon size={16} style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Image générée
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadImage(lightboxImage.url, lightboxImage.index)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
                        style={{
                          background: 'var(--color-accent)',
                          color: 'black',
                        }}
                      >
                        <Download size={16} />
                        <span className="text-sm font-medium">Télécharger</span>
                      </button>
                      <button
                        onClick={() => setLightboxImage(null)}
                        className="p-2 rounded-lg transition-colors duration-200"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Modal body - Image */}
                  <div
                    className="flex-1 overflow-auto p-4 flex items-center justify-center"
                    style={{ background: 'var(--color-bg-tertiary)' }}
                  >
                    <img
                      src={lightboxImage.url}
                      alt="Image agrandie"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{ maxHeight: 'calc(90vh - 80px)' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
