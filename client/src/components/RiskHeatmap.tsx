import { useScenarioStore } from '@/stores/scenarioStore'
import { computeRiskScore } from '@/lib/riskEngine'
import { getClimateContext } from '@/lib/climateEngine'
import { motion } from 'framer-motion'

export function RiskHeatmap() {
  const { scenarios, activeScenarioId, parameters } = useScenarioStore()
  const active = scenarios.find((s) => s.scenario_id === activeScenarioId) ?? scenarios[0]
  const climate = getClimateContext(parameters.region)

  if (!active) {
    return (
      <div className="glass-card glass-card-hover p-4">
        <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
          Risk intelligence
        </h3>
        <p className="text-sm text-white/50">Run a scenario to see risk breakdown.</p>
      </div>
    )
  }

  const risk = computeRiskScore(active.parameters, climate, active.cycle_time_hours)
  const items = [
    { label: 'Overall', value: risk.overall },
    { label: 'Crack probability', value: risk.crack_probability },
    { label: 'Weather volatility', value: risk.weather_volatility },
    { label: 'Automation failure', value: risk.automation_failure },
    { label: 'Cycle time risk', value: risk.cycle_time_risk },
  ]

  const toColor = (v: number) => {
    if (v <= 0.33) return 'from-emerald-500/80 to-emerald-600/80'
    if (v <= 0.66) return 'from-amber-500/80 to-amber-600/80'
    return 'from-red-500/80 to-red-600/80'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card glass-card-hover p-4"
    >
      <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
        Risk intelligence
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-white/70">{item.label}</span>
              <span className="font-mono text-white/90">{(item.value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value * 100}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full bg-gradient-to-r ${toColor(item.value)}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
