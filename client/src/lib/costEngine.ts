/**
 * Client-side Cost Intelligence (extended breakdown).
 */

import type { Parameters } from '@/types'
import type { CostBreakdown } from '@/types'

const BASE_MATERIAL_COST_PER_M3 = 4200
const STEAM_COST_PER_HOUR = 180
const HEATED_ENCLOSURE_PER_HOUR = 120
const LABOUR_COST_PER_HOUR = 350
const AMORTIZATION_PER_BED_PER_DAY = 120
const LAND_COST_PER_BED_PER_DAY = 45
const DELAY_PENALTY_PER_HOUR = 80
const AUTOMATION_CAPEX_DAILY_AMORT: Record<string, number> = { manual: 0, semi: 25, full: 55 }

export function computeCostBreakdown(
  params: Parameters,
  cycleTimeHours: number,
  demouldHours: number
): CostBreakdown & { total: number } {
  const material = BASE_MATERIAL_COST_PER_M3 * (params.mix_strength_mpa / 40) * 1.1
  let curing = 0
  if (params.curing_method === 'steam') curing = params.curing_hours * STEAM_COST_PER_HOUR
  if (params.curing_method === 'heated_enclosure') curing = params.curing_hours * HEATED_ENCLOSURE_PER_HOUR

  const labourFactor =
    params.automation_level === 'manual' ? 1.2 : params.automation_level === 'semi' ? 0.85 : 0.6
  const labour = cycleTimeHours * LABOUR_COST_PER_HOUR * labourFactor

  const amortization = (AMORTIZATION_PER_BED_PER_DAY * params.yard_beds) / Math.max(1, 24 / cycleTimeHours)
  const land_yard = (LAND_COST_PER_BED_PER_DAY * params.yard_beds) / Math.max(1, 24 / cycleTimeHours)
  const automation_capex = AUTOMATION_CAPEX_DAILY_AMORT[params.automation_level] ?? 0
  const delay_penalties = Math.max(0, demouldHours - 20) * DELAY_PENALTY_PER_HOUR * 0.5

  const total = material + curing + labour + amortization + land_yard + automation_capex + delay_penalties

  return {
    material: Math.round(material),
    curing: Math.round(curing),
    labour: Math.round(labour),
    amortization: Math.round(amortization),
    automation_capex: Math.round(automation_capex),
    land_yard: Math.round(land_yard),
    delay_penalties: Math.round(delay_penalties),
    total: Math.round(total),
  }
}
