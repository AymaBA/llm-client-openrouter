import { useState, useMemo, useEffect, useRef } from 'react'
import {
  X,
  Search,
  Star,
  Zap,
  DollarSign,
  MessageSquare,
  Image as ImageIcon,
  Brain,
  Sparkles,
  Check,
  Filter,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import useStore from '../store/useStore'

export function ModelSelectorModal() {
  const showModelSelector = useStore((state) => state.showModelSelector)
  const setShowModelSelector = useStore((state) => state.setShowModelSelector)
  const models = useStore((state) => state.models)
  const selectedModel = useStore((state) => state.selectedModel)
  const setSelectedModel = useStore((state) => state.setSelectedModel)
  const favoriteModels = useStore((state) => state.favoriteModels)
  const toggleFavoriteModel = useStore((state) => state.toggleFavoriteModel)

  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // all, favorites, free, image, reasoning
  const [sortBy, setSortBy] = useState('name') // name, price, context
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (showModelSelector && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [showModelSelector])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowModelSelector(false)
    }
    if (showModelSelector) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [showModelSelector, setShowModelSelector])

  const filteredModels = useMemo(() => {
    let result = models.filter((model) => {
      const name = (model.name || model.id).toLowerCase()
      const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
        model.id.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      switch (activeFilter) {
        case 'favorites':
          return favoriteModels.includes(model.id)
        case 'free':
          return parseFloat(model.pricing?.prompt || 0) === 0
        case 'image':
          return model.architecture?.output_modalities?.includes('image')
        case 'reasoning':
          return model.supported_parameters?.includes('reasoning') ||
            model.id.includes('thinking') ||
            model.id.includes('reasoner')
        default:
          return true
      }
    })

    // Sort
    result.sort((a, b) => {
      // Always put favorites first
      const aFav = favoriteModels.includes(a.id)
      const bFav = favoriteModels.includes(b.id)
      if (aFav && !bFav) return -1
      if (!aFav && bFav) return 1

      switch (sortBy) {
        case 'price':
          return parseFloat(a.pricing?.prompt || 0) - parseFloat(b.pricing?.prompt || 0)
        case 'context':
          return (b.context_length || 0) - (a.context_length || 0)
        default:
          return (a.name || a.id).localeCompare(b.name || b.id)
      }
    })

    return result
  }, [models, searchTerm, activeFilter, sortBy, favoriteModels])

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    const priceNum = parseFloat(price)
    if (priceNum === 0) return 'Gratuit'
    return `$${(priceNum * 1000000).toFixed(2)}`
  }

  const formatContextLength = (length) => {
    if (!length) return 'N/A'
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`
    return length.toString()
  }

  const getProviderColor = (modelId) => {
    const provider = modelId.split('/')[0]
    const colors = {
      'openai': '#10a37f',
      'anthropic': '#d4a27f',
      'google': '#4285f4',
      'meta-llama': '#0668E1',
      'mistralai': '#ff7000',
      'deepseek': '#5b6ee1',
      'cohere': '#39594d',
      'perplexity': '#20808d',
      'x-ai': '#000000',
    }
    return colors[provider] || 'var(--color-accent)'
  }

  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId)
    setShowModelSelector(false)
  }

  if (!showModelSelector) return null

  const filterButtons = [
    { id: 'all', label: 'Tous', icon: Sparkles },
    { id: 'favorites', label: 'Favoris', icon: Star },
    { id: 'free', label: 'Gratuits', icon: DollarSign },
    { id: 'image', label: 'Images', icon: ImageIcon },
    { id: 'reasoning', label: 'Reasoning', icon: Brain },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={() => setShowModelSelector(false)}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-6xl mx-4 my-8 rounded-3xl overflow-hidden animate-fade-in-scale"
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 0 100px rgba(0, 0, 0, 0.5), 0 0 40px var(--color-accent-soft)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5"
          style={{
            background: 'linear-gradient(to bottom, var(--color-bg-primary) 0%, var(--color-bg-primary) 80%, transparent 100%)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-2xl font-display font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Sélectionner un modèle
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {models.length} modèles disponibles • {favoriteModels.length} favoris
              </p>
            </div>
            <button
              onClick={() => setShowModelSelector(false)}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-muted)',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un modèle... (ex: gpt-4, claude, gemini)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-base focus:outline-none transition-all duration-200"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '2px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent)'
                e.target.style.boxShadow = '0 0 0 4px var(--color-accent-soft)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {filterButtons.map((filter) => {
              const Icon = filter.icon
              const isActive = activeFilter === filter.id
              const count = filter.id === 'favorites' ? favoriteModels.length : null
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                    color: isActive ? 'black' : 'var(--color-text-secondary)',
                    border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  }}
                >
                  <Icon size={14} />
                  {filter.label}
                  {count !== null && count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-xs"
                      style={{
                        background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--color-bg-elevated)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}

            <div className="flex-1" />

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Filter size={14} />
                Trier
                <ChevronDown size={14} />
              </button>
              {showFilters && (
                <div
                  className="absolute right-0 top-full mt-2 py-2 rounded-xl min-w-[160px] z-20"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {[
                    { id: 'name', label: 'Nom' },
                    { id: 'price', label: 'Prix' },
                    { id: 'context', label: 'Contexte' },
                  ].map((sort) => (
                    <button
                      key={sort.id}
                      onClick={() => {
                        setSortBy(sort.id)
                        setShowFilters(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm transition-colors duration-150 flex items-center justify-between"
                      style={{
                        color: sortBy === sort.id ? 'var(--color-accent)' : 'var(--color-text-primary)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {sort.label}
                      {sortBy === sort.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Models grid */}
        <div className="px-6 pb-6">
          {filteredModels.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Search size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun modèle trouvé</p>
              <p className="text-sm mt-1">Essayez avec d'autres termes de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model, index) => {
                const isFavorite = favoriteModels.includes(model.id)
                const isSelected = selectedModel === model.id
                const providerColor = getProviderColor(model.id)
                const supportsImage = model.architecture?.output_modalities?.includes('image')
                const supportsReasoning = model.supported_parameters?.includes('reasoning')

                return (
                  <div
                    key={model.id}
                    className="group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-bg-secondary) 100%)'
                        : 'var(--color-bg-secondary)',
                      border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      animationDelay: `${index * 20}ms`,
                    }}
                    onClick={() => handleSelectModel(model.id)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--color-border-hover)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {/* Provider accent line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: providerColor }}
                    />

                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavoriteModel(model.id)
                      }}
                      className="absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 z-10"
                      style={{
                        background: isFavorite ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                        color: isFavorite ? 'black' : 'var(--color-text-muted)',
                      }}
                    >
                      <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    <div className="p-4 pt-5">
                      {/* Model name */}
                      <h3
                        className="font-semibold text-base mb-1 pr-10 line-clamp-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {model.name || model.id}
                      </h3>

                      {/* Model ID */}
                      <p
                        className="text-xs font-mono mb-3 truncate"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {model.id}
                      </p>

                      {/* Capabilities badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {supportsImage && (
                          <span
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#a78bfa',
                            }}
                          >
                            <ImageIcon size={10} />
                            Image
                          </span>
                        )}
                        {supportsReasoning && (
                          <span
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#60a5fa',
                            }}
                          >
                            <Brain size={10} />
                            Reasoning
                          </span>
                        )}
                        {parseFloat(model.pricing?.prompt || 0) === 0 && (
                          <span
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              background: 'rgba(34, 197, 94, 0.2)',
                              color: '#4ade80',
                            }}
                          >
                            <Zap size={10} />
                            Gratuit
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div
                        className="flex items-center gap-4 pt-3"
                        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={12} style={{ color: 'var(--color-text-muted)' }} />
                          <span
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {formatPrice(model.pricing?.prompt)}/M
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare size={12} style={{ color: 'var(--color-text-muted)' }} />
                          <span
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {formatContextLength(model.context_length)} ctx
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div
                        className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: 'var(--color-accent)',
                          color: 'black',
                        }}
                      >
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with selected model info */}
        {selectedModel && (
          <div
            className="sticky bottom-0 px-6 py-4"
            style={{
              background: 'linear-gradient(to top, var(--color-bg-primary) 0%, var(--color-bg-primary) 80%, transparent 100%)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: getProviderColor(selectedModel) }}
                >
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Modèle sélectionné
                  </p>
                  <p
                    className="text-xs font-mono"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {selectedModel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModelSelector(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: 'var(--color-accent)',
                  color: 'black',
                }}
              >
                Confirmer
                <Check size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
