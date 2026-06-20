/**
 * Mock Data for Farmer Dashboard
 * This file provides comprehensive mock data for all farmer dashboard components
 * to enable development and testing without backend dependencies.
 */

export const mockFarmerProfile = {
  id: 'farmer-001',
  phone: '+254712345678',
  first_name: 'John',
  last_name: 'Kamau',
  county: 'Nakuru',
  sub_county: 'Nakuru North',
  ward: 'Bahati',
  village: 'Molo',
  latitude: -0.2833,
  longitude: 36.0667,
  role: 'farmer',
  is_verified: true,
  is_active: true,
  created_at: '2024-01-15T08:00:00Z',
  updated_at: '2024-06-11T10:30:00Z'
}

export const mockFarms = [
  {
    id: 'farm-001',
    name: 'Main Farm - Molo',
    size_acres: 5.5,
    county: 'Nakuru',
    sub_county: 'Nakuru North',
    soil_type: 'loam',
    water_source: 'irrigation',
    latitude: -0.2833,
    longitude: 36.0667,
    elevation: 2500,
    is_primary: true,
    created_at: '2024-01-20T10:00:00Z'
  },
  {
    id: 'farm-002',
    name: 'Secondary Farm - Njoro',
    size_acres: 3.0,
    county: 'Nakuru',
    sub_county: 'Nakuru West',
    soil_type: 'clay',
    water_source: 'rain',
    latitude: -0.2500,
    longitude: 36.1000,
    elevation: 2400,
    is_primary: false,
    created_at: '2024-03-10T14:30:00Z'
  }
]

export const mockCrops = [
  {
    id: 'crop-001',
    farm_id: 'farm-001',
    farm_name: 'Main Farm - Molo',
    crop_name: 'maize',
    crop_type: 'maize',
    variety: 'H614',
    status: 'growing',
    area_planted_acres: 2.5,
    area_acres: 2.5,
    planting_date: '2024-04-15',
    expected_harvest_date: '2024-08-15',
    days_to_harvest: 65,
    days_to_maturity: 120,
    progress_percent: 75,
    growth_stage: 'flowering',
    created_at: '2024-04-15T08:00:00Z'
  },
  {
    id: 'crop-002',
    farm_id: 'farm-001',
    farm_name: 'Main Farm - Molo',
    crop_name: 'beans',
    crop_type: 'beans',
    variety: 'KAT X69',
    status: 'growing',
    area_planted_acres: 1.5,
    area_acres: 1.5,
    planting_date: '2024-05-01',
    expected_harvest_date: '2024-07-15',
    days_to_harvest: 34,
    days_to_maturity: 75,
    progress_percent: 60,
    growth_stage: 'vegetative',
    created_at: '2024-05-01T08:00:00Z'
  },
  {
    id: 'crop-003',
    farm_id: 'farm-002',
    farm_name: 'Secondary Farm - Njoro',
    crop_name: 'potatoes',
    crop_type: 'potatoes',
    variety: 'Shangi',
    status: 'growing',
    area_planted_acres: 2.0,
    area_acres: 2.0,
    planting_date: '2024-04-20',
    expected_harvest_date: '2024-07-20',
    days_to_harvest: 69,
    days_to_maturity: 90,
    progress_percent: 70,
    growth_stage: 'tuber bulking',
    created_at: '2024-04-20T08:00:00Z'
  }
]

