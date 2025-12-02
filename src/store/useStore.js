import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { fetchModels, streamChat, generateTitle } from '../services/openrouter'

// Migrate old localStorage data to new Zustand store
const migrateOldData = () => {
  const oldApiKey = localStorage.getItem('openrouter_api_key')
  const oldSelectedModel = localStorage.getItem('selected_model')
  const oldConversations = localStorage.getItem('conversations')
  const oldActiveId = localStorage.getItem('activeConversationId')

  if (oldApiKey || oldConversations) {
    const migrated = {
      state: {
        apiKey: oldApiKey ? JSON.parse(oldApiKey) : '',
        selectedModel: oldSelectedModel ? JSON.parse(oldSelectedModel) : '',
        conversations: oldConversations ? JSON.parse(oldConversations) : [],
        activeConversationId: oldActiveId ? JSON.parse(oldActiveId) : null,
      },
      version: 0,
    }

    // Save to new key
    localStorage.setItem('llm-client-storage', JSON.stringify(migrated))

    // Remove old keys
    localStorage.removeItem('openrouter_api_key')
    localStorage.removeItem('selected_model')
    localStorage.removeItem('conversations')
    localStorage.removeItem('activeConversationId')

    console.log('Migrated old localStorage data to Zustand store')
  }
}

// Run migration on load
migrateOldData()

