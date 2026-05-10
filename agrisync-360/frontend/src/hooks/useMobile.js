import { useState, useEffect } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 768
  )
  const [isTablet, setIsTablet] = useState(
    () => window.innerWidth >= 768 && window.innerWidth < 1024
  )

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth
      setIsMobile(w < 768)
      setIsTablet(w >= 768 && w < 1024)
    }

    const observer = new ResizeObserver(handler)
    observer.observe(document.body)

    return () => observer.disconnect()
  }, [])

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet }
}

export function useVibrate() {
  const vibrate = (pattern = [10]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }
  return vibrate
}
