import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, X, Star, CreditCard, Smartphone,
  AlertCircle, Info, TrendingUp, Users, BarChart3,
  Package, Send, Shield, Zap, Clock
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

export default function Subscription() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    plan: null,
    phone: '',
    status: 'idle', // idle | loading | waiting | success | failed
    checkoutId: null,
    countdown: 60
  });

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    setError('');

    try {
      const [subResp, plansResp] = await Promise.all([
        paymentsAPI.getSubscription(),
        paymentsAPI.getPlans()
      ]);

      setSubscription(subResp.data?.data || null);
      setPlans(plansResp.data?.data || []);
    } catch (err) {
      setError('Failed to load subscription data');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (plan) => {
    if (!paymentModal.phone || paymentModal.phone.length < 10) {
      setError('Please enter a valid M-Pesa phone number');
      return;
    }

    setPaymentModal(prev => ({ ...prev, status: 'loading' }));

    try {
      const resp = await paymentsAPI.subscribe({
        plan: plan.plan_id,
        phone: paymentModal.phone
      });
      
      const checkoutId = resp.data?.data?.checkout_request_id;
      if (!checkoutId) {
        throw new Error('Failed to initiate payment');
      }

      setPaymentModal(prev => ({
        ...prev,
        checkoutId,
        status: 'waiting'
      }));

      startPolling(checkoutId);
    } catch (err) {
      setPaymentModal(prev => ({ ...prev, status: 'failed' }));
      setError(err.message || 'Payment failed to initiate');
    }
  };

  const startPolling = (checkoutId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      setPaymentModal(prev => ({
        ...prev,
        countdown: 60 - (attempts * 3)
      }));

      if (attempts >= 20) {
        clearInterval(interval);
        setPaymentModal(prev => ({ ...prev, status: 'failed' }));
        return;
      }

      try {
        const resp = await paymentsAPI.getPaymentStatus(checkoutId);
        const payStatus = resp.data?.data?.status;

        if (payStatus === 'completed') {
          clearInterval(interval);
          setPaymentModal(prev => ({ ...prev, status: 'success' }));
          toast.success('Payment successful! Subscription activated.');
          // Reload subscription data
          await loadSubscriptionData();
          // Close modal after delay
          setTimeout(() => {
            setPaymentModal({ isOpen: false, plan: null, phone: '', status: 'idle', checkoutId: null, countdown: 60 });
          }, 2000);
        } else if (payStatus === 'failed' || payStatus === 'cancelled') {
          clearInterval(interval);
          setPaymentModal(prev => ({ ...prev, status: 'failed' }));
          toast.error('Payment was cancelled or failed');
        }
      } catch (err) {
        // Continue polling
      }
    }, 3000);
  };

  const CurrentPlanCard = ({ subscription }) => {
    const planColors = {
      free: 'border-gray-200',
      basic: 'border-blue-400',
      pro: 'border-purple-500',
    };
    const tier = subscription?.tier || 'free';
    
    return (
      <Card className={`border-2 ${planColors[tier]}`}>
        <div className="flex items-start justify-between">
          <div>
            <Badge variant={tier === 'pro' ? 'pro' : 
                            tier === 'basic' ? 'basic' : 'free'}>
              {tier?.toUpperCase()} PLAN
            </Badge>
            <p className="text-2xl font-bold mt-2">
              {tier === 'free' ? 'Free' :
               tier === 'basic' ? 'KSH 99/month' :
               'KSH 299/month'}
            </p>
          </div>
          <span className="text-3xl">
            {tier === 'pro' ? '⭐' : 
             tier === 'basic' ? '🌱' : '🌾'}
          </span>
        </div>
        
        {subscription?.is_active && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Subscription period</span>
              <span>{subscription.days_remaining} days left</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div
                className="h-2 bg-primary-500 rounded-full"
                style={{
                  width: `${Math.min(100, (subscription.days_remaining / 30) * 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Expires: {subscription.expires_on}
            </p>
          </div>
        )}
        
        <div className="mt-4 space-y-1">
          {Object.entries(subscription?.features || {})
            .filter(([_, v]) => v === true)
            .map(([feature, _]) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} className="text-primary-500" />
                <span className="capitalize">
                  {feature.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
        </div>
      </Card>
    );
  };

  const PaymentModal = ({ plan, onClose, onSuccess }) => {
    const { phone, status, countdown } = paymentModal;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {status === 'idle' && (
            <>
              <h3 className="text-lg font-bold mb-4">
                Subscribe to {plan.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Amount: <strong>KSH {plan.price_ksh}</strong>
              </p>
              <Input
                label="M-Pesa Phone Number"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPaymentModal(prev => ({ ...prev, phone: e.target.value }))}
              />
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={onClose} size="full">
                  Cancel
                </Button>
                <Button
                  onClick={() => initiatePayment(plan)}
                  size="full"
                  disabled={!phone || phone.length < 10}
                >
                  Pay KSH {plan.price_ksh}
                </Button>
              </div>
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-center py-8">
              <Spinner size="lg" />
              <p className="mt-4 font-semibold">Initiating payment...</p>
            </div>
          )}
          
          {status === 'waiting' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📱</div>
              <p className="font-bold text-lg">Check your phone!</p>
              <p className="text-gray-600 text-sm mt-2">
                An M-Pesa prompt has been sent to {phone}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Enter your M-Pesa PIN to complete payment
              </p>
              <div className="mt-4 p-3 bg-yellow-50 rounded-xl">
                <p className="text-yellow-800 text-sm">
                  ⏱ Waiting for payment... {countdown}s
                </p>
              </div>
              <Spinner size="sm" className="mt-4 mx-auto" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="font-bold text-lg text-primary-700">
                Payment Successful!
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Your {plan.name} subscription is now active.
              </p>
              <Button onClick={onClose} className="mt-6" size="full">
                Start Using AgriSync 360
              </Button>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">❌</div>
              <p className="font-bold text-lg text-red-600">
                Payment Failed
              </p>
              <p className="text-gray-600 text-sm mt-2">
                The payment was not completed. Please try again.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={onClose} size="full">
                  Cancel
                </Button>
                <Button onClick={() => setPaymentModal(prev => ({ ...prev, status: 'idle' }))} size="full">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const PlanFeatures = ({ features }) => {
    const allFeatures = [
      { key: 'weather_forecast_days', label: 'Weather forecast days' },
      { key: 'crop_advisory', label: 'Crop advisory access' },
      { key: 'market_prices', label: 'Market prices access' },
      { key: 'sms_alerts_per_month', label: 'SMS alerts per month' },
      { key: 'disease_risk_alerts', label: 'Disease risk alerts' },
      { key: 'planting_calendar', label: 'Planting calendar' },
      { key: 'profitability_calculator', label: 'Profitability calculator' },
      { key: 'ussd_access', label: 'USSD access' },
      { key: 'farms_allowed', label: 'Farms allowed' },
      { key: 'crops_allowed', label: 'Crops allowed' }
    ];

    return allFeatures.map(feature => (
      <div key={feature.key} className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-600">{feature.label}</span>
        {features[feature.key] !== undefined ? (
          <span className="text-sm font-medium text-gray-900">
            {typeof features[feature.key] === 'boolean' 
              ? (features[feature.key] ? '✓' : '✗')
              : features[feature.key]
            }
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </div>
    ));
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'pro': return '⭐';
      case 'basic': return '🌱';
      case 'free': return '🌾';
      default: return '📦';
    }
  };

  if (loading) {
    return <PageLoader message="Loading subscription data..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-1">Manage your AgriSync 360 subscription</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* Current Plan Card */}
      {subscription && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
          <CurrentPlanCard subscription={subscription} />
        </div>
      )}

      {/* Plan Comparison Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={plan.plan_id}
              className={`relative ${
                plan.name === 'Pro' ? 'border-2 border-primary-500 ring-2 ring-primary-200' : 'border border-gray-200'
              }`}
            >
              {plan.name === 'Pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{getPlanIcon(plan.name)}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900">
                  KSH {plan.price_ksh}
                </div>
                <p className="text-gray-500">{plan.billing_period}</p>
              </div>
              
              <div className="mb-6">
                <PlanFeatures features={plan.features} />
              </div>
              
              <Button
                onClick={() => setPaymentModal({ 
                  isOpen: true, 
                  plan, 
                  phone: user?.phone || '', 
                  status: 'idle', 
                  checkoutId: null, 
                  countdown: 60 
                })}
                variant={plan.name === 'Pro' ? 'primary' : 'outline'}
                size="lg"
                className="w-full"
                disabled={subscription?.tier?.toLowerCase() === plan.name.toLowerCase()}
              >
                {subscription?.tier?.toLowerCase() === plan.name.toLowerCase() 
                  ? 'Current Plan' 
                  : `Subscribe to ${plan.name}`
                }
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
        <Card>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Payment history will be available soon</p>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      {paymentModal.isOpen && (
        <PaymentModal
          plan={paymentModal.plan}
          onClose={() => setPaymentModal({ isOpen: false, plan: null, phone: '', status: 'idle', checkoutId: null, countdown: 60 })}
        />
      )}
    </div>
  );
}
