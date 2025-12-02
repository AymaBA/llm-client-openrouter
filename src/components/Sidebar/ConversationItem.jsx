import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, Trash2, Edit2, Download, MoreHorizontal } from 'lucide-react'

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onExport,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const inputRef = useRef(null)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    setEditTitle(conversation.title)
  }, [conversation.title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [showMenu])

  useEffect(() => {
    if (!showMenu) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowMenu(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showMenu])

  const handleRename = useCallback(() => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed)
    } else {
      setEditTitle(conversation.title)
    }
    setIsEditing(false)
  }, [editTitle, conversation.title, onRename])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRename()
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title)
      setIsEditing(false)
    }
  }

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(false)
    requestAnimationFrame(() => onDelete())
  }, [onDelete])

  const handleExport = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(false)
    onExport()
  }, [onExport])

  const handleStartRename = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(false)
    requestAnimationFrame(() => setIsEditing(true))
  }, [])

  const handleMenuToggle = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()

    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.right - 176, window.innerWidth - 184), // 176 = menu width (w-44 = 11rem)
      })
    }
    setShowMenu((prev) => !prev)
  }, [showMenu])

  return (
    <div
      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                 transition-all duration-200"
      style={{
        background: isActive ? 'var(--color-accent-soft)' : 'transparent',
        border: `1px solid ${isActive ? 'var(--color-border-accent)' : 'transparent'}`,
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--color-bg-hover)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent'
      }}
    >
      <MessageSquare
        size={16}
        className="flex-shrink-0"
        style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
      />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 px-2 py-1 text-sm rounded-lg focus:outline-none"
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-accent)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 0 0 3px var(--color-accent-soft)'
          }}
        />
      ) : (
        <span
          className="flex-1 min-w-0 text-sm truncate font-medium"
          style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
        >
          {conversation.title}
        </span>
      )}

      {/* Menu button */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleMenuToggle}
          className="p-1.5 rounded-lg transition-all duration-200"
          style={{
            opacity: showMenu ? 1 : 0,
            background: showMenu ? 'var(--color-bg-hover)' : 'transparent',
            color: 'var(--color-text-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.background = 'var(--color-bg-hover)'
          }}
          onMouseLeave={(e) => {
            if (!showMenu) {
              e.currentTarget.style.opacity = '0'
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <MoreHorizontal size={14} />
        </button>

        {showMenu && createPortal(
          <div
            ref={menuRef}
            className="fixed w-44 rounded-xl py-2 animate-fade-in-scale"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleStartRename}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-hover)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
            >
              <Edit2 size={14} />
              Renommer
            </button>
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-hover)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
            >
              <Download size={14} />
              Exporter MD
            </button>
            <div className="my-1.5 mx-3" style={{ borderTop: '1px solid var(--color-border)' }} />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--color-danger)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-danger-soft)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
