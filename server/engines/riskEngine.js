/**
 * Risk Intelligence System
 * Risk score, crack probability, weather volatility, automation failure risk.
 */

export function computeRiskScore(params, climate, cycleTimeHours) {
  const crack = crackProbability(params, climate)
  const weather = weatherVolatilityRisk(climate)
  const automation = automationFailureRisk(params.automation_level)
  const cycle = cycleTimeHours > 30 ? 0.4 : cycleTimeHours > 20 ? 0.2 : 0
  const overall =
    crack * 0.35 + weather * 0.25 + automation * 0.2 + cycle * 0.2
  return {
    overall: Math.min(1, Math.round(overall * 100) / 100),
    crack_probability: Math.round(crack * 100) / 100,
    weather_volatility: Math.round(weather * 100) / 100,
    automation_failure: Math.round(automation * 100) / 100,
    cycle_time_risk: Math.round(cycle * 100) / 100,
  }
}

function crackProbability(params, climate) {
  let p = 0.1
  if (params.curing_method === 'ambient') p += 0.2
  if (params.region === 'north_india' && (climate?.temp < 12 || climate?.temp > 38)) p += 0.15
  if (climate?.humidity > 90) p += 0.1
  if (params.mix_strength_mpa < 35) p += 0.1
  return Math.min(1, p)
}

function weatherVolatilityRisk(climate) {
  if (!climate) return 0.2
  const impact = (climate.climate_impact_score ?? 50) / 100
  return Math.min(1, impact * 1.2)
}

function automationFailureRisk(level) {
  return { manual: 0.05, semi: 0.15, full: 0.25 }[level] ?? 0.1
}

export function riskLevelFromScore(score) {
  if (score <= 0.33) return 'low'
  if (score <= 0.66) return 'medium'
  return 'high'
}
