import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, ZoomIn } from 'lucide-react'

export function ImageLightbox({ image, onClose }) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = image.url
    link.download = image.name || `image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [image])

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99999,
        animation: 'lightboxFadeIn 0.2s ease-out forwards',
      }}
    >
      {/* Backdrop with blur - clicks here close the modal */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1,
        }}
      />

      {/* Controls bar - top */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between p-4"
        style={{ zIndex: 3 }}
      >
        {/* Image label - left */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-accent)' }}
          >
            <ZoomIn size={16} style={{ color: '#000' }} />
          </div>
          <span
            className="font-medium text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            {image.isUserImage ? 'Image uploadée' : 'Image générée'}
          </span>
        </div>

        {/* Buttons - right */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-3 rounded-full
                       transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'var(--color-accent)',
              color: '#000',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <Download size={18} />
            <span className="hidden sm:inline">Télécharger</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-full transition-all duration-200
                       hover:scale-110 active:scale-95 group cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <X
              size={24}
              className="transition-transform duration-200 group-hover:rotate-90"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="relative flex items-center justify-center w-full h-full p-8 sm:p-16 pt-24"
        style={{
          zIndex: 2,
          pointerEvents: 'none',
          animation: 'lightboxImageIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <img
          src={image.url}
          alt={image.name || 'Image agrandie'}
          className="max-w-full max-h-full object-contain rounded-lg select-none"
          style={{
            boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto',
          }}
          draggable={false}
        />
      </div>

      {/* Bottom hint */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs"
        style={{
          zIndex: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        Appuie sur <kbd className="px-1.5 py-0.5 rounded mx-1" style={{ background: 'rgba(255,255,255,0.15)' }}>Échap</kbd> ou clique à l'extérieur pour fermer
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lightboxImageIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )

  // Use portal to render at document body level
  return createPortal(content, document.body)
}
