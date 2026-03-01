import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
import cors from 'cors'
import OpenAI from 'openai'
import { getClimateContext, getClimateStrengthMultiplier, getCycleTimeClimateFactor } from './engines/climateEngine.js'
import { runOptimization } from './engines/optimizationEngine.js'
import { computeCostBreakdown } from './engines/costEngine.js'
import { computeRiskScore, riskLevelFromScore } from './engines/riskEngine.js'
import {
  getStrengthCurveWithConfidence,
  hoursToDemouldStrength,
  demouldProbabilityAt,
  safeDemouldWindow,
} from './engines/strengthEngine.js'

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI(
  process.env.OPENAI_API_KEY ? { apiKey: process.env.OPENAI_API_KEY } : { apiKey: 'sk-placeholder' }
)

const REGIONS = [
  { id: 'north_india', label: 'North India', temp_range: [8, 42], humidity_range: [20, 80] },
  { id: 'south_india', label: 'South India', temp_range: [22, 38], humidity_range: [60, 95] },
  { id: 'west_india', label: 'West India', temp_range: [18, 40], humidity_range: [30, 85] },
  { id: 'east_india', label: 'East India', temp_range: [12, 38], humidity_range: [50, 95] },
  { id: 'central_india', label: 'Central India', temp_range: [10, 45], humidity_range: [25, 90] },
]

app.get('/api/regions', (_req, res) => {
  res.json(REGIONS)
})

