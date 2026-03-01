const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function fetchRecommendation(scenarioSummary: Record<string, { cycle_time_hours: number; cost_per_element_inr: number; risk_level: string }>, constraints?: { max_risk?: string; prefer?: string }, region?: string) {
  const url = `${API_BASE}/recommend`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioSummary, constraints, region }),
  })
  const text = await res.text().catch(() => 'Recommendation failed')
  if (!res.ok) {
    let msg = text
    try {
      const json = JSON.parse(text)
      if (json.error) msg = json.error
    } catch {
      /* use text as-is */
    }
    throw new Error(msg || `Request failed (${res.status})`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid response from server')
  }
}

export async function fetchExplain(
  strategyId: string,
  scenarioSummary: Record<string, unknown>,
  parameters: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId, scenarioSummary, parameters }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Explain failed'))
  return res.json()
}

export async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`)
  if (!res.ok) throw new Error(await res.text().catch(() => 'Weather failed'))
  return res.json()
}

export async function fetchRegions() {
  const res = await fetch(`${API_BASE}/regions`)
  if (!res.ok) throw new Error(await res.text().catch(() => 'Regions failed'))
  return res.json()
}

export async function fetchClimateContext(regionId: string, options?: { weather?: Record<string, unknown>; season?: string; useLiveWeather?: boolean }) {
  const res = await fetch(`${API_BASE}/climate/context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionId, ...options }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Climate failed'))
  return res.json()
}

export async function fetchOptimize(params: {
  regionId?: string
  objective?: string
  maxScenarios?: number
  constraints?: Record<string, string>
  weather?: Record<string, unknown>
  season?: string
}) {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Optimize failed'))
  return res.json()
}

export async function fetchCost(params: Record<string, unknown>, cycleTimeHours: number, demouldHours: number) {
  const res = await fetch(`${API_BASE}/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params, cycle_time_hours: cycleTimeHours, demould_hours: demouldHours }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Cost failed'))
  return res.json()
}

export async function fetchRisk(params: Record<string, unknown>, climate?: Record<string, unknown>, cycleTimeHours?: number) {
  const res = await fetch(`${API_BASE}/risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params, climate, cycle_time_hours: cycleTimeHours }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Risk failed'))
  return res.json()
}

export async function fetchStrengthPredict(params: Record<string, unknown>, ambientTemp?: number, climateMultiplier?: number, hours?: number) {
  const res = await fetch(`${API_BASE}/strength-predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      params,
      ambient_temp: ambientTemp,
      climate_multiplier: climateMultiplier,
      hours,
    }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Strength predict failed'))
  return res.json()
}

export async function fetchKPIImpact(traditional: { cycle_time_hours: number; cost_per_element_inr: number }, optimized: { cycle_time_hours: number; cost_per_element_inr: number }) {
  const res = await fetch(`${API_BASE}/kpi-impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ traditional, optimized }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'KPI impact failed'))
  return res.json()
}

export async function fetchCopilotSuggest(scenarioSummary: Record<string, unknown>, region?: string, objective?: string) {
  const res = await fetch(`${API_BASE}/copilot/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioSummary, region, objective }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Copilot suggest failed'))
  return res.json()
}
