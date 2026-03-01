/**
 * Client-side Climate Intelligence (mirrors server logic for instant UI).
 */

import type { ClimateContext, Season } from '@/types'

const SEASONS: Record<Season, { temp_offset: number; humidity_offset: number; rainfall_factor: number }> = {
  summer: { temp_offset: 4, humidity_offset: -10, rainfall_factor: 0.2 },
  monsoon: { temp_offset: -1, humidity_offset: 25, rainfall_factor: 3 },
  winter: { temp_offset: -6, humidity_offset: 0, rainfall_factor: 0.5 },
}

const REGION_BASE: Record<string, { temp: number; humidity: number }> = {
  north_india: { temp: 25, humidity: 50 },
  south_india: { temp: 30, humidity: 78 },
  west_india: { temp: 29, humidity: 58 },
  east_india: { temp: 28, humidity: 72 },
  central_india: { temp: 28, humidity: 55 },
}

function inferSeason(date: Date): Season {
  const m = date.getMonth()
  if (m >= 3 && m <= 5) return 'summer'
  if (m >= 6 && m <= 9) return 'monsoon'
  return 'winter'
}

function computeClimateImpactScore(
  temp: number,
  humidity: number,
  rainfall: number,
  windKmh: number
): number {
  let score = 50
  if (temp < 15) score += 15
  else if (temp > 38) score += 20
  if (humidity > 85) score += 15
  if (rainfall > 5) score += 10
  if (windKmh > 40) score += 5
  return Math.min(100, Math.max(0, Math.round(score)))
}

export function getClimateContext(
  regionId: string,
  options: {
    weather?: { temp?: number; humidity?: number; rainfall_mm?: number; wind_kmh?: number }
    season?: Season
    useLiveWeather?: boolean
    historical?: boolean
  } = {}
): ClimateContext {
  const base = REGION_BASE[regionId] || REGION_BASE.north_india
  const { temp: liveTemp, humidity: liveHumidity, rainfall_mm, wind_kmh } = options.weather || {}
  const season = options.season || inferSeason(new Date())
  const useLive = options.useLiveWeather && typeof liveTemp === 'number'

  const seasonMod = SEASONS[season]
  const temp = useLive ? liveTemp! : base.temp + seasonMod.temp_offset
  const humidity = useLive ? liveHumidity! : Math.min(95, Math.max(20, base.humidity + seasonMod.humidity_offset))
  const rainfall = rainfall_mm ?? (base.humidity / 100) * 10 * seasonMod.rainfall_factor
  const wind = wind_kmh ?? 5

  const climate_impact_score = computeClimateImpactScore(temp, humidity, rainfall, wind)
  return {
    temp,
    humidity,
    rainfall_mm: Math.round(rainfall * 10) / 10,
    wind_kmh: wind,
    season,
    climate_impact_score,
    source: useLive ? 'api' : options.historical ? 'historical' : 'region',
  }
}

export function getClimateStrengthMultiplier(climate: ClimateContext): number {
  const t = climate.temp
  let mult = 0.7 + (t / 50) * 0.6
  if (climate.humidity > 90) mult *= 0.95
  if ((climate.rainfall_mm ?? 0) > 10) mult *= 0.9
  return Math.min(1.3, Math.max(0.6, mult))
}

export function getCycleTimeClimateFactor(climate: ClimateContext): number {
  const impact = (climate.climate_impact_score ?? 50) / 100
  return 0.85 + impact * 0.3
}
