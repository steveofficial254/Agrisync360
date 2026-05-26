import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cloud, 
  BookOpen, 
  TrendingUp, 
  Users, 
  Shield, 
  Smartphone,
  Droplets,
  Sun,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Sprout,
  Leaf,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Star,
  User
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

import image1 from '../assets/image1.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';
import image5 from '../assets/image5.png';

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [morphIndex, setMorphIndex] = useState(0);
  const [bgGradient, setBgGradient] = useState(0);
  const [particles, setParticles] = useState([]);

  // Generate particles for dramatic effect
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1
    }));
    setParticles(newParticles);
  }, [morphIndex]);

  // Add scroll listener for animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Strong morphing animations
  useEffect(() => {
    const morphInterval = setInterval(() => {
      setMorphIndex((prev) => (prev + 1) % 6);
      setBgGradient((prev) => (prev + 1) % 5);
    }, 2000); // Faster - every 2 seconds

    return () => clearInterval(morphInterval);
  }, []);

  const morphTexts = [
    '🌾 Revolutionizing Kenyan Agriculture',
    '📊 Data-Driven Farming Intelligence',
    '🤖 AI-Powered Crop Management', 
    '🌱 Sustainable Harvest Solutions',
    '📈 Profit Maximization Platform',
    '🚀 Next-Gen Farming Technology'
  ];

  const gradients = [
    'from-green-50 via-emerald-100 to-blue-50',
    'from-blue-50 via-purple-100 to-pink-50',
    'from-purple-50 via-red-100 to-orange-50',
    'from-orange-50 via-yellow-100 to-green-50',
    'from-indigo-50 via-blue-100 to-purple-50'
  ];

  const features = [
    {
      icon: Cloud,
      title: 'Weather Forecasts',
      description: 'Get accurate 7-day weather forecasts with disease risk alerts and planting recommendations powered by advanced meteorological data.',
      color: 'text-blue-600',
      gradient: 'from-blue-50 to-blue-100',
      image: image1,
      imageAlt: 'Kenyan farm with weather monitoring equipment',
      rating: 4.8,
      reviews: 1247
    },
    {
      icon: BookOpen,
      title: 'Crop Advisory',
      description: 'Expert advice on planting, nutrition, and pest control for optimal yields from agricultural specialists.',
      color: 'text-green-600',
      gradient: 'from-green-50 to-green-100',
      image: image2,
      imageAlt: 'Agricultural expert advising on crop management',
      rating: 4.6,
      reviews: 892
    },
    {
      icon: TrendingUp,
      title: 'Market Prices',
      description: 'Real-time market prices for major Kenyan crops and livestock to help you make informed selling decisions.',
      color: 'text-emerald-600',
      gradient: 'from-emerald-50 to-emerald-100',
      image: image3,
      imageAlt: 'Kenyan market with fresh produce for sale',
      rating: 4.9,
      reviews: 2156
    },
    {
      icon: Users,
      title: 'Farming Community',
      description: 'Connect with thousands of Kenyan farmers, share experiences, and learn from agricultural experts.',
      color: 'text-purple-600',
      gradient: 'from-purple-50 to-purple-100',
      image: image4,
      imageAlt: 'Kenyan farmers community meeting and sharing knowledge',
      rating: 4.7,
      reviews: 1563
    },
    {
      icon: Shield,
      title: 'Crop Insurance',
      description: 'Access affordable crop insurance options to protect your investment against weather and market risks.',
      color: 'text-red-600',
      gradient: 'from-red-50 to-red-100',
      image: image5,
      imageAlt: 'Protected crops with insurance coverage',
      rating: 4.5,
      reviews: 734
    },
    {
      icon: Smartphone,
      title: 'USSD Service',
      description: 'Access all features without internet using *384*360# on any mobile phone, anywhere in Kenya.',
      color: 'text-orange-600',
      gradient: 'from-orange-50 to-orange-100',
      image: image2,
      imageAlt: 'Mobile phone showing USSD service interface',
      rating: 4.4,
      reviews: 567
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: 'KSH 0',
      period: 'Forever',
      description: 'Perfect for getting started',
      features: [
        'Basic weather forecasts',
        'USSD access',
        'Market prices (delayed)',
        'Basic crop advisory',
        'Community support',
        '5 SMS alerts per month'
      ],
      highlighted: false,
      buttonText: 'Get Started',
      buttonVariant: 'outline',
      icon: '🌱'
    },
    {
      name: 'Basic',
      price: 'KSH 99',
      period: 'per month',
      description: 'Most popular choice',
      features: [
        'Everything in Free',
        'Real-time market prices',
        'Complete crop advisory',
        'Planting calendars',
        'Email support',
        'Advisory history',
        '20 SMS alerts per month',
        'Yield predictions'
      ],
      highlighted: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'primary',
      icon: '🌾'
    },
    {
      name: 'Pro',
      price: 'KSH 299',
      period: 'per month',
      description: 'For serious farmers',
      features: [
        'Everything in Basic',
        'Disease risk alerts',
        'Unlimited SMS alerts',
        'Profitability calculator',
        'Priority support',
        'Advanced analytics',
        'Direct expert consultation',
        'Custom reports',
        'API access'
      ],
      highlighted: false,
      buttonText: 'Start Free Trial',
      buttonVariant: 'gradient',
      icon: ''
    }
  ];

  const stats = [
    { label: 'Active Farmers', value: '50,000+', icon: Users, color: 'text-primary-600' },
    { label: 'Yield Increase', value: '35%', icon: TrendingUp, color: 'text-harvest-600' },
    { label: 'Counties Covered', value: '47', icon: MapPin, color: 'text-earth-600' },
    { label: 'Expert Advisors', value: '500+', icon: BookOpen, color: 'text-primary-600' }
  ];

  const testimonials = [
    {
      name: 'John Kamau',
      location: 'Nakuru County',
      role: 'Maize Farmer',
      content: 'AgriSync 360 helped me increase my maize yield by 40% through timely weather alerts and market insights.',
      avatar: '',
      rating: 5
    },
    {
      name: 'Mary Wanjiku',
      location: 'Kiambu County', 
      role: 'Vegetable Farmer',
      content: 'The crop advisory feature is amazing. I now know exactly when to plant and which fertilizers to use.',
      avatar: '👩‍🌾',
      rating: 5
    },
    {
      name: 'Joseph Njoroge',
      location: 'Uasin Gishu County',
      role: 'Wheat Farmer',
      content: 'Market prices are always accurate. I sell my wheat at the right time and get better profits.',
      avatar: '👨‍🌾',
      rating: 4
    }
  ];

  const handleEmailSubscribe = (e) => {
    e.preventDefault();
    setIsSubscribed(true);
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 font-display">AgriSync 360</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">Testimonials</a>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-primary-600 transition-colors font-medium"
              >
                Login
              </button>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Button
                onClick={() => navigate('/register')}
                variant="primary"
                size="sm"
                rounded="lg"
              >
                Get Started
              </Button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Features</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Testimonials</a>
              <button
                onClick={() => navigate('/login')}
                className="block px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                Login
              </button>
              <Button
                onClick={() => navigate('/register')}
                variant="primary"
                size="sm"
                className="mt-2 w-full"
                rounded="lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section key={`hero-${bgGradient}`} className={`relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br ${gradients[bgGradient]} overflow-hidden transition-all duration-3000 ease-in-out`}>
        {/* Dramatic floating morphing elements */}
        <div key="float-1" className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-30 animate-pulse transition-all duration-2000 ease-in-out shadow-2xl"
             style={{ 
               transform: `translate(${Math.sin(morphIndex * 0.3) * 40}px, ${Math.cos(morphIndex * 0.3) * 40}px) scale(${1 + Math.sin(morphIndex * 0.2) * 0.2})`,
               animation: `float ${2 + morphIndex * 0.5}s ease-in-out infinite`
             }}></div>
        <div key="float-2" className="absolute top-20 right-16 w-24 h-24 bg-gradient-to-br from-blue-200 to-purple-300 rounded-full opacity-25 animate-pulse transition-all duration-2000 ease-in-out shadow-2xl"
             style={{ 
               transform: `translate(${Math.cos(morphIndex * 0.4) * 30}px, ${Math.sin(morphIndex * 0.4) * 30}px) scale(${1 + Math.cos(morphIndex * 0.3) * 0.3})`,
               animation: `float ${3 + morphIndex * 0.4}s ease-in-out infinite`
             }}></div>
        <div key="float-3" className="absolute bottom-32 left-20 w-28 h-28 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-25 animate-pulse transition-all duration-2000 ease-in-out shadow-2xl"
             style={{ 
               transform: `translate(${Math.sin(morphIndex * 0.5) * 35}px, ${Math.cos(morphIndex * 0.5) * 35}px) scale(${1 + Math.sin(morphIndex * 0.4) * 0.25})`,
               animation: `float ${4 + morphIndex * 0.3}s ease-in-out infinite`
             }}></div>
        <div key="float-4" className="absolute top-1/2 left-1/3 w-20 h-20 bg-gradient-to-br from-orange-200 to-red-300 rounded-full opacity-20 animate-spin transition-all duration-2000 ease-in-out shadow-2xl"
             style={{ 
               transform: `translate(${Math.cos(morphIndex * 0.6) * 25}px, ${Math.sin(morphIndex * 0.6) * 25}px) rotate(${morphIndex * 45}deg)`,
               animation: `spin ${5 + morphIndex * 0.2}s linear infinite`
             }}></div>
        <div key="float-5" className="absolute bottom-40 right-32 w-16 h-16 bg-gradient-to-br from-yellow-200 to-green-300 rounded-full opacity-20 animate-bounce transition-all duration-2000 ease-in-out shadow-2xl"
             style={{ 
               transform: `translate(${Math.sin(morphIndex * 0.7) * 20}px, ${Math.cos(morphIndex * 0.7) * 20}px)`,
               animation: `bounce ${2 + morphIndex * 0.3}s ease-in-out infinite`
             }}></div>
        
        {/* Particle Effects */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
              animation: `particle-float ${particle.speed}s ease-in-out infinite`,
              transform: `translate(${Math.sin(morphIndex * 0.1 + particle.id) * 30}px, ${Math.cos(morphIndex * 0.1 + particle.id) * 30}px)`
            }}
          />
        ))}
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`text-center transform transition-all duration-700 delay-100 ${scrollY > 50 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <Badge variant="primary" size="lg" className="mb-4">
            
            </Badge>
            <h1 className={`text-5xl md:text-7xl font-bold text-gray-900 mb-6 font-display leading-tight transform transition-all duration-700 delay-200 ${scrollY > 100 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              Transform Your Farm with
              <span key={morphIndex} className="block bg-gradient-to-r from-green-600 via-emerald-500 to-blue-600 bg-clip-text text-transparent transition-all duration-2000 ease-in-out font-black"
                  style={{
                    textShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
                    animation: `glow ${2 + morphIndex * 0.3}s ease-in-out infinite`,
                    transform: `scale(${1 + Math.sin(morphIndex * 0.2) * 0.1})`
                  }}>
                {morphTexts[morphIndex]}
              </span>
            </h1>
            <p className={`text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed transform transition-all duration-700 delay-300 ${scrollY > 150 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              AgriSync 360 empowers Kenyan farmers with AI-powered weather forecasts, 
              expert crop advisory, real-time market prices, and comprehensive farming support - 
              all accessible through your mobile phone.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transform transition-all duration-700 delay-400 ${scrollY > 200 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              <Button
                onClick={() => navigate('/register')}
                variant="primary"
                size="xl"
                className="text-lg px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                size="xl"
                className="text-lg px-8 py-4 rounded-xl font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 transform hover:scale-105 transition-all duration-300"
              >
                Sign In
                <User className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free forever plan available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* USSD CTA */}
          <div className="mt-16 text-center">
            <Card className="inline-flex items-center bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 text-lg">Dial *384*360#</p>
                <p className="text-sm text-gray-600">Access on any phone - no internet required</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transform transition-all duration-700 delay-100 ${scrollY > 300 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <Badge variant="primary" size="lg" className="mb-4">
              Features
            </Badge>
            <h2 className={`text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display transform transition-all duration-700 delay-200 ${scrollY > 350 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              Everything You Need to Succeed
            </h2>
            <p className={`text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed transform transition-all duration-700 delay-300 ${scrollY > 400 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              From weather forecasts to market prices, we provide all the tools 
              modern Kenyan farmers need to increase productivity and profitability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`p-8 hover:shadow-xl transition-all duration-700 hover:-translate-y-1 border border-gray-200 transform ${scrollY > 450 + (index * 100) ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}
                style={{ transitionDelay: `${400 + (index * 100)}ms` }}
              >
                {/* Feature Image */}
                <div className="relative h-48 mb-6 rounded-xl overflow-hidden bg-gray-100">
                  <img 
                    src={feature.image} 
                    alt={feature.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${feature.gradient}">
                          <feature.icon className="h-8 w-8 text-white" />
                        </div>
                      `;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                
                {/* Feature Icon Overlay */}
                <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className={`text-xl font-bold text-gray-900 mb-4 ${feature.color}`}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                {/* Rating System */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < feature.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600 font-medium">
                      {feature.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {feature.reviews} reviews
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transform transition-all duration-700 delay-100 ${scrollY > 900 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <Badge variant="harvest" size="lg" className="mb-4">
            </Badge>
            <h2 className={`text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display transform transition-all duration-700 delay-200 ${scrollY > 950 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              Trusted by Kenyan Farmers
            </h2>
            <p className={`text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed transform transition-all duration-700 delay-300 ${scrollY > 1000 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              See how AgriSync 360 is helping farmers across Kenya transform their agricultural practices.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className={`p-8 hover:shadow-xl transition-all duration-700 hover:-translate-y-1 border border-gray-200 transform ${scrollY > 1050 + (index * 100) ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}
                style={{ transitionDelay: `${400 + (index * 100)}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <p className="text-sm text-green-600 font-medium mt-4">
                  {testimonial.role}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transform transition-all duration-700 delay-100 ${scrollY > 1200 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <Badge variant="harvest" size="lg" className="mb-4">
            </Badge>
            <h2 className={`text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display transform transition-all duration-700 delay-200 ${scrollY > 1250 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              Simple, Transparent Pricing
            </h2>
            <p className={`text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed transform transition-all duration-700 delay-300 ${scrollY > 1300 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
              Choose the plan that works best for your farm. Start free and upgrade as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative p-8 hover:shadow-xl transition-all duration-700 hover:-translate-y-1 transform ${scrollY > 1350 + (index * 100) ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}
                style={{ transitionDelay: `${400 + (index * 100)}ms` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="primary" size="sm" className="px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="text-4xl mb-2">{plan.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {plan.price}
                  </div>
                  <div className="text-gray-500">{plan.period}</div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate('/register')}
                  variant={plan.buttonVariant}
                  className="w-full"
                  size="lg"
                  rounded="lg"
                >
                  {plan.buttonText}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="white" size="lg" className="mb-4">
            🚀 Get Started
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed max-w-3xl mx-auto">
            Join thousands of Kenyan farmers already using AgriSync 360 to 
            increase their yields and income.
          </p>
          <Button
            onClick={() => navigate('/register')}
            variant="secondary"
            size="xl"
            className="text-lg px-8 py-4 rounded-xl font-semibold"
          >
            Start Free Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="primary" size="lg" className="mb-4">
            📧 Stay Updated
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
            Get Farming Tips Delivered
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Receive weekly agricultural insights and market updates directly to your inbox.
          </p>
          
          {isSubscribed ? (
            <div className="inline-flex items-center bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 font-medium">Successfully subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleEmailSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                rounded="lg"
                disabled={!email}
              >
                Subscribe
                <Mail className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mr-3">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white font-display">AgriSync 360</span>
                  <p className="text-gray-400 mt-1">Smart farming solutions for Kenyan farmers.</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">USSD Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-center md:text-left">
                &copy; 2026 AgriSync 360. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
