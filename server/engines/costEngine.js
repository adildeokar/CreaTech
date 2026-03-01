/**
 * Advanced Cost Intelligence Engine
 * Material, steam, labour, automation CapEx, land/yard, delay penalties.
 */

const BASE_MATERIAL_COST_PER_M3 = 4200
const STEAM_COST_PER_HOUR = 180
const HEATED_ENCLOSURE_PER_HOUR = 120
const LABOUR_COST_PER_HOUR = 350
const AMORTIZATION_PER_BED_PER_DAY = 120
const LAND_COST_PER_BED_PER_DAY = 45
const DELAY_PENALTY_PER_HOUR = 80
const AUTOMATION_CAPEX_DAILY_AMORT = { manual: 0, semi: 25, full: 55 }

const STRIP_RESET_HOURS = { manual: 4, semi: 2.5, full: 1.5 }

export function computeCostBreakdown(params, cycleTimeHours, demouldHours) {
  const material = BASE_MATERIAL_COST_PER_M3 * (params.mix_strength_mpa / 40) * 1.1
  let curing = 0
  if (params.curing_method === 'steam') curing = params.curing_hours * STEAM_COST_PER_HOUR
  if (params.curing_method === 'heated_enclosure') curing = params.curing_hours * HEATED_ENCLOSURE_PER_HOUR

  const labourFactor = params.automation_level === 'manual' ? 1.2 : params.automation_level === 'semi' ? 0.85 : 0.6
  const labour = cycleTimeHours * LABOUR_COST_PER_HOUR * labourFactor

  const cyclesPerDay = 24 / cycleTimeHours
  const amortization = (AMORTIZATION_PER_BED_PER_DAY * params.yard_beds) / Math.max(1, cyclesPerDay * params.yard_beds) * (params.yard_beds || 1)
  const amortPerElement = (AMORTIZATION_PER_BED_PER_DAY * params.yard_beds) / Math.max(1, 24 / cycleTimeHours)

  const landYard = (LAND_COST_PER_BED_PER_DAY * params.yard_beds) / Math.max(1, 24 / cycleTimeHours)
  const automationCapex = AUTOMATION_CAPEX_DAILY_AMORT[params.automation_level] ?? 0
  const stripHours = STRIP_RESET_HOURS[params.automation_level] ?? 3
  const delayPenalties = Math.max(0, demouldHours - 20) * DELAY_PENALTY_PER_HOUR * 0.5

  const total =
    material + curing + labour + amortPerElement + landYard + automationCapex + delayPenalties

  return {
    material: Math.round(material),
    curing: Math.round(curing),
    labour: Math.round(labour),
    amortization: Math.round(amortPerElement),
    automation_capex: Math.round(automationCapex),
    land_yard: Math.round(landYard),
    delay_penalties: Math.round(delayPenalties),
    total: Math.round(total),
  }
}
