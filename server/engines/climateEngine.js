/**
 * Climate Intelligence Engine
 * Seasonal modeling, historical simulation, strength-gain adjustment, climate impact score.
 */

const SEASONS = {
  summer: { temp_offset: 4, humidity_offset: -10, rainfall_factor: 0.2 },
  monsoon: { temp_offset: -1, humidity_offset: 25, rainfall_factor: 3 },
  winter: { temp_offset: -6, humidity_offset: 0, rainfall_factor: 0.5 },
}

const REGION_BASE = {
  north_india: { temp: 25, humidity: 50, lat: 28.61, lon: 77.21 },
  south_india: { temp: 30, humidity: 78, lat: 13.08, lon: 80.27 },
  west_india: { temp: 29, humidity: 58, lat: 19.08, lon: 72.88 },
  east_india: { temp: 28, humidity: 72, lat: 22.57, lon: 88.36 },
  central_india: { temp: 28, humidity: 55, lat: 23.26, lon: 77.41 },
}

/**
 * Get effective climate from region + optional live weather + season
 */
export function getClimateContext(regionId, options = {}) {
  const base = REGION_BASE[regionId] || REGION_BASE.north_india
  const { temp: liveTemp, humidity: liveHumidity, rainfall_mm, wind_kmh } = options.weather || {}
  const season = options.season || inferSeason(new Date())
  const useLive = options.useLiveWeather && typeof liveTemp === 'number'

  const seasonMod = SEASONS[season] || SEASONS.summer
  const temp = useLive ? liveTemp : base.temp + seasonMod.temp_offset
  const humidity = useLive ? liveHumidity : Math.min(95, Math.max(20, base.humidity + seasonMod.humidity_offset))
  const rainfall = rainfall_mm ?? (base.humidity / 100) * 10 * seasonMod.rainfall_factor

  const impactScore = computeClimateImpactScore(temp, humidity, rainfall, wind_kmh)
  return {
    temp,
    humidity,
    rainfall_mm: Math.round(rainfall * 10) / 10,
    wind_kmh: wind_kmh ?? 5,
    season,
    climate_impact_score: impactScore,
    source: useLive ? 'api' : options.historical ? 'historical' : 'region',
  }
}

function inferSeason(date) {
  const m = date.getMonth()
  if (m >= 3 && m <= 5) return 'summer'
  if (m >= 6 && m <= 9) return 'monsoon'
  return 'winter'
}

/**
 * Climate impact score 0–100 (higher = more adverse for cycle time / curing)
 */
function computeClimateImpactScore(temp, humidity, rainfall, windKmh) {
  let score = 50
  if (temp < 15) score += 15
  else if (temp > 38) score += 20
  if (humidity > 85) score += 15
  if (rainfall > 5) score += 10
  if (windKmh > 40) score += 5
  return Math.min(100, Math.max(0, Math.round(score)))
}

/**
 * Strength gain multiplier from climate (maturity-style adjustment)
 */
export function getClimateStrengthMultiplier(climate) {
  const t = climate.temp
  let mult = 0.7 + (t / 50) * 0.6
  if (climate.humidity > 90) mult *= 0.95
  if (climate.rainfall_mm > 10) mult *= 0.9
  return Math.min(1.3, Math.max(0.6, mult))
}

/**
 * Dynamic cycle time adjustment factor from climate (e.g. 1.0 = no change)
 */
export function getCycleTimeClimateFactor(climate) {
  const impact = (climate.climate_impact_score ?? 50) / 100
  return 0.85 + impact * 0.3
}
