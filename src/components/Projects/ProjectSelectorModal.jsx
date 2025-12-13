import { useState, useEffect } from 'react'
import { X, FolderKanban, Plus, Pencil, Trash2, FileText, Check } from 'lucide-react'
import useStore from '../../store/useStore'

export function ProjectSelectorModal({ isOpen, onClose }) {
  const projects = useStore((state) => state.projects)
  const conversations = useStore((state) => state.conversations)
  const activeConversationId = useStore((state) => state.activeConversationId)
  const setConversationProject = useStore((state) => state.setConversationProject)
  const setShowProjectModal = useStore((state) => state.setShowProjectModal)
  const setEditingProject = useStore((state) => state.setEditingProject)
  const deleteProject = useStore((state) => state.deleteProject)

  const [confirmDelete, setConfirmDelete] = useState(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  const currentProjectId = activeConversation?.projectId || null

  useEffect(() => {
    if (!isOpen) {
      setConfirmDelete(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (confirmDelete) {
          setConfirmDelete(null)
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, confirmDelete, onClose])

  if (!isOpen) return null

  const handleSelectProject = (projectId) => {
    if (!activeConversationId) return
    setConversationProject(activeConversationId, projectId)
    onClose()
  }

  const handleCreateProject = () => {
    setEditingProject(null)
    setShowProjectModal(true)
    onClose()
  }

  const handleEditProject = (e, project) => {
    e.stopPropagation()
    setEditingProject(project)
    setShowProjectModal(true)
    onClose()
  }

  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation()
    if (confirmDelete === projectId) {
      deleteProject(projectId)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(projectId)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-scale"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
              }}
            >
              <FolderKanban size={18} className="text-black" />
            </div>
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Projets
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Choisis un contexte pour cette conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-hover)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-3 overflow-y-auto"
          style={{ maxHeight: 'calc(80vh - 130px)' }}
        >
          {/* No project option */}
          <button
            onClick={() => handleSelectProject(null)}
            className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all text-left"
            style={{
              background:
                currentProjectId === null
                  ? 'var(--color-accent-soft)'
                  : 'transparent',
              border: `1px solid ${
                currentProjectId === null
                  ? 'var(--color-accent)'
                  : 'transparent'
              }`,
            }}
            onMouseEnter={(e) => {
              if (currentProjectId !== null) {
                e.currentTarget.style.background = 'var(--color-bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (currentProjectId !== null) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
              }}
            >
              🚫
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium"
                style={{
                  color:
                    currentProjectId === null
                      ? 'var(--color-accent)'
                      : 'var(--color-text-primary)',
                }}
              >
                Aucun projet
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Utilise uniquement le profil général
              </p>
            </div>
            {currentProjectId === null && (
              <Check size={18} style={{ color: 'var(--color-accent)' }} />
            )}
          </button>

          {/* Divider */}
          {projects.length > 0 && (
            <div
              className="my-3 mx-2"
              style={{ borderTop: '1px solid var(--color-border)' }}
            />
          )}

          {/* Projects list */}
          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group"
                style={{
                  background:
                    currentProjectId === project.id
                      ? 'var(--color-accent-soft)'
                      : 'transparent',
                  border: `1px solid ${
                    currentProjectId === project.id
                      ? 'var(--color-accent)'
                      : 'transparent'
                  }`,
                }}
                onMouseEnter={(e) => {
                  if (currentProjectId !== project.id) {
                    e.currentTarget.style.background = 'var(--color-bg-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentProjectId !== project.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {project.icon || '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color:
                        currentProjectId === project.id
                          ? 'var(--color-accent)'
                          : 'var(--color-text-primary)',
                    }}
                  >
                    {project.name}
                  </p>
                  {project.description && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {project.systemPrompt && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'var(--color-bg-tertiary)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Prompt
                      </span>
                    )}
                    {project.contextFiles?.length > 0 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{
                          background: 'var(--color-bg-tertiary)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <FileText size={10} />
                        {project.contextFiles.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditProject(e, project)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                      e.currentTarget.style.color = 'var(--color-accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--color-text-muted)'
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{
                      color:
                        confirmDelete === project.id
                          ? '#ef4444'
                          : 'var(--color-text-muted)',
                      background:
                        confirmDelete === project.id
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      e.currentTarget.style.color = '#ef4444'
                    }}
                    onMouseLeave={(e) => {
                      if (confirmDelete !== project.id) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--color-text-muted)'
                      }
                    }}
                    title={
                      confirmDelete === project.id
                        ? 'Cliquer pour confirmer'
                        : 'Supprimer'
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {currentProjectId === project.id && (
                  <Check
                    size={18}
                    style={{ color: 'var(--color-accent)', flexShrink: 0 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {projects.length === 0 && (
            <div
              className="text-center py-8 px-4 rounded-xl"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px dashed var(--color-border)',
              }}
            >
              <FolderKanban
                size={32}
                style={{ color: 'var(--color-text-muted)', margin: '0 auto' }}
              />
              <p
                className="text-sm mt-3 font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Aucun projet
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Crée ton premier projet pour personnaliser tes conversations
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={handleCreateProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
              color: '#000',
            }}
          >
            <Plus size={16} />
            Créer un projet
          </button>
        </div>
      </div>
    </div>
  )
}