export const mockWeatherData = {
  location: {
    name: 'Molo, Nakuru',
    latitude: -0.2833,
    longitude: 36.0667
  },
  current: {
    temp: 22,
    temp_min: 18,
    temp_max: 26,
    condition: 'Partly cloudy',
    humidity: 65,
    wind_speed: 12,
    wind_direction: 'NE',
    pressure: 1015,
    visibility: 10,
    uv_index: 6,
    feels_like: 23
  },
  forecast: [
    {
      date: '2024-06-12',
      temp_min: 17,
      temp_max: 25,
      condition: 'Sunny',
      humidity: 60,
      wind_speed: 10,
      precipitation_chance: 10,
      precipitation_mm: 0
    },
    {
      date: '2024-06-13',
      temp_min: 18,
      temp_max: 26,
      condition: 'Partly cloudy',
      humidity: 65,
      wind_speed: 12,
      precipitation_chance: 20,
      precipitation_mm: 2
    },
    {
      date: '2024-06-14',
      temp_min: 16,
      temp_max: 24,
      condition: 'Cloudy',
      humidity: 70,
      wind_speed: 15,
      precipitation_chance: 40,
      precipitation_mm: 5
    },
    {
      date: '2024-06-15',
      temp_min: 17,
      temp_max: 23,
      condition: 'Light rain',
      humidity: 80,
      wind_speed: 14,
      precipitation_chance: 70,
      precipitation_mm: 12
    },
    {
      date: '2024-06-16',
      temp_min: 16,
      temp_max: 22,
      condition: 'Rain',
      humidity: 85,
      wind_speed: 18,
      precipitation_chance: 80,
      precipitation_mm: 20
    },
    {
      date: '2024-06-17',
      temp_min: 17,
      temp_max: 24,
      condition: 'Partly cloudy',
      humidity: 75,
      wind_speed: 12,
      precipitation_chance: 30,
      precipitation_mm: 3
    },
    {
      date: '2024-06-18',
      temp_min: 18,
      temp_max: 26,
      condition: 'Sunny',
      humidity: 60,
      wind_speed: 10,
      precipitation_chance: 5,
      precipitation_mm: 0
    }
  ],
  summary: {
    overall_disease_risk: 'moderate',
    pest_risk: 'low',
    frost_risk: 'none',
    heat_stress_risk: 'low',
    drought_risk: 'low'
  },
  alerts: [
    {
      type: 'rain',
      severity: 'moderate',
      message: 'Expected rain on June 15-16. Consider delaying spraying operations.',
      date: '2024-06-12'
    }
  ]
}

export const mockMarketPrices = [
  {
    id: 'price-001',
    crop_name: 'maize',
    price_per_kg: 32,
    market: 'Nakuru',
    county: 'Nakuru',
    trend: 'up',
    change: 5.2,
    date: '2024-06-11',
    unit: 'per kg'
  },
  {
    id: 'price-002',
    crop_name: 'beans',
    price_per_kg: 85,
    market: 'Nakuru',
    county: 'Nakuru',
    trend: 'up',
    change: 3.8,
    date: '2024-06-11',
    unit: 'per kg'
  },
  {
    id: 'price-003',
    crop_name: 'potatoes',
    price_per_kg: 45,
    market: 'Nakuru',
    county: 'Nakuru',
    trend: 'down',
    change: -2.1,
    date: '2024-06-11',
    unit: 'per kg'
  },
  {
    id: 'price-004',
    crop_name: 'tomatoes',
    price_per_kg: 65,
    market: 'Nairobi',
    county: 'Nairobi',
    trend: 'up',
    change: 8.5,
    date: '2024-06-11',
    unit: 'per kg'
  },
  {
    id: 'price-005',
    crop_name: 'kale',
    price_per_kg: 40,
    market: 'Nairobi',
    county: 'Nairobi',
    trend: 'stable',
    change: 0.5,
    date: '2024-06-11',
    unit: 'per kg'
  }
]

export const mockMarketTrends = {
  crop: 'maize',
  trend: 'increasing',
  change_percent: 5.2,
  data_points: [
    { date: '2024-03-11', price: 28 },
    { date: '2024-04-11', price: 29 },
    { date: '2024-05-11', price: 30 },
    { date: '2024-06-11', price: 32 }
  ]
}

