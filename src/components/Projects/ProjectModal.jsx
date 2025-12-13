import { useState, useEffect, useRef } from 'react'
import { X, FolderKanban, FileText, Trash2, Plus, Sparkles, Upload, Type, Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import useStore from '../../store/useStore'
import {
  extractTextFromFile,
  isFileSupported,
  getAcceptedFileTypes,
  formatFileSize,
} from '../../utils/fileExtractor'

const EMOJI_OPTIONS = [
  '📁', '🚀', '💻', '🎨', '📝', '🔧', '🎯', '📊', '🧪', '💡',
  '🤖', '🌐', '📚', '🎮', '🛠️', '⚡', '🔬', '📱', '🎵', '✨',
]

export function ProjectModal({ isOpen, onClose }) {
  const editingProject = useStore((state) => state.editingProject)
  const createProject = useStore((state) => state.createProject)
  const updateProject = useStore((state) => state.updateProject)
  const setEditingProject = useStore((state) => state.setEditingProject)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    contextFiles: [],
    icon: '📁',
  })

  const [showAddFile, setShowAddFile] = useState(false)
  const [addFileMode, setAddFileMode] = useState(null) // 'upload' or 'paste'
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name || '',
        description: editingProject.description || '',
        systemPrompt: editingProject.systemPrompt || '',
        contextFiles: editingProject.contextFiles || [],
        icon: editingProject.icon || '📁',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        systemPrompt: '',
        contextFiles: [],
        icon: '📁',
      })
    }
    setShowAddFile(false)
    setAddFileMode(null)
    setNewFileName('')
    setNewFileContent('')
    setIsExtracting(false)
    setExtractError(null)
  }, [editingProject, isOpen])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsExtracting(true)
    setExtractError(null)

    try {
      for (const file of files) {
        if (!isFileSupported(file)) {
          setExtractError(`Type non supporté: ${file.name}`)
          continue
        }

        const extracted = await extractTextFromFile(file)

        const newFile = {
          id: uuidv4(),
          name: extracted.name,
          content: extracted.content,
          type: extracted.type,
          size: extracted.size,
        }

        setFormData((prev) => ({
          ...prev,
          contextFiles: [...prev.contextFiles, newFile],
        }))
      }

      setShowAddFile(false)
      setAddFileMode(null)
    } catch (err) {
      setExtractError(err.message)
    } finally {
      setIsExtracting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddPastedFile = () => {
    if (!newFileName.trim() || !newFileContent.trim()) return

    const newFile = {
      id: uuidv4(),
      name: newFileName.trim(),
      content: newFileContent.trim(),
      type: 'Texte',
      size: new Blob([newFileContent]).size,
    }

    setFormData((prev) => ({
      ...prev,
      contextFiles: [...prev.contextFiles, newFile],
    }))

    setNewFileName('')
    setNewFileContent('')
    setShowAddFile(false)
    setAddFileMode(null)
  }

  const handleRemoveFile = (fileId) => {
    setFormData((prev) => ({
      ...prev,
      contextFiles: prev.contextFiles.filter((f) => f.id !== fileId),
    }))
  }

  const handleSave = () => {
    if (!formData.name.trim()) return

    if (editingProject) {
      updateProject(editingProject.id, formData)
    } else {
      createProject(formData)
    }

    setEditingProject(null)
    onClose()
  }

  const handleClose = () => {
    setEditingProject(null)
    onClose()
  }

  const isEditing = !!editingProject

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in-scale"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
              }}
            >
              {formData.icon}
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {isEditing ? 'Modifier le projet' : 'Nouveau projet'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {isEditing ? 'Modifie les paramètres du projet' : 'Crée un contexte personnalisé'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="px-6 py-5 space-y-5 overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* Emoji selector */}
          <div className="space-y-3">
            <label
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Sparkles size={16} />
              Icône du projet
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange('icon', emoji)}
                  className="w-10 h-10 rounded-xl text-xl transition-all hover:scale-110 flex items-center justify-center"
                  style={{
                    background:
                      formData.icon === emoji
                        ? 'var(--color-accent-soft)'
                        : 'var(--color-bg-tertiary)',
                    border: `1px solid ${
                      formData.icon === emoji
                        ? 'var(--color-accent)'
                        : 'var(--color-border)'
                    }`,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <FolderKanban size={16} />
              Nom du projet
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Assistant Code Python"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Description (optionnel)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Une courte description du projet..."
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
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
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Sparkles size={16} />
              Prompt système
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              placeholder="Décris le comportement et le contexte de l'IA pour ce projet...

Ex: Tu es un expert en Python spécialisé dans le développement backend. Tu privilégies les bonnes pratiques, le code propre et les tests unitaires."
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none resize-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
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
          </div>

          {/* Context Files */}
          <div className="space-y-3">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptedFileTypes()}
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex items-center justify-between">
              <label
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <FileText size={16} />
                Fichiers de contexte
              </label>
              {!showAddFile && (
                <button
                  type="button"
                  onClick={() => setShowAddFile(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'var(--color-accent-soft)',
                    color: 'var(--color-accent)',
                    border: '1px solid var(--color-accent)',
                  }}
                >
                  <Plus size={14} />
                  Ajouter
                </button>
              )}
            </div>

            {/* File list */}
            {formData.contextFiles.length > 0 && (
              <div className="space-y-2">
                {formData.contextFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <FileText
                      size={18}
                      style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {file.name}
                        </p>
                        {file.type && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{
                              background: 'var(--color-accent-soft)',
                              color: 'var(--color-accent)',
                            }}
                          >
                            {file.type}
                          </span>
                        )}
                        {file.size && (
                          <span
                            className="text-[10px] flex-shrink-0"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {formatFileSize(file.size)}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {file.content.slice(0, 150)}
                        {file.content.length > 150 ? '...' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--color-text-muted)'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.contextFiles.length === 0 && !showAddFile && (
              <p
                className="text-sm py-4 text-center rounded-xl"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-muted)',
                  border: '1px dashed var(--color-border)',
                }}
              >
                Ajoute des fichiers PDF, TXT, Markdown ou code
              </p>
            )}

            {/* Add file - mode selection */}
            {showAddFile && !addFileMode && (
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-accent)',
                }}
              >
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Comment veux-tu ajouter le fichier ?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-[1.02]"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    {isExtracting ? (
                      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                    ) : (
                      <Upload size={24} style={{ color: 'var(--color-accent)' }} />
                    )}
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {isExtracting ? 'Extraction...' : 'Importer un fichier'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      PDF, TXT, MD, JSON, code...
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddFileMode('paste')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-[1.02]"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    <Type size={24} style={{ color: 'var(--color-accent)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Coller du texte
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Copie-colle directement
                    </span>
                  </button>
                </div>
                {extractError && (
                  <p className="text-xs mt-3 text-center" style={{ color: '#ef4444' }}>
                    {extractError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFile(false)
                    setExtractError(null)
                  }}
                  className="w-full mt-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Add file - paste mode */}
            {showAddFile && addFileMode === 'paste' && (
              <div
                className="space-y-3 p-4 rounded-xl"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-accent)',
                }}
              >
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Nom du fichier (ex: config.json)"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  autoFocus
                />
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Colle le contenu du fichier ici..."
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none font-mono"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddFileMode(null)
                      setNewFileName('')
                      setNewFileContent('')
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPastedFile}
                    disabled={!newFileName.trim() || !newFileContent.trim()}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                    style={{
                      background: 'var(--color-accent)',
                      color: '#000',
                    }}
                  >
                    Ajouter le fichier
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: formData.name.trim()
                ? 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)'
                : 'var(--color-bg-tertiary)',
              color: formData.name.trim() ? '#000' : 'var(--color-text-muted)',
            }}
          >
            {isEditing ? 'Enregistrer' : 'Créer le projet'}
          </button>
        </div>
      </div>
    </div>
  )
}
