import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { fetchModels, streamChat, generateTitle } from '../services/openrouter'

// Throttled storage to prevent excessive localStorage writes during streaming
const createThrottledStorage = () => {
  let timeout = null
  let pendingValue = null

  return {
    getItem: (name) => {
      const value = localStorage.getItem(name)
      return value ? JSON.parse(value) : null
    },
    setItem: (name, value) => {
      pendingValue = value
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        localStorage.setItem(name, JSON.stringify(pendingValue))
        timeout = null
      }, 1000) // Throttle to max 1 write per second
    },
    removeItem: (name) => {
      if (timeout) clearTimeout(timeout)
      localStorage.removeItem(name)
    },
  }
}

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
        webSearchMaxResults: 5, // Default number of web search results
      },

      // Favorite models
      favoriteModels: [],
      showModelSelector: false,

      // ============ PROJECTS ============
      projects: [],
      showProjectModal: false,
      showProjectSelectorModal: false,
      editingProject: null, // Project being edited, null for new project

      setShowProjectModal: (show) => set({ showProjectModal: show }),
      setShowProjectSelectorModal: (show) => set({ showProjectSelectorModal: show }),
      setEditingProject: (project) => set({ editingProject: project }),

      createProject: (projectData) => {
        const newProject = {
          id: uuidv4(),
          name: projectData.name || 'Nouveau projet',
          description: projectData.description || '',
          systemPrompt: projectData.systemPrompt || '',
          contextFiles: projectData.contextFiles || [],
          icon: projectData.icon || '📁',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          projects: [newProject, ...state.projects],
        }))
        return newProject.id
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          // Remove project reference from conversations
          conversations: state.conversations.map((c) =>
            c.projectId === id ? { ...c, projectId: null } : c
          ),
        }))
      },

      setConversationProject: (conversationId, projectId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, projectId, updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      // ============ WEB SEARCH ============
      toggleWebSearch: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, webSearchEnabled: !c.webSearchEnabled, updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      setWebSearchMaxResults: (count) => {
        set((state) => ({
          userProfile: { ...state.userProfile, webSearchMaxResults: count },
        }))
      },

      setShowModelSelector: (show) => set({ showModelSelector: show }),
      toggleFavoriteModel: (modelId) => set((state) => ({
        favoriteModels: state.favoriteModels.includes(modelId)
          ? state.favoriteModels.filter((id) => id !== modelId)
          : [...state.favoriteModels, modelId]
      })),

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

      // Generate system prompt from user profile and project
      getSystemPrompt: (conversationId) => {
        const { userProfile, projects, conversations } = get()
        const conversation = conversations.find((c) => c.id === conversationId)
        const project = conversation?.projectId
          ? projects.find((p) => p.id === conversation.projectId)
          : null

        const parts = []

        // Part 1: User profile prompt
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

        // Part 2: Project system prompt
        if (project?.systemPrompt) {
          parts.push(`\n\nContexte du projet "${project.name}":\n${project.systemPrompt}`)
        }

        // Part 3: Project context files
        if (project?.contextFiles?.length > 0) {
          parts.push('\n\nFichiers de référence:')
          project.contextFiles.forEach((file) => {
            parts.push(`\n--- ${file.name} ---\n${file.content}`)
          })
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

      createConversation: (model, projectId = null) => {
        const newConversation = {
          id: uuidv4(),
          title: 'Nouvelle conversation',
          model,
          messages: [],
          projectId,
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
              messages: [...c.messages, { id: uuidv4(), role, content }],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      addMessageWithMeta: (conversationId, role, content, meta = {}) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c
            return {
              ...c,
              messages: [...c.messages, { id: uuidv4(), role, content, ...meta }],
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
      streamingReasoning: '',
      streamingImages: [],
      streamingCitations: [],
      isWebSearching: false,
      error: null,
      abortController: null,

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      sendMessage: async (content, images = []) => {
        const state = get()
        const { activeConversationId, apiKey, getSystemPrompt, models, userProfile } = state
        const activeConversation = state.conversations.find(
          (c) => c.id === activeConversationId
        )

        if (!activeConversationId || !activeConversation?.model) return

        const modelToUse = activeConversation.model
        const isFirstMessage = activeConversation.messages.length === 0
        const webSearchEnabled = activeConversation.webSearchEnabled || false
        const webSearchMaxResults = userProfile.webSearchMaxResults || 5

        // Check model capabilities from architecture
        const modelInfo = models.find((m) => m.id === modelToUse)
        const outputModalities = modelInfo?.architecture?.output_modalities || []

        set({
          error: null,
          streamingContent: '',
          streamingReasoning: '',
          streamingImages: [],
          streamingCitations: [],
          isWebSearching: webSearchEnabled,
        })

        // Add user message with images metadata
        const hasImages = images && images.length > 0
        if (hasImages) {
          get().addMessageWithMeta(activeConversationId, 'user', content, { userImages: images })
        } else {
          get().addMessage(activeConversationId, 'user', content)
        }

        // Helper function to format message content for multimodal API
        const formatMessageContent = (msg) => {
          // If message has user images, format as multimodal content array
          if (msg.userImages && msg.userImages.length > 0) {
            const contentArray = []
            // Add text first if present
            if (msg.content) {
              contentArray.push({ type: 'text', text: msg.content })
            }
            // Add images
            for (const img of msg.userImages) {
              contentArray.push({
                type: 'image_url',
                image_url: { url: img.url }
              })
            }
            return contentArray
          }
          // Regular text content
          return msg.content
        }

        // Build messages array with system prompt
        // Skip system prompt for image generation models (it can confuse them)
        const supportsImageOutput = outputModalities.includes('image')
        const systemPrompt = supportsImageOutput ? '' : getSystemPrompt(activeConversationId)

        // Format current message content (with images if provided)
        const currentMessageContent = hasImages
          ? [
              { type: 'text', text: content },
              ...images.map(img => ({ type: 'image_url', image_url: { url: img.url } }))
            ]
          : content

        const messages = [
          // Add system prompt if profile is configured (not for image models)
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          // Previous messages (format with images if they have them)
          ...activeConversation.messages.map((m) => ({
            role: m.role,
            content: formatMessageContent(m)
          })),
          // Current user message
          { role: 'user', content: currentMessageContent },
        ]

        const abortController = new AbortController()
        set({ isStreaming: true, abortController })

        let fullResponse = ''
        let fullReasoning = ''
        let allImages = []
        let allCitations = []

        // Throttle state updates for better performance
        let lastUpdate = 0
        const UPDATE_INTERVAL = 50 // ms between state updates

        try {
          for await (const chunk of streamChat(
            apiKey,
            modelToUse,
            messages,
            abortController.signal,
            { outputModalities, webSearchEnabled, webSearchMaxResults }
          )) {
            if (chunk.content) {
              fullResponse += chunk.content
            }
            if (chunk.reasoning) {
              fullReasoning += chunk.reasoning
            }
            if (chunk.images) {
              // Deduplicate images by URL
              for (const img of chunk.images) {
                if (!allImages.some(existing => existing.url === img.url)) {
                  allImages.push(img)
                }
              }
            }
            if (chunk.citations) {
              // Deduplicate citations by URL
              for (const cite of chunk.citations) {
                if (!allCitations.some(existing => existing.url === cite.url)) {
                  allCitations.push(cite)
                }
              }
              // Once we receive citations, web search is complete
              set({ isWebSearching: false })
            }

            // Throttle state updates to avoid excessive re-renders
            const now = Date.now()
            if (now - lastUpdate >= UPDATE_INTERVAL) {
              set({
                streamingContent: fullResponse,
                streamingReasoning: fullReasoning,
                streamingImages: allImages,
                streamingCitations: allCitations,
              })
              lastUpdate = now
            }
          }

          // Final update to ensure we have all content
          set({
            streamingContent: fullResponse,
            streamingReasoning: fullReasoning,
            streamingImages: allImages,
            streamingCitations: allCitations,
            isWebSearching: false,
          })

          // Add assistant message with reasoning, images, and citations
          get().addMessageWithMeta(activeConversationId, 'assistant', fullResponse, {
            reasoning: fullReasoning || undefined,
            images: allImages.length > 0 ? allImages : undefined,
            citations: allCitations.length > 0 ? allCitations : undefined,
          })
          set({ streamingContent: '', streamingReasoning: '', streamingImages: [], streamingCitations: [], isStreaming: false, isWebSearching: false, abortController: null })

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
          set({ streamingContent: '', streamingReasoning: '', streamingImages: [], streamingCitations: [], isStreaming: false, isWebSearching: false, abortController: null })
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
      storage: createThrottledStorage(),
      partialize: (state) => ({
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        userProfile: state.userProfile,
        favoriteModels: state.favoriteModels,
        projects: state.projects,
      }),
    }
  )
)

export default useStore
