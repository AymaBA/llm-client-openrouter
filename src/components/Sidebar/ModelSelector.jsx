import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Loader2, Cpu } from 'lucide-react'

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  loading,
  disabled,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const filteredModels = models.filter((model) => {
    const name = model.name || model.id
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const selectedModelData = models.find((m) => m.id === selectedModel)
  const displayName = selectedModelData?.name || selectedModel || 'Sélectionner un modèle'

  const formatPrice = (price) => {
    if (!price) return ''
    const priceNum = parseFloat(price)
    if (priceNum === 0) return 'Gratuit'
    return `$${(priceNum * 1000000).toFixed(2)}/M`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                   transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
          boxShadow: isOpen ? '0 0 0 3px var(--color-accent-soft)' : 'none'
        }}
      >
        <Cpu size={16} style={{ color: 'var(--color-text-muted)' }} />
        <span
          className="flex-1 truncate text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              <span style={{ color: 'var(--color-text-muted)' }}>Chargement...</span>
            </span>
          ) : (
            displayName
          )}
        </span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--color-text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl z-20 max-h-80 flex flex-col
                     overflow-hidden animate-fade-in-scale"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Search */}
          <div className="p-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          {/* Models list */}
          <div className="overflow-y-auto flex-1 py-1">
            {filteredModels.length === 0 ? (
              <p
                className="p-4 text-sm text-center"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Aucun modèle trouvé
              </p>
            ) : (
              filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className="w-full px-3 py-2.5 text-left transition-all duration-150"
                  style={{
                    background: model.id === selectedModel ? 'var(--color-accent-soft)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (model.id !== selectedModel) {
                      e.currentTarget.style.background = 'var(--color-bg-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = model.id === selectedModel
                      ? 'var(--color-accent-soft)'
                      : 'transparent'
                  }}
                >
                  <div
                    className="text-sm font-medium truncate"
                    style={{
                      color: model.id === selectedModel
                        ? 'var(--color-accent)'
                        : 'var(--color-text-primary)'
                    }}
                  >
                    {model.name || model.id}
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span className="truncate opacity-70">{model.id}</span>
                    {model.pricing?.prompt && (
                      <span
                        className="flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--color-bg-tertiary)' }}
                      >
                        {formatPrice(model.pricing.prompt)}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
