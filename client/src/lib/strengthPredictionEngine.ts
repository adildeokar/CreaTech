/**
 * Client-side Strength Prediction (temperature-adjusted, confidence intervals).
 */

import type { Parameters, StrengthCurvePoint, StrengthPrediction } from '@/types'

function effectiveRate(params: Parameters, ambientTemp: number): number {
  let r = 1
  if (params.cement_type === 'OPC_53') r *= 1.2
  if (params.cement_type === 'PPC' || params.cement_type === 'PSC') r *= 0.9
  if (params.curing_method === 'steam') r *= 1.5
  if (params.curing_method === 'heated_enclosure') r *= 1.35
  const tempFactor = 0.8 + (ambientTemp / 50) * 0.4
  r *= tempFactor
  return r
}

export function getStrengthCurveWithConfidence(
  params: Parameters,
  ambientTemp: number,
  climateMultiplier = 1
): StrengthCurvePoint[] {
  const rate = effectiveRate(params, ambientTemp) * climateMultiplier
  const tau = 8 / rate
  const k = (params.mix_strength_mpa || 40) * 1.15
  const points: StrengthCurvePoint[] = []
  for (let t = 0; t <= 48; t += 1) {
    const s = k * (1 - Math.exp(-t / tau))
    points.push({ hours: t, strength_mpa: Math.round(s * 10) / 10 })
  }
  return points
}

export function hoursToDemouldStrengthClient(
  params: Parameters,
  targetMpa: number,
  ambientTemp: number,
  climateMultiplier = 1
): number {
  const rate = effectiveRate(params, ambientTemp) * climateMultiplier
  const tau = 8 / rate
  const k = (params.mix_strength_mpa || 40) * 1.15
  let t = 0
  const step = 0.25
  while (t < 168) {
    const s = k * (1 - Math.exp(-t / tau))
    if (s >= targetMpa) return Math.ceil(t * 10) / 10
    t += step
  }
  return 24
}

export function demouldProbabilityAt(
  params: Parameters,
  hours: number,
  ambientTemp: number,
  climateMultiplier = 1
): number {
  const rate = effectiveRate(params, ambientTemp) * climateMultiplier
  const tau = 8 / rate
  const k = (params.mix_strength_mpa || 40) * 1.15
  const target = 20
  const s = k * (1 - Math.exp(-hours / tau))
  const sigma = 0.08 * s
  if (s >= target + 2 * sigma) return 0.98
  if (s >= target) return 0.5 + ((s - target) / (2 * sigma)) * 0.48
  return Math.max(0, 0.5 * (s / target))
}

export function safeDemouldWindow(
  params: Parameters,
  ambientTemp: number,
  climateMultiplier = 1
): number {
  let h = 0
  const step = 0.5
  while (h < 72) {
    if (demouldProbabilityAt(params, h, ambientTemp, climateMultiplier) >= 0.95) return h
    h += step
  }
  return 24
}

export function getStrengthPrediction(
  params: Parameters,
  ambientTemp: number,
  climateMultiplier = 1
): StrengthPrediction {
  const curve = getStrengthCurveWithConfidence(params, ambientTemp, climateMultiplier)
  const safeHours = safeDemouldWindow(params, ambientTemp, climateMultiplier)
  const demouldProb = demouldProbabilityAt(params, safeHours, ambientTemp, climateMultiplier)
  const atSafe = curve.find((p) => p.hours >= safeHours) || curve[curve.length - 1]
  return {
    strength_mpa: atSafe?.strength_mpa ?? 20,
    confidence_low: (atSafe?.strength_mpa ?? 20) * 0.92,
    confidence_high: (atSafe?.strength_mpa ?? 20) * 1.08,
    demould_probability: Math.round(demouldProb * 100) / 100,
    safe_demould_hours: safeHours,
    curve,
  }
}
