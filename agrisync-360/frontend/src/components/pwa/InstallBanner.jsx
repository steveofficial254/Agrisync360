import { useState } from 'react'
import { Download, X, Wifi, WifiOff } from 'lucide-react'
import { usePWA } from '../../hooks/usePWA'
import Button from '../common/Button'

export function InstallBanner() {
  const { isInstallable, installApp, isOffline } = usePWA()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-banner-dismissed') === 'true'
  )

  const handleInstall = async () => {
    const installed = await installApp()
    if (installed) setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  if (dismissed || !isInstallable) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto
                    lg:right-4 lg:w-80 z-40 animate-slide-in-right">
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-3xl
                      border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl
                          flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🌾</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Install AgriSync 360</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Add to home screen for offline access and faster loading
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                leftIcon={<Download size={14} />}
                className="flex-1"
              >
                Install App
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-gray-400 px-2"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OfflineBanner() {
  const { isOffline } = usePWA()

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-warning-600 text-white text-center py-2 px-4
                      text-sm font-medium flex items-center
                      justify-center gap-2">
        <WifiOff size={14} />
        You are offline. Showing cached data.
      </div>
    </div>
  )
}
