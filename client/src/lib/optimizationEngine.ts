/**
 * Client-side Multi-objective Optimization (Pareto frontier, 100+ scenarios).
 */

import type { Parameters, OptimizationObjective, ParetoPoint, ScenarioResult } from '@/types'
import { runSimulation } from './simulationEngine'
import { getClimateContext } from './climateEngine'
import type { ClimateContext } from '@/types'
import { CEMENT_TYPES, CURING_METHODS, AUTOMATION_LEVELS } from './constants'

const MIX_STRENGTHS = [30, 35, 40, 45, 50, 55]
const CURING_HOURS_LIST = [6, 8, 10, 12, 14, 16, 18, 20]

function* parameterCombinations(count: number, regionId: string): Generator<Parameters> {
  const region = regionId as Parameters['region']
  const project_type = 'infrastructure' as const
  const element_types = ['beam', 'slab']
  let n = 0
  for (const cement of CEMENT_TYPES) {
    for (const curing of CURING_METHODS) {
      for (const automation of AUTOMATION_LEVELS) {
        if (n >= count) return
        const curing_hours = CURING_HOURS_LIST[n % CURING_HOURS_LIST.length]
        const mix_strength_mpa = MIX_STRENGTHS[n % MIX_STRENGTHS.length]
        yield {
          region,
          project_type,
          cement_type: cement.id as Parameters['cement_type'],
          mix_strength_mpa,
          curing_method: curing.id as Parameters['curing_method'],
          curing_hours,
          automation_level: automation.id as Parameters['automation_level'],
          yard_beds: 12 + (n % 5) * 6,
          element_types,
        }
        n++
      }
    }
  }
  while (n < count) {
    yield {
      region,
      project_type,
      cement_type: CEMENT_TYPES[n % CEMENT_TYPES.length].id as Parameters['cement_type'],
      mix_strength_mpa: MIX_STRENGTHS[n % MIX_STRENGTHS.length],
      curing_method: CURING_METHODS[n % CURING_METHODS.length].id as Parameters['curing_method'],
      curing_hours: CURING_HOURS_LIST[n % CURING_HOURS_LIST.length],
      automation_level: AUTOMATION_LEVELS[n % AUTOMATION_LEVELS.length].id as Parameters['automation_level'],
      yard_beds: 18,
      element_types,
    }
    n++
  }
}

function riskToScore(risk: string): number {
  return risk === 'low' ? 0.2 : risk === 'medium' ? 0.5 : 0.8
}

function paretoFrontier(results: (ScenarioResult & { parameters: Parameters; risk_score?: number })[]) {
  const withRisk = results.map((r) => ({
    ...r,
    risk_score: r.risk_score ?? riskToScore(r.risk_level),
  }))
  const frontier = new Set<number>()
  for (let i = 0; i < withRisk.length; i++) {
    let dominated = false
    for (let j = 0; j < withRisk.length; j++) {
      if (i === j) continue
      const a = withRisk[i]
      const b = withRisk[j]
      const cWorse = b.cost_per_element_inr <= a.cost_per_element_inr
      const tWorse = b.cycle_time_hours <= a.cycle_time_hours
      const rWorse = b.risk_score <= a.risk_score
      const strictlyBetter =
        b.cost_per_element_inr < a.cost_per_element_inr ||
        b.cycle_time_hours < a.cycle_time_hours ||
        (b.risk_score ?? 0) < (a.risk_score ?? 0)
      if (cWorse && tWorse && rWorse && strictlyBetter) {
        dominated = true
        break
      }
    }
    if (!dominated) frontier.add(i)
  }
  return withRisk.map((r, i) => ({ ...r, is_frontier: frontier.has(i) }))
}

export interface OptimizationResult {
  scenarios: ParetoPoint[]
  climate_context: ClimateContext
  objective: OptimizationObjective
  total_generated: number
}

export function runLocalOptimization(options: {
  regionId?: string
  objective?: OptimizationObjective
  maxScenarios?: number
  climateContext?: ClimateContext | null
}): OptimizationResult {
  const regionId = options.regionId ?? 'north_india'
  const objective = options.objective ?? 'balanced'
  const maxScenarios = Math.min(options.maxScenarios ?? 100, 150)
  const climateContext = options.climateContext ?? getClimateContext(regionId)

  const scenarios: (ScenarioResult & { parameters: Parameters; risk_score?: number })[] = []
  const gen = parameterCombinations(maxScenarios, regionId)
  for (const params of gen) {
    const id = `opt_${scenarios.length}`
    const name = `Combo ${scenarios.length + 1}`
    const result = runSimulation(params, id, name, climateContext)
    const riskScore = riskToScore(result.risk_level)
    scenarios.push({
      ...result,
      parameters: params,
      risk_score: riskScore,
    })
  }

  let sorted = [...scenarios]
  if (objective === 'minimize_cost') sorted.sort((a, b) => a.cost_per_element_inr - b.cost_per_element_inr)
  else if (objective === 'minimize_time') sorted.sort((a, b) => a.cycle_time_hours - b.cycle_time_hours)
  else if (objective === 'minimize_risk') sorted.sort((a, b) => (a.risk_score ?? 0) - (b.risk_score ?? 0))
  else sorted = paretoFrontier(scenarios)

  const asPareto: ParetoPoint[] = sorted.map((s) => ({
    scenario_id: s.scenario_id,
    name: s.name,
    cycle_time_hours: s.cycle_time_hours,
    cost_per_element_inr: s.cost_per_element_inr,
    risk_score: s.risk_score ?? riskToScore(s.risk_level),
    is_frontier: (s as { is_frontier?: boolean }).is_frontier ?? false,
    parameters: s.parameters,
  }))

  return {
    scenarios: asPareto,
    climate_context: climateContext,
    objective,
    total_generated: scenarios.length,
  }
}