export const mockAdvisories = [
  {
    id: 'adv-001',
    crop_name: 'maize',
    crop: 'maize',
    title: 'Maize Fall Armyworm Alert',
    type: 'pest',
    category: 'pest',
    severity: 'high',
    description: 'Fall armyworm detected in Nakuru region. Monitor crops regularly for signs of infestation. Look for egg masses on leaves and frass on whorls.',
    content: 'Fall armyworm detected in Nakuru region. Monitor crops regularly for signs of infestation. Look for egg masses on leaves and frass on whorls.',
    symptoms: 'Irregular holes in leaves, frass on whorls, damaged tassels',
    treatment: 'Apply recommended pesticides: Emamectin benzoate or Chlorpyrifos. Consider biological control using natural enemies.',
    created_at: '2024-06-10T08:00:00Z'
  },
  {
    id: 'adv-002',
    crop_name: 'beans',
    crop: 'beans',
    title: 'Bean Rust Prevention',
    type: 'disease',
    category: 'disease',
    severity: 'moderate',
    description: 'High humidity conditions favor bean rust development. Ensure proper spacing and avoid overhead irrigation.',
    content: 'High humidity conditions favor bean rust development. Ensure proper spacing and avoid overhead irrigation.',
    symptoms: 'Orange-brown pustules on leaves, yellowing of leaves',
    treatment: 'Apply fungicides containing mancozeb or chlorothalonil. Remove infected plant material.',
    created_at: '2024-06-09T10:00:00Z'
  },
  {
    id: 'adv-003',
    crop_name: 'maize',
    crop: 'maize',
    title: 'Nitrogen Fertilizer Application',
    type: 'nutrition',
    category: 'general',
    severity: 'normal',
    description: 'Apply nitrogen fertilizer at V6 growth stage for optimal yield. Use 100kg/ha of CAN or urea.',
    content: 'Apply nitrogen fertilizer at V6 growth stage for optimal yield. Use 100kg/ha of CAN or urea.',
    npk_requirements: { N: 100, P: 50, K: 50 },
    recommended_products: ['CAN', 'Urea', 'DAP'],
    created_at: '2024-06-08T14:00:00Z'
  }
]

export const mockPlantingCalendar = {
  crop: 'maize',
  variety: 'H614',
  planting_date: '2024-04-15',
  expected_harvest: '2024-08-15',
  weeks: [
    { week: 1, task: 'Land preparation', watch_for: 'Ensure proper seedbed', inputs_needed: 'Plow, harrow' },
    { week: 2, task: 'Planting', watch_for: 'Optimal soil moisture', inputs_needed: 'Seeds, fertilizer' },
    { week: 3, task: 'Germination check', watch_for: 'Uniform emergence', inputs_needed: 'None' },
    { week: 4, task: 'First weeding', watch_for: 'Weed competition', inputs_needed: 'Herbicide or manual' },
    { week: 5, task: 'First fertilizer application', watch_for: 'Nitrogen deficiency', inputs_needed: 'CAN fertilizer' },
    { week: 6, task: 'Pest monitoring', watch_for: 'Fall armyworm', inputs_needed: 'Pesticide if needed' },
    { week: 7, task: 'Second weeding', watch_for: 'Weed pressure', inputs_needed: 'Manual weeding' },
    { week: 8, task: 'Second fertilizer', watch_for: 'Nutrient deficiency', inputs_needed: 'Top dressing' },
    { week: 9, task: 'Tasseling stage', watch_for: 'Pollination issues', inputs_needed: 'None' },
    { week: 10, task: 'Disease monitoring', watch_for: 'Gray leaf spot', inputs_needed: 'Fungicide if needed' },
    { week: 11, task: 'Maturation monitoring', watch_for: 'Proper drying', inputs_needed: 'None' },
    { week: 12, task: 'Harvest preparation', watch_for: 'Moisture content', inputs_needed: 'None' }
  ]
}

export const mockSubscription = {
  plan: 'pro_monthly',
  plan_id: 'pro_monthly',
  is_active: true,
  expires_at: '2024-09-11T00:00:00Z',
  days_remaining: 92,
  features: {
    weather_forecast: true,
    weather_days: 7,
    crop_advisory: true,
    market_prices: true,
    sms_alerts: true,
    sms_per_month: 999,
    disease_risk: true,
    planting_calendar: true,
    profitability_calc: true
  },
  features_list: [
    '7-day weather forecast',
    'Personalized crop advisory',
    'Real-time market prices',
    'Unlimited SMS alerts',
    'Disease & pest risk alerts',
    'Interactive planting calendar',
    'Profitability calculator'
  ],
  payment_method: 'mpesa',
  auto_renew: true
}

