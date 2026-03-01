import { useScenarioStore } from '@/stores/scenarioStore'
import { getStrengthPrediction } from '@/lib/strengthPredictionEngine'
import { getClimateContext } from '@/lib/climateEngine'
import { motion } from 'framer-motion'

export function DemouldMeter() {
  const { scenarios, activeScenarioId, parameters } = useScenarioStore()
  const active = scenarios.find((s) => s.scenario_id === activeScenarioId) ?? scenarios[0]
  const params = active?.parameters ?? parameters
  const climate = getClimateContext(parameters.region)
  const pred = getStrengthPrediction(params, climate.temp, 1)

  const pct = Math.round(pred.demould_probability * 100)
  const safeHours = pred.safe_demould_hours

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card glass-card-hover p-4"
    >
      <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
        Demould probability & safe window
      </h3>
      <div className="flex items-center gap-6">
        <div className="relative h-24 w-24">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <motion.path
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
              fill="none"
              stroke={pct >= 95 ? '#10b981' : pct >= 70 ? '#0d9488' : '#f59e0b'}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: pct / 100 }}
              transition={{ duration: 0.8 }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-white">
            {pct}%
          </span>
        </div>
        <div>
          <p className="text-xs text-white/60">Safe demould window</p>
          <p className="font-mono text-2xl font-semibold text-teal-400">{safeHours.toFixed(1)} h</p>
          <p className="mt-1 text-xs text-white/50">Strength ≥ 20 MPa at 95% confidence</p>
        </div>
      </div>
    </motion.div>
  )
}
