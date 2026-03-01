import type { Parameters, ScenarioResult, StrengthCurvePoint, ClimateContext } from '@/types'
import { REGIONS } from './constants'
import { getCycleTimeClimateFactor, getClimateStrengthMultiplier } from './climateEngine'
import { computeCostBreakdown as computeCostBreakdownExt } from './costEngine'
import { computeRiskScore, riskLevelFromScore } from './riskEngine'
import { getStrengthCurveWithConfidence } from './strengthPredictionEngine'

/**
 * Deterministic cycle-time and cost simulation for precast yards.
 * Optional climate context enables dynamic recalculation (climate intelligence).
 */

const STRIP_RESET_HOURS: Record<string, number> = {
  manual: 4,
  semi: 2.5,
  full: 1.5,
}

const BASE_MATERIAL_COST_PER_M3 = 4200
const STEAM_COST_PER_HOUR = 180
const HEATED_ENCLOSURE_PER_HOUR = 120
const LABOUR_COST_PER_HOUR = 350
const AMORTIZATION_PER_BED_PER_DAY = 120

function getRegionTempAvg(regionId: string): number {
  const r = REGIONS.find((x) => x.id === regionId)
  if (!r) return 28
  return (r.temp_range[0] + r.temp_range[1]) / 2
}

/**
 * Simplified maturity-inspired strength gain: strength(t) ~ k * (1 - exp(-t/tau))
 * tau and k depend on cement and curing. Returns hours to reach targetStrength.
 */
function hoursToDemouldStrength(
  cementType: string,
  curingMethod: string,
  _curingHours: number,
  targetStrength: number,
  ambientTemp: number
): number {
  const targetMpa = targetStrength || 20
  let effectiveRate = 1
  if (cementType === 'OPC_53') effectiveRate *= 1.2
  if (cementType === 'PPC' || cementType === 'PSC') effectiveRate *= 0.9
  if (curingMethod === 'steam') effectiveRate *= 1.5
  if (curingMethod === 'heated_enclosure') effectiveRate *= 1.35
  const tempFactor = 0.8 + (ambientTemp / 50) * 0.4
  effectiveRate *= tempFactor
  const tau = 8 / effectiveRate
  const k = 50
  let t = 0
  let step = 0.5
  while (t < 168) {
    const s = k * (1 - Math.exp(-t / tau))
    if (s >= targetMpa) return Math.ceil(t * 10) / 10
    t += step
  }
  return 24
}

export function runSimulation(
  params: Parameters,
  scenarioId: string,
  name: string,
  climateContext?: ClimateContext | null
): ScenarioResult {
  const ambientTemp = climateContext?.temp ?? getRegionTempAvg(params.region)
  const demouldHours = hoursToDemouldStrength(
    params.cement_type,
    params.curing_method,
    params.curing_hours,
    20,
    ambientTemp
  )
  const stripReset = STRIP_RESET_HOURS[params.automation_level] ?? 3
  let rawCycle = demouldHours + stripReset
  if (climateContext) {
    const factor = getCycleTimeClimateFactor(climateContext)
    rawCycle *= factor
  }
  const cycle_time_hours = Math.round(rawCycle * 10) / 10

  const useExtendedCost = true
  let cost_per_element_inr: number
  let breakdown: ScenarioResult['breakdown']

  if (useExtendedCost) {
    const ext = computeCostBreakdownExt(params, cycle_time_hours, demouldHours)
    cost_per_element_inr = ext.total
    breakdown = {
      material: ext.material,
      curing: ext.curing,
      labour: ext.labour,
      amortization: ext.amortization,
      ...(ext.automation_capex != null && { automation_capex: ext.automation_capex }),
      ...(ext.land_yard != null && { land_yard: ext.land_yard }),
      ...(ext.delay_penalties != null && { delay_penalties: ext.delay_penalties }),
    }
  } else {
    const materialCost = BASE_MATERIAL_COST_PER_M3 * (params.mix_strength_mpa / 40) * 1.1
    let curingCost = 0
    if (params.curing_method === 'steam') curingCost = params.curing_hours * STEAM_COST_PER_HOUR
    if (params.curing_method === 'heated_enclosure') curingCost = params.curing_hours * HEATED_ENCLOSURE_PER_HOUR
    const labourCost = cycle_time_hours * LABOUR_COST_PER_HOUR * (params.automation_level === 'manual' ? 1.2 : params.automation_level === 'semi' ? 0.85 : 0.6)
    const amortization = (AMORTIZATION_PER_BED_PER_DAY * params.yard_beds) / Math.max(1, 24 / cycle_time_hours)
    cost_per_element_inr = Math.round(materialCost + curingCost + labourCost + amortization)
    breakdown = {
      material: Math.round(materialCost),
      curing: Math.round(curingCost),
      labour: Math.round(labourCost),
      amortization: Math.round(amortization),
    }
  }

  let risk_level: 'low' | 'medium' | 'high'
  const riskScore = computeRiskScore(params, climateContext ?? null, cycle_time_hours)
  risk_level = riskLevelFromScore(riskScore.overall)

  return {
    scenario_id: scenarioId,
    name,
    cycle_time_hours,
    cost_per_element_inr,
    risk_level,
    demould_strength_mpa: 20,
    breakdown,
  }
}

export function getStrengthCurve(params: Parameters, climateContext?: ClimateContext | null): StrengthCurvePoint[] {
  const ambientTemp = climateContext?.temp ?? getRegionTempAvg(params.region)
  const mult = climateContext ? getClimateStrengthMultiplier(climateContext) : 1
  return getStrengthCurveWithConfidence(params, ambientTemp, mult)
}

export function computeOptimizationScore(
  scenarios: ScenarioResult[],
  bestScenarioId: string
): number {
  if (scenarios.length === 0) return 0
  const best = scenarios.find((s) => s.scenario_id === bestScenarioId) ?? scenarios[0]
  const maxCycle = Math.max(...scenarios.map((s) => s.cycle_time_hours))
  const minCost = Math.min(...scenarios.map((s) => s.cost_per_element_inr))
  const cycleScore = maxCycle > 0 ? (1 - best.cycle_time_hours / maxCycle) * 40 : 40
  const costScore = minCost > 0 ? (1 - (best.cost_per_element_inr - minCost) / (Math.max(...scenarios.map((s) => s.cost_per_element_inr)) - minCost || 1)) * 30 : 30
  const riskScore = best.risk_level === 'low' ? 20 : best.risk_level === 'medium' ? 10 : 0
  const utilization = 24 / best.cycle_time_hours
  const utilScore = Math.min(10, utilization * 2.5)
  return Math.round(cycleScore + costScore + riskScore + utilScore)
}
