// Affiche un squelette seulement si le chargement dure plus de `delay`,
// et le garde visible au moins `minVisible` ms pour éviter un clignotement.
import { useEffect, useState } from 'react'

export function useSkeletonVisible(loading: boolean, delay = 180, minVisible = 300): boolean {
  const [visible, setVisible] = useState(false)
  const [shownAt, setShownAt] = useState<number | null>(null)

  useEffect(() => {
    if (loading) {
      const timer = window.setTimeout(() => {
        setVisible(true)
        setShownAt(Date.now())
      }, delay)
      return () => window.clearTimeout(timer)
    }

    if (!visible) return
    const elapsed = shownAt ? Date.now() - shownAt : minVisible
    const wait = Math.max(0, minVisible - elapsed)
    const timer = window.setTimeout(() => {
      setVisible(false)
      setShownAt(null)
    }, wait)
    return () => window.clearTimeout(timer)
  }, [loading, visible, shownAt, delay, minVisible])

  return visible
}
