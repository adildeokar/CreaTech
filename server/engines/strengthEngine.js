/**
 * AI-Based Strength Prediction Engine
 * Temperature-adjusted hydration curve, confidence intervals, demould probability.
 */

function effectiveRate(params, ambientTemp) {
  let r = 1
  if (params.cement_type === 'OPC_53') r *= 1.2
  if (params.cement_type === 'PPC' || params.cement_type === 'PSC') r *= 0.9
  if (params.curing_method === 'steam') r *= 1.5
  if (params.curing_method === 'heated_enclosure') r *= 1.35
  const tempFactor = 0.8 + (ambientTemp / 50) * 0.4
  r *= tempFactor
  return r
}

export function getStrengthCurveWithConfidence(params, ambientTemp, climateMultiplier = 1) {
  const rate = effectiveRate(params, ambientTemp) * (climateMultiplier || 1)
  const tau = 8 / rate
  const k = (params.mix_strength_mpa || 40) * 1.15
  const points = []
  for (let t = 0; t <= 48; t += 1) {
    const s = k * (1 - Math.exp(-t / tau))
    const sigma = 0.08 * s
    points.push({
      hours: t,
      strength_mpa: Math.round(s * 10) / 10,
      confidence_low: Math.round((s - 1.96 * sigma) * 10) / 10,
      confidence_high: Math.round((s + 1.96 * sigma) * 10) / 10,
    })
  }
  return points
}

export function hoursToDemouldStrength(params, targetMpa, ambientTemp, climateMultiplier = 1) {
  const rate = effectiveRate(params, ambientTemp) * (climateMultiplier || 1)
  const tau = 8 / rate
  const k = (params.mix_strength_mpa || 40) * 1.15
  const target = targetMpa || 20
  let t = 0
  const step = 0.25
  while (t < 168) {
    const s = k * (1 - Math.exp(-t / tau))
    if (s >= target) return Math.ceil(t * 10) / 10
    t += step
  }
  return 24
}

/**
 * Demould probability at given hours (0–1)
 */
export function demouldProbabilityAt(params, hours, ambientTemp, climateMultiplier = 1) {
  const rate = effectiveRate(params, ambientTemp) * (climateMultiplier || 1)
  const tau = 8 / rate
  const k = (params.mix_strength_mpa || 40) * 1.15
  const target = 20
  const s = k * (1 - Math.exp(-hours / tau))
  const sigma = 0.08 * s
  if (s >= target + 2 * sigma) return 0.98
  if (s >= target) return 0.5 + (s - target) / (2 * sigma) * 0.48
  return Math.max(0, 0.5 * (s / target))
}

/**
 * Safe demould window: hours at which probability >= 0.95
 */
export function safeDemouldWindow(params, ambientTemp, climateMultiplier = 1) {
  let h = 0
  const step = 0.5
  while (h < 72) {
    if (demouldProbabilityAt(params, h, ambientTemp, climateMultiplier) >= 0.95) return h
    h += step
  }
  return 24
}
