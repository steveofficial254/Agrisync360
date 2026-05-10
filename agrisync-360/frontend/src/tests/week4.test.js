/**
 * AgriSync 360 — Week 4 Component Tests
 * Tests all PWA, mobile, and onboarding components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Test Components
import OnboardingTour from '../components/onboarding/OnboardingTour'
import { InstallBanner, OfflineBanner } from '../components/pwa/InstallBanner'
import usePWA from '../hooks/usePWA'
import useMobile from '../hooks/useMobile'

// Mock service worker registration
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn(() => Promise.resolve({
      installing: { addEventListener: vi.fn() },
      addEventListener: vi.fn(),
    })),
  },
})

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
)

describe('Week 4 Components', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ========================================
  // PWA HOOK TESTS
  // ========================================
  describe('usePWA Hook', () => {
    it('should initialize with correct defaults', () => {
      const TestComponent = () => {
        const pwa = usePWA()
        return <div data-testid="pwa-state">{JSON.stringify({
          isInstallable: pwa.isInstallable,
          isInstalled: pwa.isInstalled,
          isOffline: pwa.isOffline
        })}</div>
      }

      render(<TestComponent />, { wrapper: TestWrapper })

      const state = JSON.parse(screen.getByTestId('pwa-state').textContent)
      expect(state.isInstallable).toBe(false)
      expect(state.isInstalled).toBe(false)
      expect(state.isOffline).toBe(false)
    })

    it('should detect offline state', async () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const TestComponent = () => {
        const pwa = usePWA()
        return <div data-testid="pwa-offline">{pwa.isOffline.toString()}</div>
      }

      render(<TestComponent />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByTestId('pwa-offline').textContent).toBe('true')
      })
    })
  })

  // ========================================
  // MOBILE HOOK TESTS
  // ========================================
  describe('useMobile Hook', () => {
    it('should detect mobile viewport', async () => {
      // Mock mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 600,
      })

      const TestComponent = () => {
        const mobile = useMobile()
        return <div data-testid="mobile-state">{JSON.stringify(mobile)}</div>
      }

      render(<TestComponent />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        const state = JSON.parse(screen.getByTestId('mobile-state').textContent)
        expect(state.isMobile).toBe(true)
        expect(state.isTablet).toBe(false)
        expect(state.isDesktop).toBe(false)
      })
    })

    it('should detect desktop viewport', async () => {
      // Mock desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1200,
      })

      const TestComponent = () => {
        const mobile = useMobile()
        return <div data-testid="desktop-state">{JSON.stringify(mobile)}</div>
      }

      render(<TestComponent />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        const state = JSON.parse(screen.getByTestId('desktop-state').textContent)
        expect(state.isMobile).toBe(false)
        expect(state.isTablet).toBe(false)
        expect(state.isDesktop).toBe(true)
      })
    })

    it('should provide vibration function', () => {
      const TestComponent = () => {
        const vibrate = useMobile()
        return (
          <button 
            data-testid="vibrate-btn"
            onClick={() => vibrate([100, 50, 100])}
          >
            Vibrate
          </button>
        )
      }

      render(<TestComponent />, { wrapper: TestWrapper })
      
      const button = screen.getByTestId('vibrate-btn')
      fireEvent.click(button)
      
      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100])
    })
  })

  // ========================================
  // ONBOARDING TOUR TESTS
  // ========================================
  describe('OnboardingTour Component', () => {
    it('should not show if completed', () => {
      localStorage.setItem('onboarding-complete', 'true')

      render(<OnboardingTour />, { wrapper: TestWrapper })
      
      expect(screen.queryByText(/Karibu AgriSync 360!/i)).not.toBeInTheDocument()
    })

    it('should show on first visit', () => {
      render(<OnboardingTour />, { wrapper: TestWrapper })
      
      // Check first step content
      expect(screen.getByText(/Karibu AgriSync 360!/i)).toBeInTheDocument()
      expect(screen.getByText(/Welcome to your farm intelligence platform/i)).toBeInTheDocument()
      expect(screen.getByText(/Dial \*384\*360#/i)).toBeInTheDocument()
    })

    it('should navigate through steps', async () => {
      render(<OnboardingTour />, { wrapper: TestWrapper })
      
      // Step 1
      expect(screen.getByText(/Karibu AgriSync 360!/i)).toBeInTheDocument()
      
      // Click next
      const nextButton = screen.getByText(/Next/i)
      await userEvent.click(nextButton)
      
      // Step 2
      await waitFor(() => {
        expect(screen.getByText(/Hali ya Hewa/i)).toBeInTheDocument()
      })
      
      // Continue to step 3
      await userEvent.click(screen.getByText(/Next/i))
      
      await waitFor(() => {
        expect(screen.getByText(/Unda Shamba Lako/i)).toBeInTheDocument()
      })
    })

    it('should complete tour and set localStorage', async () => {
      const onComplete = vi.fn()
      render(<OnboardingTour onComplete={onComplete} />, { wrapper: TestWrapper })
      
      // Go through all steps
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.queryByText(/Next/i) || screen.queryByText(/Get Started/i)
        if (nextButton) {
          await userEvent.click(nextButton)
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
        expect(localStorage.getItem('onboarding-complete')).toBe('true')
      })
    })

    it('should skip tour', async () => {
      render(<OnboardingTour />, { wrapper: TestWrapper })
      
      const skipButton = screen.getByText(/Skip/i)
      await userEvent.click(skipButton)
      
      expect(localStorage.getItem('onboarding-complete')).toBe('true')
      expect(screen.queryByText(/Karibu AgriSync 360!/i)).not.toBeInTheDocument()
    })
  })

  // ========================================
  // PWA INSTALL BANNER TESTS
  // ========================================
  describe('InstallBanner Component', () => {
    beforeEach(() => {
      // Mock beforeinstallprompt event
      const mockPrompt = {
        prompt: vi.fn(() => Promise.resolve({ outcome: 'accepted' })),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }
      
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'beforeinstallprompt') {
          handler(mockPrompt)
        }
      })
    })

    it('should not show if not installable', () => {
      render(<InstallBanner />, { wrapper: TestWrapper })
      
      expect(screen.queryByText(/Install AgriSync 360/i)).not.toBeInTheDocument()
    })

    it('should show install prompt when available', async () => {
      // Trigger beforeinstallprompt
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
      
      render(<InstallBanner />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByText(/Install AgriSync 360/i)).toBeInTheDocument()
        expect(screen.getByText(/Add to home screen/i)).toBeInTheDocument()
      })
    })

    it('should dismiss and remember preference', async () => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
      
      render(<InstallBanner />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByText(/Install AgriSync 360/i)).toBeInTheDocument()
      })
      
      const dismissButton = screen.getByLabelText(/dismiss/i)
      await userEvent.click(dismissButton)
      
      expect(screen.queryByText(/Install AgriSync 360/i)).not.toBeInTheDocument()
      expect(localStorage.getItem('pwa-banner-dismissed')).toBe('true')
    })
  })

  describe('OfflineBanner Component', () => {
    it('should not show when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      render(<OfflineBanner />, { wrapper: TestWrapper })
      
      expect(screen.queryByText(/You are offline/i)).not.toBeInTheDocument()
    })

    it('should show when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      render(<OfflineBanner />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByText(/You are offline/i)).toBeInTheDocument()
        expect(screen.getByText(/Showing cached data/i)).toBeInTheDocument()
      })
    })
  })

  // ========================================
  // INTEGRATION TESTS
  // ========================================
  describe('Component Integration', () => {
    it('should render all components together without errors', () => {
      const TestApp = () => {
        const pwa = usePWA()
        const mobile = useMobile()
        
        return (
          <div>
            <OfflineBanner />
            <InstallBanner />
            <OnboardingTour />
            <div data-testid="integration-state">
              Mobile: {mobile.isMobile.toString()}, 
              PWA Installable: {pwa.isInstallable.toString()}
            </div>
          </div>
        )
      }

      expect(() => {
        render(<TestApp />, { wrapper: TestWrapper })
      }).not.toThrow()
    })

    it('should handle localStorage correctly', () => {
      // Test localStorage interactions
      localStorage.setItem('test-key', 'test-value')
      expect(localStorage.getItem('test-key')).toBe('test-value')
      
      localStorage.removeItem('test-key')
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('should handle responsive design', async () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', { value: 600 })
      
      const TestComponent = () => {
        const mobile = useMobile()
        return <div data-testid="responsive">{mobile.isMobile.toString()}</div>
      }

      const { rerender } = render(<TestComponent />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByTestId('responsive').textContent).toBe('true')
      })

      // Test desktop view
      Object.defineProperty(window, 'innerWidth', { value: 1200 })
      
      // Trigger resize
      window.dispatchEvent(new Event('resize'))
      
      await waitFor(() => {
        expect(screen.getByTestId('responsive').textContent).toBe('false')
      })
    })
  })
})
