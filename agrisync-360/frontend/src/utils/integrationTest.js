/**
 * AgriSync 360 — Frontend Integration Tests
 * Run from browser console: window.runTests()
 */

const BASE = '/api'
const RESULTS = []

async function test(name, fn) {
  try {
    const start = Date.now()
    await fn()
    const ms = Date.now() - start
    RESULTS.push({ name, passed: true, ms })
    console.log(`✅ ${name} (${ms}ms)`)
    return true
  } catch (err) {
    RESULTS.push({ name, passed: false, error: err.message })
    console.error(`❌ ${name}: ${err.message}`)
    return false
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function api(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  
  const resp = await fetch(`${BASE}${url}`, { ...options, headers })
  const data = await resp.json()
  return { status: resp.status, data }
}

window.runTests = async function() {
  console.log('\n=== AgriSync 360 Integration Tests ===\n')
  RESULTS.length = 0

  // Health
  await test('Backend health check', async () => {
    const { data } = await api('/health')
    assert(data.success === true, 'Health check failed')
    assert(data.data.checks.database === 'ok', 'Database not connected')
    assert(data.data.checks.redis === 'ok', 'Redis not connected')
  })

  // Auth registration
  let otp = null
  const testPhone = '0799' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  
  await test('User registration', async () => {
    const { status, data } = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        phone: testPhone,
        password: 'TestPass1!',
        role: 'farmer'
      })
    })
    assert(status === 201 || status === 200 || status === 409,
      `Registration failed: ${status}`)
    if (data.data?.otp) otp = data.data.otp
  })

  await test('OTP verification', async () => {
    if (!otp) return // Skip if already existed
    const { status, data } = await api('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: testPhone, otp: String(otp) })
    })
    assert(status === 200, `OTP verify failed: ${status}`)
    assert(data.data?.access_token, 'No token returned')
    localStorage.setItem('access_token', data.data.access_token)
    localStorage.setItem('refresh_token', data.data.refresh_token)
  })

  await test('Login with credentials', async () => {
    const { status, data } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: testPhone, password: 'TestPass1!' })
    })
    assert(status === 200, `Login failed: ${status}`)
    if (data.data?.access_token) {
      localStorage.setItem('access_token', data.data.access_token)
    }
  })

  // Profile
  await test('Create farmer profile', async () => {
    const { status } = await api('/farmers/profile', {
      method: 'POST',
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'Integration',
        county: 'Nakuru',
        sub_county: 'Nakuru East'
      })
    })
    assert(status === 201 || status === 409, `Profile create: ${status}`)
  })

  await test('Get farmer profile', async () => {
    const { status, data } = await api('/farmers/profile')
    assert(status === 200, `Profile get: ${status}`)
    assert(data.data?.county, 'Profile missing county')
  })

  // Farm
  let farmId = null
  await test('Create farm with GPS', async () => {
    const { status, data } = await api('/farms/', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Integration Test Farm',
        latitude: -0.3031,
        longitude: 36.0800,
        county: 'Nakuru',
        size_acres: 2.5,
        soil_type: 'loam',
        water_source: 'rain'
      })
    })
    assert(status === 201 || status === 200, `Farm create: ${status}`)
    farmId = data.data?.id
  })

  await test('Add maize crop', async () => {
    if (!farmId) return
    const { status, data } = await api(`/farms/${farmId}/crops`, {
      method: 'POST',
      body: JSON.stringify({
        crop_name: 'maize',
        planting_date: '2026-03-01',
        area_planted_acres: 2.0,
        variety: 'H614D'
      })
    })
    assert(status === 201 || status === 200, `Crop add: ${status}`)
    assert(data.data?.growth_stage, 'No growth stage returned')
  })

  // Weather
  await test('Weather forecast (Nairobi)', async () => {
    const { status, data } = await api(
      '/weather/forecast?lat=-1.2921&lon=36.8219'
    )
    assert(status === 200, `Weather: ${status}`)
    assert(data.data?.forecast?.length === 7, 
      `Expected 7 days, got ${data.data?.forecast?.length}`)
    assert('disease_risk' in (data.data?.forecast?.[0] || {}),
      'Missing disease_risk')
  })

  await test('Weather for farm location (Nakuru)', async () => {
    const { status, data } = await api(
      '/weather/forecast?lat=-0.3031&lon=36.0800'
    )
    assert(status === 200, `Nakuru weather: ${status}`)
  })

  // Advisory
  await test('Maize advisory loaded', async () => {
    const { status, data } = await api('/advisory/crop/maize')
    assert(status === 200, `Advisory: ${status}`)
    assert(Array.isArray(data.data), 'Advisory not array')
    assert(data.data.length > 0, 'No advisories returned')
  })

  await test('Planting calendar', async () => {
    const { status, data } = await api(
      '/advisory/calendar/maize?planting_date=2026-03-01'
    )
    assert(status === 200, `Calendar: ${status}`)
  })

  // Market
  await test('Market prices', async () => {
    const { status, data } = await api('/market/prices')
    assert(status === 200, `Market: ${status}`)
  })

  await test('Maize price history', async () => {
    const { status } = await api('/market/history?crop=maize&months=3')
    assert(status === 200, `History: ${status}`)
  })

  await test('Profitability calculator', async () => {
    const { status, data } = await api(
      '/market/profitability?crop=maize&acres=2'
    )
    assert(status === 200 || status === 402, `Profit: ${status}`)
  })

  // Payments
  await test('Subscription plans', async () => {
    const { status, data } = await api('/payments/plans')
    assert(status === 200, `Plans: ${status}`)
    const plans = data.data || []
    const basic = plans.find(p => p.plan_id === 'basic_monthly')
    const pro = plans.find(p => p.plan_id === 'pro_monthly')
    assert(basic?.price_ksh === 99, `Basic price: ${basic?.price_ksh}`)
    assert(pro?.price_ksh === 299, `Pro price: ${pro?.price_ksh}`)
  })

  await test('Subscription status', async () => {
    const { status } = await api('/payments/subscription')
    assert(status === 200, `Subscription: ${status}`)
  })

  await test('M-Pesa callback endpoint', async () => {
    const { status } = await api('/payments/mpesa/callback', {
      method: 'POST',
      body: JSON.stringify({
        Body: {
          stkCallback: {
            ResultCode: 1,
            CheckoutRequestID: 'integration-test-001',
            ResultDesc: 'Test'
          }
        }
      })
    })
    assert(status === 200, `Callback: ${status}`)
  })

  // USSD
  await test('USSD main menu', async () => {
    const resp = await fetch('/api/ussd/test?text=')
    const data = await resp.json()
    assert(data.response?.startsWith('CON'), 
      `USSD main: ${data.response?.slice(0, 50)}`)
  })

  await test('USSD weather forecast', async () => {
    const resp = await fetch('/api/ussd/test?text=1*1')
    const data = await resp.json()
    assert(data.response?.startsWith('END'),
      `USSD weather: ${data.response?.slice(0, 50)}`)
    assert(data.length <= 182, `USSD too long: ${data.length}`)
  })

  await test('USSD market prices', async () => {
    const resp = await fetch('/api/ussd/test?text=3*1')
    const data = await resp.json()
    assert(data.response?.startsWith('END'),
      `USSD market: ${data.response?.slice(0, 50)}`)
  })

  await test('USSD subscribe menu', async () => {
    const resp = await fetch('/api/ussd/test?text=5')
    const data = await resp.json()
    assert(data.response?.startsWith('CON'),
      `USSD subscribe: ${data.response?.slice(0, 50)}`)
    assert(data.response?.includes('99'), 'Missing KSH 99')
    assert(data.response?.includes('299'), 'Missing KSH 299')
  })

  // Summary
  const total = RESULTS.length
  const passed = RESULTS.filter(r => r.passed).length
  const failed = total - passed
  const pct = Math.round((passed / total) * 100)

  console.log('\n=== RESULTS ===')
  console.log(`✅ Passed: ${passed}/${total} (${pct}%)`)
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`)
    RESULTS.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
  }
  console.log(`\nScore: ${pct}%`)

  if (pct === 100) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED!')
  }

  return { passed, total, pct }
}

console.log('[AgriSync] Integration tests loaded. Run: window.runTests()')