export const mockPlans = [
  {
    plan_id: 'free',
    name: 'Free',
    price: 0,
    billing_cycle: 'monthly',
    currency: 'KES',
    features: {
      weather_forecast: true,
      weather_days: 3,
      crop_advisory: false,
      market_prices: true,
      sms_alerts: false,
      sms_per_month: 0,
      disease_risk: false,
      planting_calendar: false,
      profitability_calc: false
    },
    features_list: [
      '3-day weather forecast',
      'Basic market prices'
    ],
    popular: false
  },
  {
    plan_id: 'basic_monthly',
    name: 'Basic Monthly',
    price: 99,
    billing_cycle: 'monthly',
    currency: 'KES',
    features: {
      weather_forecast: true,
      weather_days: 5,
      crop_advisory: true,
      market_prices: true,
      sms_alerts: true,
      sms_per_month: 20,
      disease_risk: true,
      planting_calendar: true,
      profitability_calc: false
    },
    features_list: [
      '5-day weather forecast',
      'Personalized crop advisory',
      'Real-time market prices',
      '20 SMS alerts per month',
      'Disease & pest risk alerts',
      'Interactive planting calendar'
    ],
    popular: true
  },
  {
    plan_id: 'pro_monthly',
    name: 'Pro Monthly',
    price: 299,
    billing_cycle: 'monthly',
    currency: 'KES',
    features: {
      weather_forecast: true,
      weather_days: 7,
      crop_advisory: true,
      market_prices: true,
      sms_alerts: true,
      sms_per_month: 999,
      disease_risk: true,
      planting_calendar: true,
      profitability_calc: true
    },
    features_list: [
      '7-day weather forecast',
      'Personalized crop advisory',
      'Real-time market prices',
      'Unlimited SMS alerts',
      'Disease & pest risk alerts',
      'Interactive planting calendar',
      'Profitability calculator'
    ],
    popular: false
  },
  {
    plan_id: 'enterprise_yearly',
    name: 'Enterprise Yearly',
    price: 2999,
    billing_cycle: 'yearly',
    currency: 'KES',
    features: {
      weather_forecast: true,
      weather_days: 14,
      crop_advisory: true,
      market_prices: true,
      sms_alerts: true,
      sms_per_month: 999,
      disease_risk: true,
      planting_calendar: true,
      profitability_calc: true,
      multi_farm: true,
      priority_support: true,
      api_access: true
    },
    features_list: [
      '14-day weather forecast',
      'Personalized crop advisory',
      'Real-time market prices',
      'Unlimited SMS alerts',
      'Disease & pest risk alerts',
      'Interactive planting calendar',
      'Profitability calculator',
      'Multi-farm management',
      'Priority support',
      'API access'
    ],
    popular: false
  }
]

export const mockFinancialDashboard = {
  income_ksh: 125000,
  expenses_ksh: 45000,
  net_profit_ksh: 80000,
  active_loans_count: 2,
  total_outstanding_ksh: 150000,
  active_policies_count: 1,
  period: '2024-06',
  currency: 'KES'
}

export const mockTransactions = [
  {
    id: 'tx-001',
    transaction_type: 'income',
    amount_ksh: 45000,
    description: 'Maize sale - 1500kg @ KSH 30/kg',
    category: 'crop_sale',
    transaction_date: '2024-06-10',
    farm_id: 'farm-001',
    crop_id: 'crop-001'
  },
  {
    id: 'tx-002',
    transaction_type: 'expense',
    amount_ksh: 15000,
    description: 'Fertilizer purchase - CAN 5 bags',
    category: 'inputs',
    transaction_date: '2024-06-08',
    farm_id: 'farm-001'
  },
  {
    id: 'tx-003',
    transaction_type: 'expense',
    amount_ksh: 8000,
    description: 'Labor payment - planting season',
    category: 'labor',
    transaction_date: '2024-06-05',
    farm_id: 'farm-001'
  },
  {
    id: 'tx-004',
    transaction_type: 'income',
    amount_ksh: 80000,
    description: 'Beans sale - 1000kg @ KSH 80/kg',
    category: 'crop_sale',
    transaction_date: '2024-06-01',
    farm_id: 'farm-001',
    crop_id: 'crop-002'
  }
]