const useStore = create(
  persist(
    (set, get) => ({
      // ============ SETTINGS ============
      apiKey: '',
      selectedModel: '',
      showApiKeyModal: false,
      showProfileModal: false,

      // User profile for personalization
      userProfile: {
        name: '',
        occupation: '',
        interests: '',
        communicationStyle: 'balanced', // formal, balanced, casual
        language: 'french',
        customInstructions: '',
        accentColor: '#fbbf24', // Default amber
      },

      setApiKey: (apiKey) => set({ apiKey, error: null }),
      setSelectedModel: (selectedModel) => {
        const { activeConversationId, conversations } = get()
        set({ selectedModel })

        // Also update the active conversation's model
        if (activeConversationId) {
          set({
            conversations: conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, model: selectedModel, updatedAt: new Date().toISOString() }
                : c
            ),
          })
        }
      },
      setShowApiKeyModal: (show) => set({ showApiKeyModal: show }),
      setShowProfileModal: (show) => set({ showProfileModal: show }),
      setUserProfile: (profile) => set((state) => ({
        userProfile: { ...state.userProfile, ...profile }
      })),

      // Generate system prompt from user profile
      getSystemPrompt: () => {
        const { userProfile } = get()
        const parts = []

        if (userProfile.name) {
          parts.push(`L'utilisateur s'appelle ${userProfile.name}.`)
        }
        if (userProfile.occupation) {
          parts.push(`Il/Elle travaille comme ${userProfile.occupation}.`)
        }
        if (userProfile.interests) {
          parts.push(`Ses centres d'intérêt incluent : ${userProfile.interests}.`)
        }

        const styleMap = {
          formal: 'Adopte un ton formel et professionnel.',
          balanced: 'Adopte un ton équilibré, ni trop formel ni trop décontracté.',
          casual: 'Adopte un ton décontracté et amical.',
        }
        parts.push(styleMap[userProfile.communicationStyle] || styleMap.balanced)

        const langMap = {
          french: 'Réponds toujours en français.',
          english: 'Always respond in English.',
          auto: "Réponds dans la langue utilisée par l'utilisateur.",
        }
        parts.push(langMap[userProfile.language] || langMap.french)

        if (userProfile.customInstructions) {
          parts.push(`Instructions supplémentaires : ${userProfile.customInstructions}`)
        }

        return parts.length > 1 ? parts.join(' ') : ''
      },

      // ============ CONVERSATIONS ============
      conversations: [],
      activeConversationId: null,

      setActiveConversationId: (id) => {
        const { conversations } = get()
        const conversation = conversations.find((c) => c.id === id)
        set({
          activeConversationId: id,
          // Sync the model selector with the conversation's model
          ...(conversation?.model ? { selectedModel: conversation.model } : {}),
        })
      },

      createConversation: (model) => {
        const newConversation = {
          id: uuidv4(),
          title: 'Nouvelle conversation',
          model,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: newConversation.id,
        }))
        return newConversation.id
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? { ...c, ...updates, updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      deleteConversation: (id) => {
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id)
          return {
            conversations: remaining,
            activeConversationId:
              state.activeConversationId === id
                ? remaining[0]?.id || null
                : state.activeConversationId,
          }
        })
      },

      addMessage: (conversationId, role, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c
            return {
              ...c,
              messages: [...c.messages, { role, content }],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      // ============ MODELS (API) ============
      models: [],
      modelsLoading: false,
      modelsError: null,

      fetchModels: async () => {
        const { apiKey } = get()
        if (!apiKey) {
          set({ models: [], modelsError: null })
          return
        }

        set({ modelsLoading: true, modelsError: null })

        try {
          const data = await fetchModels(apiKey)
          const sortedModels = data.sort((a, b) => {
            const aName = a.name || a.id
            const bName = b.name || b.id
            return aName.localeCompare(bName)
          })
          set({ models: sortedModels, modelsLoading: false })
        } catch (err) {
          set({ models: [], modelsError: err.message, modelsLoading: false, error: err.message })
        }
      },

      // ============ CHAT / STREAMING ============
      isStreaming: false,
      streamingContent: '',
      error: null,
      abortController: null,

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      sendMessage: async (content) => {
        const state = get()
        const { activeConversationId, apiKey, getSystemPrompt } = state
        const activeConversation = state.conversations.find(
          (c) => c.id === activeConversationId
        )

        if (!activeConversationId || !activeConversation?.model) return

        const modelToUse = activeConversation.model
        const isFirstMessage = activeConversation.messages.length === 0

        set({ error: null, streamingContent: '' })

        // Add user message
        get().addMessage(activeConversationId, 'user', content)

        // Build messages array with system prompt
        const systemPrompt = getSystemPrompt()
        const messages = [
          // Add system prompt if profile is configured
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...activeConversation.messages,
          { role: 'user', content },
        ].map((m) => ({ role: m.role, content: m.content }))

        const abortController = new AbortController()
        set({ isStreaming: true, abortController })

        let fullResponse = ''

        try {
          for await (const chunk of streamChat(
            apiKey,
            modelToUse,
            messages,
            abortController.signal
          )) {
            fullResponse += chunk
            set({ streamingContent: fullResponse })
          }

          // Add assistant message
          get().addMessage(activeConversationId, 'assistant', fullResponse)
          set({ streamingContent: '', isStreaming: false, abortController: null })

          // Generate title after first exchange
          if (isFirstMessage) {
            try {
              const title = await generateTitle(apiKey, content, fullResponse)
              get().updateConversation(activeConversationId, { title })
            } catch {
              get().updateConversation(activeConversationId, {
                title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
              })
            }
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            set({ error: err.message })
          }
          set({ streamingContent: '', isStreaming: false, abortController: null })
        }
      },

      stopStreaming: () => {
        const { abortController } = get()
        if (abortController) {
          abortController.abort()
        }
        set({ isStreaming: false, abortController: null })
      },

      // ============ IMPORT / EXPORT ============
      exportConversations: () => {
        const { conversations } = get()
        const data = JSON.stringify(conversations, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `conversations-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      exportConversationAsMarkdown: (id) => {
        const { conversations } = get()
        const conv = conversations.find((c) => c.id === id)
        if (!conv) return

        let md = `# ${conv.title}\n\n`
        md += `**Model:** ${conv.model}\n`
        md += `**Date:** ${new Date(conv.createdAt).toLocaleDateString()}\n\n---\n\n`

        conv.messages.forEach((msg) => {
          const role = msg.role === 'user' ? 'You' : 'Assistant'
          md += `## ${role}\n\n${msg.content}\n\n`
        })

        const blob = new Blob([md], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_')}.md`
        a.click()
        URL.revokeObjectURL(url)
      },

      importConversations: (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const imported = JSON.parse(e.target.result)
              if (!Array.isArray(imported)) {
                throw new Error('Invalid format: expected array')
              }
              set((state) => ({
                conversations: [...imported, ...state.conversations],
              }))
              resolve(imported.length)
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsText(file)
        })
      },
    }),
    {
      name: 'llm-client-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        userProfile: state.userProfile,
      }),
    }
  )
)

export default useStore
