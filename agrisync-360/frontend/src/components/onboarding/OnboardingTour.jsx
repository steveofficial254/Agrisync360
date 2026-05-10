import { useState, useEffect } from 'react'
import { ChevronRight, X, Check } from 'lucide-react'
import Button from '../common/Button'

const STEPS = [
  {
    id: 1,
    emoji: '👋',
    title: 'Karibu AgriSync 360!',
    subtitle: 'Welcome to your farm intelligence platform',
    description: 'AgriSync 360 inakusaidia kupata habari za hali ya hewa, bei za soko, na ushauri wa mazao — yote mahali pamoja.',
    tip: 'Dial *384*360# on any phone for instant access',
  },
  {
    id: 2,
    emoji: '🌤️',
    title: 'Hali ya Hewa',
    subtitle: 'Hyperlocal weather for your farm',
    description: 'Pata utabiri wa hali ya hewa kwa eneo lako halisi la shamba. Jua siku nzuri za kupanda na hatari za magonjwa.',
    tip: 'Weather updates every 6 hours automatically',
  },
  {
    id: 3,
    emoji: '🌾',
    title: 'Unda Shamba Lako',
    subtitle: 'Set up your farm profile',
    description: 'Ongeza shamba lako na mazao unayolima. Utapata ushauri maalum kwa kila zao na hatua ya ukuaji.',
    tip: 'Add your GPS location for accurate local weather',
    action: { label: 'Add My Farm', path: '/farms/setup' },
  },
  {
    id: 4,
    emoji: '📈',
    title: 'Bei za Soko',
    subtitle: 'Know when to sell',
    description: 'Angalia bei za soko za mazao yako kwenye kaunti zote 47. Jua wakati bora wa kuuza mazao yako.',
    tip: 'Price alerts sent via SMS for Pro subscribers',
  },
  {
    id: 5,
    emoji: '💳',
    title: 'Jiunga Nawe',
    subtitle: 'Unlock all features',
    description: 'Lipa KSH 99/mwezi kupata ushauri kamili wa mazao, bei za soko, na arifa za SMS. Lipa kwa M-Pesa.',
    tip: 'Cancel anytime. No hidden fees.',
    action: { label: 'Subscribe Now', path: '/subscription' },
    isLast: true,
  },
]

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('onboarding-complete')
    if (!completed) {
      setTimeout(() => setVisible(true), 1000)
    }
  }, [])

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding-complete', 'true')
    setVisible(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding-complete', 'true')
    setVisible(false)
  }

  if (!visible) return null

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center
                    justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full sm:max-w-md bg-white
                      rounded-t-3xl sm:rounded-3xl overflow-hidden
                      shadow-3xl animate-slide-in-right">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-primary-600 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Skip */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all
                  ${i === step ? 'w-6 bg-primary-600' : 
                    i < step ? 'bg-primary-300' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600
                         flex items-center gap-1"
            >
              Skip <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-50 rounded-3xl
                            flex items-center justify-center
                            text-5xl mx-auto mb-6 shadow-inner">
              {current.emoji}
            </div>
            <h2 className="text-2xl font-bold font-display text-gray-900 mb-1">
              {current.title}
            </h2>
            <p className="text-primary-600 text-sm font-semibold mb-4">
              {current.subtitle}
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Tip */}
          <div className="bg-primary-50 rounded-2xl p-4 mb-6
                          flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-primary-800 text-xs font-medium">
              {current.tip}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {current.action ? (
              <>
                <Button fullWidth size="lg" onClick={handleNext}>
                  {current.isLast ? (
                    <><Check size={18} /> Complete Setup</>
                  ) : (
                    <>{current.action.label} <ChevronRight size={18} /></>
                  )}
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  variant="ghost"
                  onClick={handleNext}
                >
                  Skip this step
                </Button>
              </>
            ) : (
              <Button
                fullWidth
                size="lg"
                onClick={handleNext}
                rightIcon={
                  step < STEPS.length - 1
                    ? <ChevronRight size={18} />
                    : <Check size={18} />
                }
              >
                {step < STEPS.length - 1 ? 'Next' : 'Get Started!'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