app.post('/api/recommend', async (req, res) => {
  const { scenarioSummary, constraints = {}, region } = req.body || {}
  if (!scenarioSummary || typeof scenarioSummary !== 'object') {
    return res.status(400).json({ error: 'scenarioSummary required' })
  }

  const scenarioList = Object.entries(scenarioSummary).map(([id, data]) => ({
    id,
    ...data,
  }))

  const hasRealKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder'

  if (!hasRealKey) {
    const sorted = scenarioList.sort(
      (a, b) => a.cycle_time_hours - b.cycle_time_hours || a.cost_per_element_inr - b.cost_per_element_inr
    )
    const ranked = sorted.map((s, i) => ({
      rank: i + 1,
      strategy_id: s.id,
      cycle_time_hours: s.cycle_time_hours,
      cost_per_element_inr: s.cost_per_element_inr,
      risk_level: s.risk_level || 'low',
      summary: i === 0 ? 'Best balance of cycle time and cost (demo fallback).' : `Alternative ${i + 1}.`,
    }))
    return res.json({
      recommendation: {
        ranked_strategies: ranked,
        primary_reason: 'Recommendation is based on cycle time and cost (no API key; using fallback).',
        confidence: 0.7,
        caveats: ['Set OPENAI_API_KEY for AI-powered recommendations.'],
      },
      explanation: {
        factors: ['cycle_time_hours', 'cost_per_element_inr', 'risk_level'],
        trade_offs: 'Faster cycle often increases cost; lower cost may mean longer cycle.',
        climate_note: region ? `Region ${region} considered.` : undefined,
      },
    })
  }

  try {
    const prompt = `You are PRECYCLE's recommendation engine for precast yards in India. Given the scenario summary below, output a JSON object with:
- ranked_strategies: array of objects with rank (1-based), strategy_id, cycle_time_hours, cost_per_element_inr, risk_level, summary (short string). Copy cycle_time_hours, cost_per_element_inr, risk_level EXACTLY from the scenario summary for each strategy_id. Do not invent numbers.
- primary_reason: one sentence.
- confidence: number 0-1.
- caveats: optional array of strings.

Scenario summary (use these exact values):
${JSON.stringify(scenarioSummary, null, 2)}

Constraints: ${JSON.stringify(constraints)}
Region: ${region || 'Not specified'}

Output only valid JSON, no markdown.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    const text = completion.choices[0]?.message?.content?.trim() || '{}'
    let parsed = {}
    try {
      const cleaned = text.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { recommendation: { ranked_strategies: scenarioList.map((s, i) => ({ rank: i + 1, strategy_id: s.id, ...s, summary: 'See scenario.' })), primary_reason: 'Unable to parse AI response.', confidence: 0.5, caveats: [] }, explanation: {} }
    }
    // Ensure response has { recommendation: { ranked_strategies, primary_reason, ... } } for frontend
    if (!parsed.recommendation && (parsed.ranked_strategies || Array.isArray(parsed.ranked_strategies))) {
      parsed = { recommendation: parsed, explanation: parsed.explanation || {} }
    }
    if (!parsed.recommendation?.ranked_strategies?.length && scenarioList.length) {
      parsed.recommendation = {
        ranked_strategies: scenarioList.map((s, i) => ({ rank: i + 1, strategy_id: s.id, cycle_time_hours: s.cycle_time_hours, cost_per_element_inr: s.cost_per_element_inr, risk_level: s.risk_level || 'low', summary: 'See scenario.' })),
        primary_reason: parsed.recommendation?.primary_reason || 'Best balance of cycle time and cost.',
        confidence: parsed.recommendation?.confidence ?? 0.8,
        caveats: parsed.recommendation?.caveats || [],
      }
    }
    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Recommendation failed' })
  }
})

app.post('/api/copilot/suggest', async (req, res) => {
  const { scenarioSummary, region, objective } = req.body || {}
  const hasRealKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder'
  if (!hasRealKey) {
    return res.json({
      why_recommended: 'Set OPENAI_API_KEY for AI-powered suggestions.',
      impact_summary: 'Cycle time and cost depend on curing method, cement type, and automation.',
      suggested_changes: [{ parameter: 'curing_method', suggestion: 'Try steam for faster strength gain.', impact: 'Reduces cycle time.' }],
    })
  }
  try {
    const prompt = `You are PRECYCLE's AI Co-pilot for precast yards. Given scenario summary: ${JSON.stringify(scenarioSummary)}. Region: ${region || 'India'}. Objective: ${objective || 'balanced'}.
Output JSON: {
  "why_recommended": "1-2 sentences why the top strategy is best",
  "impact_summary": "How parameter changes affect cycle time, cost, risk",
  "suggested_changes": [{"parameter": "name", "suggestion": "text", "impact": "text"}]
}. Only valid JSON.`
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    const text = completion.choices[0]?.message?.content?.trim() || '{}'
    const cleaned = text.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      why_recommended: 'Unable to generate suggestion.',
      impact_summary: '',
      suggested_changes: [],
    })
  }
})

app.post('/api/explain', async (req, res) => {
  const { strategyId, scenarioSummary, parameters } = req.body || {}
  if (!strategyId) return res.status(400).json({ error: 'strategyId required' })

  const hasRealKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder'
  if (!hasRealKey) {
    return res.json({
      sections: [
        { heading: 'Why this strategy', body: 'Explanation requires OPENAI_API_KEY. In production, the AI explains trade-offs between curing, cement type, and automation.' },
        { heading: 'Main drivers', body: 'Cycle time is driven by strength gain (curing method and hours) and strip/reset time (automation level).' },
      ],
    })
  }

  try {
    const prompt = `Explain in 2-3 short sentences why this precast strategy is recommended. Strategy ID: ${strategyId}. Scenario summary: ${JSON.stringify(scenarioSummary)}. Parameters: ${JSON.stringify(parameters)}. Output JSON: { "sections": [ { "heading": "...", "body": "..." } ] }. Do not invent numbers.`
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    })
    const text = completion.choices[0]?.message?.content?.trim() || '{}'
    let parsed = { sections: [] }
    try {
      const cleaned = text.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { sections: [{ heading: 'Explanation', body: text || 'See recommendation.' }] }
    }
    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Explain failed' })
  }
})

async function fetchOpenMeteoWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`
    const r = await fetch(url)
    if (!r.ok) return null
    const data = await r.json()
    const c = data.current
    return {
      temp: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      rainfall_mm: c.precipitation ?? 0,
      wind_kmh: c.wind_speed_10m ?? 0,
      conditions: c.weather_code,
    }
  } catch {
    return null
  }
}

app.get('/api/weather', async (req, res) => {
  const lat = Number(req.query.lat) || 28.61
  const lon = Number(req.query.lon) || 77.21
  const useLive = req.query.live === '1' || req.query.live === 'true'
  const weather = useLive ? await fetchOpenMeteoWeather(lat, lon) : null
  if (weather) {
    const risk = weather.temp > 38 || weather.humidity > 90 ? 'medium' : 'low'
    return res.json({
      temp: weather.temp,
      humidity: weather.humidity,
      rainfall: weather.rainfall_mm,
      wind_kmh: weather.wind_kmh,
      conditions: weather.conditions,
      risk,
      source: 'open-meteo',
    })
  }
  res.json({
    temp: 32,
    humidity: 65,
    conditions: 'Clear',
    risk: 'low',
    rainfall: 0,
    wind_kmh: 5,
    source: 'mock',
  })
})

app.get('/api/climate', (req, res) => {
  const regionId = req.query.region || 'north_india'
  const season = req.query.season || undefined
  const context = getClimateContext(regionId, { season })
  res.json(context)
})

app.post('/api/climate/context', (req, res) => {
  const { regionId, weather, season, useLiveWeather } = req.body || {}
  const context = getClimateContext(regionId || 'north_india', {
    weather,
    season,
    useLiveWeather: !!useLiveWeather,
  })
  res.json(context)
})

app.post('/api/optimize', (req, res) => {
  try {
    const { regionId, objective, maxScenarios, constraints, weather, season } = req.body || {}
    const result = runOptimization({
      regionId: regionId || 'north_india',
      objective: objective || 'balanced',
      maxScenarios: Math.min(Number(maxScenarios) || 100, 150),
      constraints: constraints || {},
      weather,
      season,
    })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Optimization failed' })
  }
})

app.post('/api/cost', (req, res) => {
  try {
    const { params, cycle_time_hours, demould_hours } = req.body || {}
    if (!params) return res.status(400).json({ error: 'params required' })
    const cycle = cycle_time_hours ?? 24
    const demould = demould_hours ?? 20
    const breakdown = computeCostBreakdown(params, cycle, demould)
    res.json(breakdown)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Cost calculation failed' })
  }
})

app.post('/api/risk', (req, res) => {
  try {
    const { params, climate, cycle_time_hours } = req.body || {}
    if (!params) return res.status(400).json({ error: 'params required' })
    const climateContext = climate || getClimateContext(params.region)
    const cycle = cycle_time_hours ?? 24
    const risk = computeRiskScore(params, climateContext, cycle)
    res.json({
      ...risk,
      risk_level: riskLevelFromScore(risk.overall),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Risk calculation failed' })
  }
})

app.post('/api/strength-predict', (req, res) => {
  try {
    const { params, ambient_temp, climate_multiplier, hours } = req.body || {}
    if (!params) return res.status(400).json({ error: 'params required' })
    const temp = ambient_temp ?? 28
    const mult = climate_multiplier ?? 1
    const curve = getStrengthCurveWithConfidence(params, temp, mult)
    const safeHours = safeDemouldWindow(params, temp, mult)
    const demouldProb = hours != null ? demouldProbabilityAt(params, hours, temp, mult) : demouldProbabilityAt(params, safeHours, temp, mult)
    res.json({
      curve,
      safe_demould_hours: safeHours,
      demould_probability: Math.round(demouldProb * 100) / 100,
      hours_to_20mpa: hoursToDemouldStrength(params, 20, temp, mult),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Strength prediction failed' })
  }
})

app.post('/api/kpi-impact', (req, res) => {
  try {
    const { traditional, optimized } = req.body || {}
    if (!traditional || !optimized) return res.status(400).json({ error: 'traditional and optimized required' })
    const cycleRed = traditional.cycle_time_hours > 0
      ? ((traditional.cycle_time_hours - optimized.cycle_time_hours) / traditional.cycle_time_hours) * 100
      : 0
    const costSav = traditional.cost_per_element_inr > 0
      ? ((traditional.cost_per_element_inr - optimized.cost_per_element_inr) / traditional.cost_per_element_inr) * 100
      : 0
    const throughputInc = optimized.cycle_time_hours > 0 && traditional.cycle_time_hours > 0
      ? ((24 / optimized.cycle_time_hours) / (24 / traditional.cycle_time_hours) - 1) * 100
      : 0
    res.json({
      cycle_time_reduction_pct: Math.round(cycleRed * 10) / 10,
      cost_savings_pct: Math.round(costSav * 10) / 10,
      throughput_increase_pct: Math.round(throughputInc * 10) / 10,
      yard_size_reduction_pct: 0,
      energy_savings_pct: Math.round(costSav * 0.15),
      co2_savings_pct: Math.round(costSav * 0.08),
      traditional_cycle_hours: traditional.cycle_time_hours,
      optimized_cycle_hours: optimized.cycle_time_hours,
      traditional_cost: traditional.cost_per_element_inr,
      optimized_cost: optimized.cost_per_element_inr,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'KPI impact failed' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`PRECYCLE API running at http://localhost:${PORT}`)
})
