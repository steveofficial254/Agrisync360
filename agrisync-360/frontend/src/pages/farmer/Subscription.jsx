import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, X, CreditCard, Smartphone,
  AlertCircle, TrendingUp, BarChart3, Shield, Zap, Clock, Leaf
} from 'lucide-react';
import { paymentsAPI } from '../../api/payments';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import { PageLoader, Spinner } from '../../components/common/Loader';
import toast from 'react-hot-toast';

const IS_DEV = import.meta.env.DEV;

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pollingRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [simulatingActivation, setSimulatingActivation] = useState(false);
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    plan: null,
    phone: '',
    status: 'idle', // idle | loading | waiting | success | failed
    checkoutId: null,
    countdown: 60,
  });

  useEffect(() => {
    loadSubscriptionData();
    return () => stopPolling();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subResp, plansResp] = await Promise.all([
        paymentsAPI.getSubscription(),
        paymentsAPI.getPlans(),
      ]);
      setSubscription(subResp.data?.data || null);
      setPlans(plansResp.data?.data || []);
    } catch (err) {
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  /* ── Payment flow ────────────────────────────────────── */

  const initiatePayment = async (plan) => {
    if (!paymentModal.phone || paymentModal.phone.length < 10) {
      setError('Please enter a valid M-Pesa phone number (10+ digits)');
      return;
    }
    setPaymentModal(prev => ({ ...prev, status: 'loading' }));
    try {
      const resp = await paymentsAPI.subscribe({
        plan: plan.plan_id,
        phone: paymentModal.phone,
      });
      const checkoutId = resp.data?.data?.checkout_request_id;
      if (!checkoutId) throw new Error('Failed to initiate payment');

      setPaymentModal(prev => ({ ...prev, checkoutId, status: 'waiting' }));
      startPolling(checkoutId);
    } catch (err) {
      setPaymentModal(prev => ({ ...prev, status: 'failed' }));
      setError(err?.response?.data?.message || err.message || 'Payment failed to initiate');
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = (checkoutId) => {
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      const remaining = Math.max(0, 60 - attempts * 3);
      setPaymentModal(prev => ({ ...prev, countdown: remaining }));

      if (attempts >= 20) {
        stopPolling();
        setPaymentModal(prev => ({ ...prev, status: 'failed' }));
        return;
      }

      try {
        const resp = await paymentsAPI.getPaymentStatus(checkoutId);
        const payStatus = resp.data?.data?.status;

        if (payStatus === 'completed') {
          stopPolling();
          setPaymentModal(prev => ({ ...prev, status: 'success' }));
          toast.success('🎉 Payment successful! Subscription activated.');
          await loadSubscriptionData();
          setTimeout(() => {
            closeModal();
            navigate('/farmer/dashboard');
          }, 2500);
        } else if (payStatus === 'failed' || payStatus === 'cancelled') {
          stopPolling();
          setPaymentModal(prev => ({ ...prev, status: 'failed' }));
          toast.error('Payment was cancelled or failed. Please try again.');
        }
      } catch {
        // keep polling
      }
    }, 3000);
  };

  /** DEV ONLY — simulate M-Pesa completing the payment */
  const handleSimulatePayment = async () => {
    const { checkoutId } = paymentModal;
    if (!checkoutId) return;
    setSimulatingActivation(true);
    try {
      await paymentsAPI.activateDev(checkoutId);
      toast.success('Dev: payment activated — detecting…');
    } catch (err) {
      toast.error('Dev activate failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSimulatingActivation(false);
    }
  };

  const closeModal = () => {
    stopPolling();
    setPaymentModal({ isOpen: false, plan: null, phone: '', status: 'idle', checkoutId: null, countdown: 60 });
  };

  /* ── Sub-components ──────────────────────────────────── */

  const tierColor = {
    free:  'border-gray-200 bg-gray-50',
    basic: 'border-blue-300 bg-blue-50',
    pro:   'border-purple-400 bg-purple-50',
  };
  const tierEmoji = { free: '🌾', basic: '🌱', pro: '⭐' };

  const CurrentPlanCard = () => {
    const tier = subscription?.tier || 'free';
    return (
      <Card className={`border-2 ${tierColor[tier]}`}>
        <div className="flex items-start justify-between">
          <div>
            <Badge variant={tier === 'pro' ? 'pro' : tier === 'basic' ? 'basic' : 'free'}>
              {tier.toUpperCase()} PLAN
            </Badge>
            <p className="text-2xl font-bold mt-2">
              {tier === 'free' ? 'Free' : tier === 'basic' ? 'KSH 99/month' : 'KSH 299/month'}
            </p>
          </div>
          <span className="text-3xl">{tierEmoji[tier]}</span>
        </div>
        {subscription?.is_active && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Subscription period</span>
              <span>{subscription.days_remaining} days left</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
              <div
                className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, (subscription.days_remaining / 30) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Expires: {subscription.subscription_end}</p>
          </div>
        )}
        {subscription?.features && (
          <div className="mt-4 space-y-1 pt-4 border-t border-gray-200">
            {Object.entries(subscription.features)
              .filter(([, v]) => v === true)
              .map(([feat]) => (
                <div key={feat} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={13} className="text-primary-500 flex-shrink-0" />
                  <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                </div>
              ))}
          </div>
        )}
      </Card>
    );
  };

  const featureList = [
    { key: 'weather_forecast', label: 'Weather Forecast', icon: '🌤' },
    { key: 'crop_advisory',    label: 'Crop Advisory',    icon: '📋' },
    { key: 'market_prices',    label: 'Market Prices',    icon: '📈' },
    { key: 'disease_risk',     label: 'Disease Risk Alerts', icon: '🛡' },
    { key: 'planting_calendar',label: 'Planting Calendar', icon: '📅' },
    { key: 'profitability_calc',label: 'Profitability Calculator', icon: '💰' },
    { key: 'sms_alerts',       label: 'SMS Alerts',       icon: '📱' },
    { key: 'ussd_access',      label: 'USSD Access',      icon: '📞' },
  ];

  const PlanCard = ({ plan }) => {
    const tier = plan.plan_id.includes('pro') ? 'pro' : 'basic';
    const isPro = tier === 'pro';
    const isCurrent = subscription?.tier === tier && subscription?.is_active;
    const features = plan.features || {};

    return (
      <Card className={`relative flex flex-col ${isPro ? 'border-2 border-primary-500 ring-2 ring-primary-100' : ''}`}>
        {isPro && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
              MOST POPULAR
            </span>
          </div>
        )}

        <div className="text-center mb-5 pt-2">
          <div className="text-4xl mb-2">{tierEmoji[tier]}</div>
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">KSH {plan.price_ksh}</span>
            <span className="text-gray-500 text-sm ml-1">/{plan.billing === 'annual' ? 'year' : 'month'}</span>
          </div>
        </div>

        <div className="space-y-2 mb-6 flex-1">
          {featureList.map(({ key, label, icon }) => {
            const val = features[key];
            const has = val === true || (typeof val === 'number' && val > 0);
            return (
              <div key={key} className={`flex items-center gap-2.5 text-sm ${has ? 'text-gray-700' : 'text-gray-300'}`}>
                <span>{has ? '✓' : '✗'}</span>
                <span>{icon} {label}</span>
                {typeof val === 'number' && val > 0 && (
                  <span className="ml-auto text-xs font-semibold text-gray-500">{val === 999 ? 'Unlimited' : val}</span>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => setPaymentModal({ isOpen: true, plan, phone: user?.phone || '', status: 'idle', checkoutId: null, countdown: 60 })}
          variant={isPro ? 'primary' : 'outline'}
          className="w-full"
          disabled={isCurrent}
        >
          {isCurrent ? '✓ Current Plan' : `Subscribe — KSH ${plan.price_ksh}`}
        </Button>
      </Card>
    );
  };

  const PaymentModal = () => {
    const { plan, phone, status, countdown, checkoutId } = paymentModal;
    if (!plan) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm relative">
          {/* Close button */}
          {status === 'idle' || status === 'failed' ? (
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          ) : null}

          {/* IDLE — enter phone */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{tierEmoji[plan.plan_id.includes('pro') ? 'pro' : 'basic']}</div>
                <h3 className="text-lg font-bold text-gray-900">Subscribe to {plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1">KSH {plan.price_ksh} via M-Pesa</p>
              </div>
              <Input
                label="M-Pesa Phone Number"
                placeholder="0712345678"
                value={phone}
                onChange={e => setPaymentModal(prev => ({ ...prev, phone: e.target.value }))}
              />
              {error && <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />}
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
                <Button
                  onClick={() => initiatePayment(plan)}
                  className="flex-1"
                  disabled={!phone || phone.length < 10}
                >
                  <Smartphone size={15} className="mr-1.5" />
                  Pay KSH {plan.price_ksh}
                </Button>
              </div>
            </div>
          )}

          {/* LOADING */}
          {status === 'loading' && (
            <div className="text-center py-10 space-y-4">
              <Spinner size="lg" />
              <p className="font-semibold text-gray-700">Initiating payment…</p>
            </div>
          )}

          {/* WAITING — STK push sent */}
          {status === 'waiting' && (
            <div className="text-center py-6 space-y-4">
              <div className="text-5xl animate-bounce">📱</div>
              <div>
                <p className="font-bold text-lg text-gray-900">Check your phone!</p>
                <p className="text-gray-500 text-sm mt-1">
                  M-Pesa prompt sent to <strong>{phone}</strong>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">Enter your M-Pesa PIN to complete payment</p>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-50 rounded-xl border border-amber-100">
                <Clock size={14} className="text-amber-600" />
                <p className="text-amber-700 text-sm font-medium">Waiting… {countdown}s</p>
              </div>
              <Spinner size="sm" className="mx-auto" />

              {/* DEV MODE — simulate button */}
              {IS_DEV && checkoutId && (
                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 mb-2">🛠 Dev Mode</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-dashed"
                    onClick={handleSimulatePayment}
                    isLoading={simulatingActivation}
                  >
                    Simulate Payment Complete
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {status === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-xl text-primary-700">Payment Successful!</p>
                <p className="text-gray-500 text-sm mt-1">
                  Your <strong>{plan.name}</strong> subscription is now active.
                </p>
              </div>
              <p className="text-xs text-gray-400 animate-pulse">Redirecting to dashboard…</p>
            </div>
          )}

          {/* FAILED */}
          {status === 'failed' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">❌</div>
              <div>
                <p className="font-bold text-lg text-red-600">Payment Failed</p>
                <p className="text-gray-500 text-sm mt-1">The payment was not completed. Please try again.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
                <Button onClick={() => setPaymentModal(prev => ({ ...prev, status: 'idle' }))} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  /* ── Page render ──────────────────────────────────────── */

  if (loading) return <PageLoader message="Loading subscription data…" />;

  return (
    <div className="p-4 md:p-6 space-y-8 pb-28 lg:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 mt-1 text-sm">Unlock the full power of AgriSync 360</p>
      </div>

      {error && <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />}

      {/* Current plan */}
      {subscription && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Your Current Plan</h2>
          <CurrentPlanCard />
          {!subscription.is_active && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2 text-sm text-amber-700">
              <Zap size={15} className="flex-shrink-0 mt-0.5" />
              <span>
                You are on the <strong>Free</strong> plan. Upgrade to access crop advisories, market prices, and more.
              </span>
            </div>
          )}
        </section>
      )}

      {/* What you unlock */}
      {!subscription?.is_active && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <BarChart3 size={20} className="text-blue-600" />, bg: 'bg-blue-50', title: 'Market Intelligence', desc: 'Real-time crop prices and profitability analysis' },
            { icon: <Leaf    size={20} className="text-green-600" />, bg: 'bg-green-50', title: 'Crop Advisories', desc: 'Personalized planting, nutrition & pest guidance' },
            { icon: <Shield  size={20} className="text-purple-600" />, bg: 'bg-purple-50', title: 'Disease Risk Alerts', desc: 'Early warnings powered by weather data (Pro)' },
          ].map(item => (
            <div key={item.title} className={`${item.bg} rounded-2xl p-4 flex gap-3`}>
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Plans grid */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans
            .filter(p => ['basic_monthly', 'pro_monthly'].includes(p.plan_id))
            .map(plan => <PlanCard key={plan.plan_id} plan={plan} />)
          }
        </div>
      </section>

      {/* Payment history placeholder */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Payment History</h2>
        <Card>
          <div className="text-center py-8">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Payment history coming soon</p>
          </div>
        </Card>
      </section>

      {/* Payment modal */}
      {paymentModal.isOpen && <PaymentModal />}
    </div>
  );
}
