/**
 * Streaming Manager - Handles LLM streaming without React re-renders
 *
 * This module manages streaming state using a pub/sub pattern with refs,
 * completely bypassing React's state management during streaming.
 *
 * Key benefits:
 * - No React re-renders during streaming (major performance gain)
 * - Direct DOM updates via requestAnimationFrame
 * - State is synced to React only at the end of streaming
 *
 * This is how production LLM chat interfaces like ChatGPT handle streaming.
 */

class StreamingManager {
  constructor() {
    // Current streaming state (not React state - just JS objects)
    this.content = ''
    this.reasoning = ''
    this.images = []
    this.citations = []
    this.isStreaming = false
    this.conversationId = null

    // Subscribers (components that want to be notified)
    this.subscribers = new Set()

    // Refs that components can read directly
    this.contentRef = { current: '' }
    this.reasoningRef = { current: '' }
    this.imagesRef = { current: [] }
    this.citationsRef = { current: [] }
  }

  // Subscribe to streaming updates
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // Notify subscribers (minimal - only for structural changes)
  notify(event) {
    this.subscribers.forEach(cb => cb(event))
  }

  // Start a new streaming session
  startStreaming(conversationId) {
    this.content = ''
    this.reasoning = ''
    this.images = []
    this.citations = []
    this.isStreaming = true
    this.conversationId = conversationId

    // Update refs
    this.contentRef.current = ''
    this.reasoningRef.current = ''
    this.imagesRef.current = []
    this.citationsRef.current = []

    this.notify({ type: 'start', conversationId })
  }

  // Add content chunk (called frequently - NO React updates here)
  addContent(chunk) {
    if (chunk) {
      this.content += chunk
      this.contentRef.current = this.content
    }
  }

  // Add reasoning chunk
  addReasoning(chunk) {
    if (chunk) {
      this.reasoning += chunk
      this.reasoningRef.current = this.reasoning
    }
  }

  // Add image (deduplicated)
  addImage(image) {
    if (image && !this.images.some(img => img.url === image.url)) {
      this.images.push(image)
      this.imagesRef.current = this.images
    }
  }

  // Add citation (deduplicated)
  addCitation(citation) {
    if (citation && !this.citations.some(c => c.url === citation.url)) {
      this.citations.push(citation)
      this.citationsRef.current = this.citations
      // Notify for citations since they affect UI structure
      this.notify({ type: 'citations', citations: this.citations })
    }
  }

  // End streaming session - returns final state
  endStreaming() {
    this.isStreaming = false

    const result = {
      content: this.content,
      reasoning: this.reasoning,
      images: [...this.images],
      citations: [...this.citations],
      conversationId: this.conversationId,
    }

    this.notify({ type: 'end', result })

    return result
  }

  // Get current state (for reading)
  getState() {
    return {
      content: this.content,
      reasoning: this.reasoning,
      images: this.images,
      citations: this.citations,
      isStreaming: this.isStreaming,
      conversationId: this.conversationId,
    }
  }

  // Get refs for direct component access
  getRefs() {
    return {
      contentRef: this.contentRef,
      reasoningRef: this.reasoningRef,
      imagesRef: this.imagesRef,
      citationsRef: this.citationsRef,
    }
  }

  // Reset state
  reset() {
    this.content = ''
    this.reasoning = ''
    this.images = []
    this.citations = []
    this.isStreaming = false
    this.conversationId = null

    this.contentRef.current = ''
    this.reasoningRef.current = ''
    this.imagesRef.current = []
    this.citationsRef.current = []

    this.notify({ type: 'reset' })
  }
}

// Singleton instance
export const streamingManager = new StreamingManager()

// React hook to use streaming state
import { useState, useEffect, useRef } from 'react'

export function useStreamingState() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const refsRef = useRef(streamingManager.getRefs())

  useEffect(() => {
    const unsubscribe = streamingManager.subscribe((event) => {
      if (event.type === 'start') {
        setIsStreaming(true)
        setConversationId(event.conversationId)
      } else if (event.type === 'end' || event.type === 'reset') {
        setIsStreaming(false)
      }
    })

    return unsubscribe
  }, [])

  return {
    isStreaming,
    conversationId,
    ...refsRef.current,
  }
}
