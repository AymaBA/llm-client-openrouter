import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { Sidebar } from './components/Sidebar/Sidebar'
import { ChatWindow } from './components/Chat/ChatWindow'
import { ApiKeyModal } from './components/Settings/ApiKeyModal'
import { ProfileModal } from './components/Settings/ProfileModal'
import { ModelSelectorModal } from './components/ModelSelectorModal'
import { ProjectModal, ProjectSelectorModal } from './components/Projects'
import useStore from './store/useStore'
import { useUrlSync } from './hooks/useUrlSync'
import { useThemeColor } from './hooks/useThemeColor'
import { AlertTriangle, X } from 'lucide-react'

function App() {
  const apiKey = useStore((state) => state.apiKey)
  const showApiKeyModal = useStore((state) => state.showApiKeyModal)
  const setShowApiKeyModal = useStore((state) => state.setShowApiKeyModal)
  const showProfileModal = useStore((state) => state.showProfileModal)
  const setShowProfileModal = useStore((state) => state.setShowProfileModal)
  const showProjectModal = useStore((state) => state.showProjectModal)
  const setShowProjectModal = useStore((state) => state.setShowProjectModal)
  const showProjectSelectorModal = useStore((state) => state.showProjectSelectorModal)
  const setShowProjectSelectorModal = useStore((state) => state.setShowProjectSelectorModal)
  const setApiKey = useStore((state) => state.setApiKey)
  const error = useStore((state) => state.error)
  const clearError = useStore((state) => state.clearError)
  const fetchModels = useStore((state) => state.fetchModels)

  // Sync URL with active conversation
  useUrlSync()

  // Apply custom theme color
  useThemeColor()

  // Show API key modal on first launch
  useEffect(() => {
    if (!apiKey) {
      setShowApiKeyModal(true)
    }
  }, [apiKey, setShowApiKeyModal])

  // Fetch models when API key changes
  useEffect(() => {
    fetchModels()
  }, [apiKey, fetchModels])

  const handleSaveApiKey = (key) => {
    setApiKey(key)
  }

  return (
    <>
      <Layout sidebar={<Sidebar />}>
        {/* Error banner */}
        {error && (
          <div
            className="flex-shrink-0 px-4 py-3 flex items-center justify-between animate-slide-in-up"
            style={{
              background: 'var(--color-danger-soft)',
              borderBottom: '1px solid rgba(248, 113, 113, 0.3)'
            }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                <strong>Erreur:</strong> {error}
              </p>
            </div>
            <button
              onClick={clearError}
              className="p-1 rounded-lg transition-colors duration-200"
              style={{ color: 'var(--color-danger)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <ChatWindow />
      </Layout>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        currentKey={apiKey}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ModelSelectorModal />

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />

      <ProjectSelectorModal
        isOpen={showProjectSelectorModal}
        onClose={() => setShowProjectSelectorModal(false)}
      />
    </>
  )
}

export default App