export const mockLoans = [
  {
    id: 'loan-001',
    lender_name: 'Agricultural Finance Corporation',
    lender_type: 'government',
    principal_ksh: 100000,
    outstanding_ksh: 75000,
    repayment_percent: 25.0,
    status: 'active',
    is_overdue: false,
    interest_rate: 8.5,
    due_date: '2024-12-31',
    disbursement_date: '2024-01-15'
  },
  {
    id: 'loan-002',
    lender_name: 'Equity Bank',
    lender_type: 'commercial',
    principal_ksh: 75000,
    outstanding_ksh: 75000,
    repayment_percent: 0.0,
    status: 'pending',
    is_overdue: false,
    interest_rate: 12.0,
    due_date: '2025-06-30',
    disbursement_date: '2024-06-01'
  }
]

export const mockInsurance = [
  {
    id: 'ins-001',
    provider_name: 'APA Insurance',
    insurance_type: 'crop_insurance',
    coverage_amount_ksh: 500000,
    premium_ksh: 15000,
    status: 'active',
    days_to_expiry: 180,
    policy_number: 'APA-2024-001234',
    start_date: '2024-01-01',
    expiry_date: '2024-12-31',
    covered_crops: ['maize', 'beans']
  }
]

export const mockBudgets = [
  {
    id: 'budget-001',
    season_name: 'Long Rains 2024',
    crop_name: 'maize',
    planned_total_cost: 45000,
    planned_profit: 80000,
    actual_cost: 42000,
    actual_profit: 75000,
    status: 'in_progress'
  },
  {
    id: 'budget-002',
    season_name: 'Long Rains 2024',
    crop_name: 'beans',
    planned_total_cost: 25000,
    planned_profit: 45000,
    actual_cost: 23000,
    actual_profit: 42000,
    status: 'in_progress'
  }
]

export const mockCalendarEntries = [
  {
    id: 'cal-001',
    crop_name: 'maize',
    crop_type: 'maize',
    variety: 'H614',
    planned_planting_date: '2024-04-15',
    planned_harvest_date: '2024-08-15',
    actual_planting_date: '2024-04-15',
    status: 'growing',
    area_acres: 2.5,
    notes: 'Main season planting'
  },
  {
    id: 'cal-002',
    crop_name: 'beans',
    crop_type: 'beans',
    variety: 'KAT X69',
    planned_planting_date: '2024-05-01',
    planned_harvest_date: '2024-07-15',
    actual_planting_date: '2024-05-01',
    status: 'growing',
    area_acres: 1.5,
    notes: 'Intercropped with maize'
  },
  {
    id: 'cal-003',
    crop_name: 'wheat',
    crop_type: 'wheat',
    variety: 'Duma',
    planned_planting_date: '2024-09-01',
    planned_harvest_date: '2024-12-15',
    actual_planting_date: null,
    status: 'planned',
    area_acres: 3.0,
    notes: 'Short rains season'
  }
]

export const mockProfitability = {
  crop: 'maize',
  quantity_kg: 5000,
  yield_per_acre: 20,
  acres: 5,
  county: 'nakuru',
  results: {
    total_revenue: 160000,
    total_costs: 50000,
    net_profit: 110000,
    profit_margin: 68.75,
    profit_per_acre: 22000,
    cost_breakdown: {
      seeds: 5000,
      fertilizer: 15000,
      labor: 15000,
      pesticides: 5000,
      irrigation: 5000,
      other: 5000
    }
  }
}

// Combined mock data for easy import
export const mockFarmerDashboardData = {
  profile: mockFarmerProfile,
  farms: mockFarms,
  crops: mockCrops,
  weather: mockWeatherData,
  marketPrices: mockMarketPrices,
  marketTrends: mockMarketTrends,
  advisories: mockAdvisories,
  plantingCalendar: mockPlantingCalendar,
  subscription: mockSubscription,
  plans: mockPlans,
  financials: mockFinancialDashboard,
  transactions: mockTransactions,
  loans: mockLoans,
  insurance: mockInsurance,
  budgets: mockBudgets,
  calendarEntries: mockCalendarEntries,
  profitability: mockProfitability
}
