/**
 * Multi-objective Optimization Engine
 * Pareto frontier, 100+ auto-generated scenarios, constraint-based optimization.
 */

import { getClimateContext, getCycleTimeClimateFactor } from './climateEngine.js'
import { computeCostBreakdown } from './costEngine.js'
import { computeRiskScore, riskLevelFromScore } from './riskEngine.js'
import { hoursToDemouldStrength } from './strengthEngine.js'

const STRIP_RESET_HOURS = { manual: 4, semi: 2.5, full: 1.5 }

const REGIONS = ['north_india', 'south_india', 'west_india', 'east_india', 'central_india']
const CEMENT_TYPES = ['OPC_53', 'OPC_43', 'PPC', 'PSC']
const CURING_METHODS = ['ambient', 'steam', 'heated_enclosure']
const AUTOMATION_LEVELS = ['manual', 'semi', 'full']

function* parameterCombinations(count = 120) {
  const mixStrengths = [30, 35, 40, 45, 50, 55]
  const curingHours = [6, 8, 10, 12, 14, 16, 18, 20]
  let n = 0
  for (const region of REGIONS) {
    for (const cement of CEMENT_TYPES) {
      for (const curing of CURING_METHODS) {
        for (const automation of AUTOMATION_LEVELS) {
          if (n >= count) return
          const curing_hours = curingHours[n % curingHours.length]
          const mix_strength_mpa = mixStrengths[n % mixStrengths.length]
          yield {
            region,
            project_type: 'infrastructure',
            cement_type: cement,
            mix_strength_mpa,
            curing_method: curing,
            curing_hours,
            automation_level: automation,
            yard_beds: 12 + (n % 5) * 6,
            element_types: ['beam', 'slab'],
          }
          n++
        }
      }
    }
  }
  while (n < count) {
    yield {
      region: REGIONS[n % REGIONS.length],
      project_type: 'infrastructure',
      cement_type: CEMENT_TYPES[n % CEMENT_TYPES.length],
      mix_strength_mpa: mixStrengths[n % mixStrengths.length],
      curing_method: CURING_METHODS[n % CURING_METHODS.length],
      curing_hours: curingHours[n % curingHours.length],
      automation_level: AUTOMATION_LEVELS[n % AUTOMATION_LEVELS.length],
      yard_beds: 18,
      element_types: ['beam', 'slab'],
    }
    n++
  }
}

function runOne(params, climateContext) {
  const ambientTemp = climateContext.temp
  const climateFactor = getCycleTimeClimateFactor(climateContext)
  const demouldHours = hoursToDemouldStrength(params, 20, ambientTemp, 1)
  const stripReset = STRIP_RESET_HOURS[params.automation_level] ?? 3
  const rawCycle = demouldHours + stripReset
  const cycle_time_hours = Math.round(rawCycle * climateFactor * 10) / 10

  const breakdown = computeCostBreakdown(params, cycle_time_hours, demouldHours)
  const cost_per_element_inr = breakdown.total
  const risk = computeRiskScore(params, climateContext, cycle_time_hours)
  const risk_level = riskLevelFromScore(risk.overall)

  return {
    params: { ...params },
    cycle_time_hours,
    cost_per_element_inr,
    risk_level,
    risk_score: risk.overall,
    breakdown,
  }
}

function isDominated(a, b, objective) {
  if (objective === 'minimize_cost') return b.cost_per_element_inr < a.cost_per_element_inr
  if (objective === 'minimize_time') return b.cycle_time_hours < a.cycle_time_hours
  if (objective === 'minimize_risk') return b.risk_score < a.risk_score
  return false
}

function paretoFrontier(results) {
  const frontier = new Set()
  for (let i = 0; i < results.length; i++) {
    let dominated = false
    for (let j = 0; j < results.length; j++) {
      if (i === j) continue
      const a = results[i]
      const b = results[j]
      const costWorse = b.cost_per_element_inr <= a.cost_per_element_inr
      const timeWorse = b.cycle_time_hours <= a.cycle_time_hours
      const riskWorse = b.risk_score <= a.risk_score
      const strictlyBetter =
        (b.cost_per_element_inr < a.cost_per_element_inr) ||
        (b.cycle_time_hours < a.cycle_time_hours) ||
        (b.risk_score < a.risk_score)
      if (costWorse && timeWorse && riskWorse && strictlyBetter) {
        dominated = true
        break
      }
    }
    if (!dominated) frontier.add(i)
  }
  return results.map((r, i) => ({ ...r, is_frontier: frontier.has(i) }))
}

export function runOptimization(options = {}) {
  const {
    regionId = 'north_india',
    objective = 'balanced',
    maxScenarios = 100,
    constraints = {},
    weather,
    season,
  } = options

  const climateContext = getClimateContext(regionId, { weather, season, useLiveWeather: !!weather })
  const scenarios = []
  const gen = parameterCombinations(Math.min(maxScenarios, 150))
  for (const params of gen) {
    if (constraints.max_risk && constraints.max_risk === 'low') {
      if (params.curing_method === 'ambient' && params.region !== 'south_india') continue
    }
    const result = runOne(params, climateContext)
    result.scenario_id = `opt_${scenarios.length}`
    result.name = `Combo ${scenarios.length + 1}`
    scenarios.push(result)
  }

  let sorted = [...scenarios]
  if (objective === 'minimize_cost') sorted.sort((a, b) => a.cost_per_element_inr - b.cost_per_element_inr)
  else if (objective === 'minimize_time') sorted.sort((a, b) => a.cycle_time_hours - b.cycle_time_hours)
  else if (objective === 'minimize_risk') sorted.sort((a, b) => a.risk_score - b.risk_score)
  else sorted = paretoFrontier(scenarios)

  const frontier = sorted.filter((s) => s.is_frontier !== false)
  const withFrontier = paretoFrontier(sorted)
  return {
    scenarios: withFrontier.map((s, i) => ({
      scenario_id: s.scenario_id,
      name: s.name,
      cycle_time_hours: s.cycle_time_hours,
      cost_per_element_inr: s.cost_per_element_inr,
      risk_level: s.risk_level,
      risk_score: s.risk_score,
      is_frontier: s.is_frontier,
      parameters: s.params,
      breakdown: s.breakdown,
    })),
    climate_context: climateContext,
    objective,
    total_generated: scenarios.length,
  }
}
