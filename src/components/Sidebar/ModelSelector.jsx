import { Loader2, Cpu, ChevronRight, Star } from 'lucide-react'
import useStore from '../../store/useStore'

export function ModelSelector({
  models,
  selectedModel,
  loading,
  disabled,
}) {
  const setShowModelSelector = useStore((state) => state.setShowModelSelector)
  const favoriteModels = useStore((state) => state.favoriteModels)

  const selectedModelData = models.find((m) => m.id === selectedModel)
  const displayName = selectedModelData?.name || selectedModel || 'Sélectionner un modèle'
  const isFavorite = favoriteModels.includes(selectedModel)

  const formatPrice = (price) => {
    if (!price) return ''
    const priceNum = parseFloat(price)
    if (priceNum === 0) return 'Gratuit'
    return `$${(priceNum * 1000000).toFixed(2)}/M`
  }

  return (
    <button
      onClick={() => !disabled && setShowModelSelector(true)}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--color-accent)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-soft)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <Cpu size={16} style={{ color: 'var(--color-text-muted)' }} />
      <div className="flex-1 min-w-0">
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</span>
          </span>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span
                className="truncate text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {displayName}
              </span>
              {isFavorite && (
                <Star size={12} fill="var(--color-accent)" style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              )}
            </div>
            {selectedModelData?.pricing?.prompt && (
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {formatPrice(selectedModelData.pricing.prompt)}
              </span>
            )}
          </>
        )}
      </div>
      <ChevronRight
        size={16}
        className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: 'var(--color-text-muted)' }}
      />
    </button>
  )
}
