import { useState, useEffect } from 'react'
import { X, User, Briefcase, Heart, MessageSquare, Globe, Sparkles, Palette } from 'lucide-react'
import useStore from '../../store/useStore'

const PRESET_COLORS = [
  { value: '#fbbf24', name: 'Ambre' },
  { value: '#f97316', name: 'Orange' },
  { value: '#ef4444', name: 'Rouge' },
  { value: '#ec4899', name: 'Rose' },
  { value: '#a855f7', name: 'Violet' },
  { value: '#6366f1', name: 'Indigo' },
  { value: '#3b82f6', name: 'Bleu' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#10b981', name: 'Émeraude' },
  { value: '#22c55e', name: 'Vert' },
]

export function ProfileModal({ isOpen, onClose }) {
  const userProfile = useStore((state) => state.userProfile)
  const setUserProfile = useStore((state) => state.setUserProfile)

  const [formData, setFormData] = useState(userProfile)

  useEffect(() => {
    setFormData(userProfile)
  }, [userProfile, isOpen])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setUserProfile(formData)
    onClose()
  }

  const communicationStyles = [
    { value: 'formal', label: 'Formel', desc: 'Ton professionnel et structuré' },
    { value: 'balanced', label: 'Équilibré', desc: 'Ni trop formel, ni trop décontracté' },
    { value: 'casual', label: 'Décontracté', desc: 'Ton amical et conversationnel' },
  ]

  const languages = [
    { value: 'french', label: 'Français' },
    { value: 'english', label: 'English' },
    { value: 'auto', label: 'Automatique' },
  ]

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-scale"
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
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
              }}
            >
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Personnalisation
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Adapte l'IA à tes besoins
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
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="px-6 py-5 space-y-5 overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* Accent Color */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <Palette size={16} />
              Couleur du thème
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleChange('accentColor', color.value)}
                  className="w-9 h-9 rounded-xl transition-all hover:scale-110"
                  style={{
                    background: color.value,
                    boxShadow: formData.accentColor === color.value
                      ? `0 0 0 2px var(--color-bg-secondary), 0 0 0 4px ${color.value}`
                      : 'none',
                  }}
                  title={color.name}
                />
              ))}
              {/* Custom color picker */}
              <label
                className="w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center transition-all hover:scale-110 overflow-hidden"
                style={{
                  background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                }}
                title="Couleur personnalisée"
              >
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="opacity-0 absolute w-0 h-0"
                />
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <User size={16} />
              Comment t'appelles-tu ?
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ton prénom"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Occupation */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <Briefcase size={16} />
              Quelle est ton activité ?
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => handleChange('occupation', e.target.value)}
              placeholder="Ex: Développeur, Étudiant, Designer..."
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <Heart size={16} />
              Quels sont tes centres d'intérêt ?
            </label>
            <input
              type="text"
              value={formData.interests}
              onChange={(e) => handleChange('interests', e.target.value)}
              placeholder="Ex: Technologie, Musique, Sport..."
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Communication Style */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <MessageSquare size={16} />
              Style de communication préféré
            </label>
            <div className="grid grid-cols-3 gap-2">
              {communicationStyles.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => handleChange('communicationStyle', style.value)}
                  className="px-3 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: formData.communicationStyle === style.value
                      ? 'var(--color-accent-soft)'
                      : 'var(--color-bg-tertiary)',
                    border: `1px solid ${formData.communicationStyle === style.value
                      ? 'var(--color-accent)'
                      : 'var(--color-border)'}`,
                    color: formData.communicationStyle === style.value
                      ? 'var(--color-accent)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <Globe size={16} />
              Langue de réponse
            </label>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => handleChange('language', lang.value)}
                  className="px-3 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: formData.language === lang.value
                      ? 'var(--color-accent-soft)'
                      : 'var(--color-bg-tertiary)',
                    border: `1px solid ${formData.language === lang.value
                      ? 'var(--color-accent)'
                      : 'var(--color-border)'}`,
                    color: formData.language === lang.value
                      ? 'var(--color-accent)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <Sparkles size={16} />
              Instructions personnalisées
            </label>
            <textarea
              value={formData.customInstructions}
              onChange={(e) => handleChange('customInstructions', e.target.value)}
              placeholder="Ajoute des instructions spécifiques pour personnaliser encore plus les réponses..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none resize-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={onClose}
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
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
              color: '#000',
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
