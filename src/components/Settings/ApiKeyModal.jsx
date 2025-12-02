import { useState } from 'react'
import { Key, X, Eye, EyeOff, ExternalLink } from 'lucide-react'

export function ApiKeyModal({ isOpen, onClose, onSave, currentKey }) {
  const [apiKey, setApiKey] = useState(currentKey || '')
  const [showKey, setShowKey] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (apiKey.trim()) {
      onSave(apiKey.trim())
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-scale"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Key size={20} className="text-black" />
            </div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Clé API OpenRouter
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200"
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
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5">
          <p
            className="text-sm mb-5 leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Entre ta clé API OpenRouter pour accéder aux modèles. Tu peux en obtenir une sur{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium transition-colors duration-200"
              style={{ color: 'var(--color-accent)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-accent-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-accent)'
              }}
            >
              openrouter.ai/keys
              <ExternalLink size={12} />
            </a>
          </p>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-mono
                       focus:outline-none transition-all duration-200"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-soft)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg
                       transition-all duration-200"
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
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-hover)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!apiKey.trim()}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: apiKey.trim()
                  ? 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)'
                  : 'var(--color-bg-tertiary)',
                color: apiKey.trim() ? '#000' : 'var(--color-text-muted)',
                boxShadow: apiKey.trim() ? 'var(--shadow-glow)' : 'none'
              }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
