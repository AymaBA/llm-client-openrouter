import { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Download,
  Upload,
  Key,
  Search,
  Zap,
  ArrowUpRight,
  User,
} from 'lucide-react'
import { ConversationItem } from './ConversationItem'
import { ModelSelector } from './ModelSelector'
import useStore from '../../store/useStore'

export function Sidebar() {
  const [searchTerm, setSearchTerm] = useState('')

  // Get state from store - individual selectors are stable
  const conversations = useStore((state) => state.conversations)
  const activeConversationId = useStore((state) => state.activeConversationId)
  const selectedModel = useStore((state) => state.selectedModel)
  const models = useStore((state) => state.models)
  const modelsLoading = useStore((state) => state.modelsLoading)
  const apiKey = useStore((state) => state.apiKey)
  const userProfile = useStore((state) => state.userProfile)

  // Get actions from store
  const setActiveConversationId = useStore((state) => state.setActiveConversationId)
  const setShowApiKeyModal = useStore((state) => state.setShowApiKeyModal)
  const setShowProfileModal = useStore((state) => state.setShowProfileModal)
  const createConversation = useStore((state) => state.createConversation)
  const deleteConversation = useStore((state) => state.deleteConversation)
  const updateConversation = useStore((state) => state.updateConversation)
  const exportConversations = useStore((state) => state.exportConversations)
  const exportConversationAsMarkdown = useStore((state) => state.exportConversationAsMarkdown)
  const importConversations = useStore((state) => state.importConversations)
  const setError = useStore((state) => state.setError)

  // Memoize filtered conversations
  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [conversations, searchTerm]
  )

  const handleNewConversation = useCallback(() => {
    if (selectedModel) {
      createConversation(selectedModel)
    }
  }, [selectedModel, createConversation])

  const handleImport = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (file) {
        try {
          const count = await importConversations(file)
          alert(`${count} conversation(s) importée(s) avec succès !`)
        } catch (err) {
          setError(`Erreur d'import: ${err.message}`)
        }
      }
    }
    input.click()
  }, [importConversations, setError])

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, var(--color-accent-soft) 0%, transparent 70%)',
          opacity: 0.5
        }}
      />

      {/* Header */}
      <div className="relative p-5 pb-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center glow animate-float"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
              boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)'
            }}
          >
            <Zap size={22} className="text-black" fill="currentColor" />
          </div>
          <div>
            <h1
              className="text-lg font-semibold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              LLM Client
            </h1>
            <p
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              OpenRouter
              <ArrowUpRight size={10} />
            </p>
          </div>
        </div>

        {/* Model Selector */}
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          loading={modelsLoading}
          disabled={!apiKey}
        />

        {/* New conversation button */}
        <button
          onClick={handleNewConversation}
          disabled={!selectedModel}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3
                   rounded-xl font-medium transition-all duration-300
                   disabled:opacity-40 disabled:cursor-not-allowed
                   hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
            color: '#000',
            boxShadow: selectedModel ? 'var(--shadow-md), var(--shadow-glow)' : 'var(--shadow-sm)'
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Nouvelle conversation</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl transition-all duration-200
                     focus:outline-none"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div
              className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--color-bg-elevated)' }}
            >
              <Search size={20} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {conversations.length === 0
                ? 'Aucune conversation'
                : 'Aucun résultat'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={() => setActiveConversationId(conversation.id)}
                onDelete={() => deleteConversation(conversation.id)}
                onRename={(title) => updateConversation(conversation.id, { title })}
                onExport={() => exportConversationAsMarkdown(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div
        className="p-3 mt-auto"
        style={{
          borderTop: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg-tertiary)'
        }}
      >
        <div className="flex gap-2">
          <button
            onClick={exportConversations}
            disabled={conversations.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                     text-sm font-medium transition-all duration-200
                     disabled:opacity-30 disabled:cursor-not-allowed
                     hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
            title="Exporter"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={handleImport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                     text-sm font-medium transition-all duration-200
                     hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
            title="Importer"
          >
            <Upload size={16} />
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl
                     transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: userProfile.name ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
              color: userProfile.name ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              border: `1px solid ${userProfile.name ? 'var(--color-border-accent)' : 'var(--color-border)'}`
            }}
            title="Profil"
          >
            <User size={16} />
          </button>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl
                     transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: apiKey ? 'var(--color-bg-elevated)' : 'var(--color-accent-soft)',
              color: apiKey ? 'var(--color-text-secondary)' : 'var(--color-accent)',
              border: `1px solid ${apiKey ? 'var(--color-border)' : 'var(--color-border-accent)'}`
            }}
            title="Clé API"
          >
            <Key size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
