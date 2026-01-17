import { AlertTriangle, RefreshCw, Trash2, X } from 'lucide-react'

export function DraftRecoveryModal({ draft, onRecover, onDismiss }) {
  if (!draft) return null

  // Format the timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Truncate content preview
  const truncateContent = (content, maxLength = 200) => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-scale"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
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
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
              }}
            >
              <AlertTriangle size={20} className="text-black" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Message récupéré
              </h2>
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {formatTime(draft.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 rounded-lg transition-all duration-200"
            style={{
              color: 'var(--color-text-muted)',
              background: 'transparent',
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
        <div className="p-5">
          <p
            className="text-sm mb-4 leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Une réponse en cours a été interrompue (crash ou fermeture de
            l'onglet). Voulez-vous récupérer ce contenu ?
          </p>

          {/* Draft preview */}
          <div
            className="p-4 rounded-xl mb-4 max-h-48 overflow-y-auto"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            {draft.userMessage && (
              <div className="mb-3">
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Votre message :
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {truncateContent(draft.userMessage, 100)}
                </p>
              </div>
            )}
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Réponse récupérée ({draft.content?.length || 0} caractères) :
              </p>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {truncateContent(draft.content)}
              </p>
            </div>
            {draft.error && (
              <p
                className="text-xs mt-2"
                style={{ color: 'var(--color-error)' }}
              >
                Erreur : {draft.error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
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
              <Trash2 size={16} />
              Ignorer
            </button>
            <button
              onClick={onRecover}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
                color: '#000',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <RefreshCw size={16} />
              Récupérer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
