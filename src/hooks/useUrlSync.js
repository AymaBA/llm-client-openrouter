import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'

const APP_NAME = 'LLM Client'

export function useUrlSync() {
  const navigate = useNavigate()
  const location = useLocation()
  const isFirstRender = useRef(true)

  const activeConversationId = useStore((state) => state.activeConversationId)
  const conversations = useStore((state) => state.conversations)
  const setActiveConversationId = useStore((state) => state.setActiveConversationId)

  // Update page title based on active conversation
  useEffect(() => {
    const activeConversation = conversations.find((c) => c.id === activeConversationId)
    if (activeConversation) {
      document.title = `${activeConversation.title} - ${APP_NAME}`
    } else {
      document.title = APP_NAME
    }
  }, [activeConversationId, conversations])

  // On mount: read URL and set active conversation
  useEffect(() => {
    const match = location.pathname.match(/^\/conversation\/(.+)$/)
    if (match) {
      const urlConversationId = match[1]
      const conversationExists = conversations.some((c) => c.id === urlConversationId)

      if (conversationExists && urlConversationId !== activeConversationId) {
        setActiveConversationId(urlConversationId)
      } else if (!conversationExists) {
        // Conversation doesn't exist, redirect to home
        navigate('/', { replace: true })
      }
    }
    isFirstRender.current = false
  }, []) // Only on mount

  // When active conversation changes, update URL
  useEffect(() => {
    if (isFirstRender.current) return

    const currentPath = location.pathname
    const expectedPath = activeConversationId
      ? `/conversation/${activeConversationId}`
      : '/'

    if (currentPath !== expectedPath) {
      navigate(expectedPath, { replace: false })
    }
  }, [activeConversationId, navigate, location.pathname])

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/conversation\/(.+)$/)
      if (match) {
        const urlConversationId = match[1]
        const conversationExists = conversations.some((c) => c.id === urlConversationId)
        if (conversationExists) {
          setActiveConversationId(urlConversationId)
        }
      } else {
        setActiveConversationId(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [conversations, setActiveConversationId])
}
