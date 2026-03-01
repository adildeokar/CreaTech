export type RegionId = 'north_india' | 'south_india' | 'west_india' | 'east_india' | 'central_india'

export type ProjectType = 'infrastructure' | 'building'

export type CementType = 'OPC_53' | 'OPC_43' | 'PPC' | 'PSC'

export type CuringMethod = 'ambient' | 'steam' | 'heated_enclosure'

export type AutomationLevel = 'manual' | 'semi' | 'full'

export interface Region {
  id: RegionId
  label: string
  temp_range: [number, number]
  humidity_range: [number, number]
}

export interface Parameters {
  region: RegionId
  project_type: ProjectType
  cement_type: CementType
  mix_strength_mpa: number
  curing_method: CuringMethod
  curing_hours: number
  automation_level: AutomationLevel
  yard_beds: number
  element_types: string[]
}

export interface ScenarioResult {
  scenario_id: string
  name: string
  cycle_time_hours: number
  cost_per_element_inr: number
  risk_level: 'low' | 'medium' | 'high'
  demould_strength_mpa?: number
  breakdown?: Record<string, number>
}

export interface ScenarioWithParams extends ScenarioResult {
  parameters: Parameters
}

export interface RankedStrategy {
  rank: number
  strategy_id: string
  cycle_time_hours: number
  cost_per_element_inr: number
  risk_level: string
  summary: string
}

export interface RecommendationResponse {
  recommendation: {
    ranked_strategies: RankedStrategy[]
    primary_reason: string
    confidence: number
    caveats: string[]
  }
  explanation?: {
    factors: string[]
    trade_offs: string
    climate_note?: string
  }
}

export interface StrengthCurvePoint {
  hours: number
  strength_mpa: number
}

export interface WeatherData {
  temp: number
  humidity: number
  conditions: string
  risk?: string
  rainfall?: number
  wind_kmh?: number
}

export type Season = 'summer' | 'monsoon' | 'winter'

export interface ClimateContext {
  temp: number
  humidity: number
  rainfall_mm?: number
  wind_kmh?: number
  season?: Season
  climate_impact_score?: number
  source: 'region' | 'api' | 'historical'
}

export type OptimizationObjective = 'minimize_cost' | 'minimize_time' | 'minimize_risk' | 'balanced'

export interface CostBreakdown {
  material: number
  curing: number
  labour: number
  amortization: number
  automation_capex?: number
  land_yard?: number
  delay_penalties?: number
}

export interface ParetoPoint {
  scenario_id: string
  name: string
  cycle_time_hours: number
  cost_per_element_inr: number
  risk_score: number
  is_frontier: boolean
  parameters: Parameters
}

export interface StrengthPrediction {
  strength_mpa: number
  confidence_low: number
  confidence_high: number
  demould_probability: number
  safe_demould_hours: number
  curve: StrengthCurvePoint[]
}

export interface RiskScoreBreakdown {
  overall: number
  crack_probability: number
  weather_volatility: number
  automation_failure: number
  cycle_time_risk: number
}

export interface KPIImpact {
  cycle_time_reduction_pct: number
  cost_savings_pct: number
  throughput_increase_pct: number
  yard_size_reduction_pct: number
  energy_savings_pct: number
  co2_savings_pct: number
  traditional_cycle_hours: number
  optimized_cycle_hours: number
  traditional_cost: number
  optimized_cost: number
}
