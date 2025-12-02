import { useEffect } from 'react'
import useStore from '../store/useStore'

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Lighten or darken a color
function adjustColor(hex, percent) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const adjust = (value) => {
    const adjusted = Math.round(value + (255 - value) * (percent / 100))
    return Math.min(255, Math.max(0, adjusted))
  }

  if (percent > 0) {
    // Lighten
    return `rgb(${adjust(rgb.r)}, ${adjust(rgb.g)}, ${adjust(rgb.b)})`
  } else {
    // Darken
    const darken = (value) => Math.round(value * (1 + percent / 100))
    return `rgb(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)})`
  }
}

export function useThemeColor() {
  const accentColor = useStore((state) => state.userProfile.accentColor)

  useEffect(() => {
    if (!accentColor) return

    const root = document.documentElement
    const rgb = hexToRgb(accentColor)

    if (rgb) {
      // Main accent color
      root.style.setProperty('--color-accent', accentColor)

      // Lighter version for hover
      root.style.setProperty('--color-accent-hover', adjustColor(accentColor, 20))

      // Soft version for backgrounds
      root.style.setProperty('--color-accent-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`)

      // Border accent
      root.style.setProperty('--color-border-accent', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`)

      // Glow shadows
      root.style.setProperty('--shadow-glow', `0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
      root.style.setProperty('--shadow-glow-lg', `0 0 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`)
    }
  }, [accentColor])
}
