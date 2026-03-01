import { motion } from 'framer-motion'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useMemo } from 'react'
export function KPIDashboard() {
  const { scenarios, recommendation } = useScenarioStore()
  const bestId = recommendation?.recommendation?.ranked_strategies?.[0]?.strategy_id
  const best = scenarios.find((s) => s.scenario_id === bestId)
  const worst = useMemo(() => {
    if (scenarios.length < 2) return null
    const byCost = [...scenarios].sort((a, b) => b.cost_per_element_inr - a.cost_per_element_inr)
    return byCost[0]
  }, [scenarios])

  const kpi = useMemo(() => {
    if (!best || !worst || best.scenario_id === worst.scenario_id) {
      return {
        cycle_time_reduction_pct: 0,
        cost_savings_pct: 0,
        throughput_increase_pct: 0,
        yard_size_reduction_pct: 0,
        energy_savings_pct: 0,
        co2_savings_pct: 0,
        traditional_cycle_hours: best?.cycle_time_hours ?? 0,
        optimized_cycle_hours: best?.cycle_time_hours ?? 0,
        traditional_cost: best?.cost_per_element_inr ?? 0,
        optimized_cost: best?.cost_per_element_inr ?? 0,
      }
    }
    return {
      cycle_time_reduction_pct: ((worst.cycle_time_hours - best.cycle_time_hours) / worst.cycle_time_hours) * 100,
      cost_savings_pct: ((worst.cost_per_element_inr - best.cost_per_element_inr) / worst.cost_per_element_inr) * 100,
      throughput_increase_pct: best.cycle_time_hours > 0 && worst.cycle_time_hours > 0
        ? ((24 / best.cycle_time_hours) / (24 / worst.cycle_time_hours) - 1) * 100
        : 0,
      yard_size_reduction_pct: 0,
      energy_savings_pct: 15,
      co2_savings_pct: 8,
      traditional_cycle_hours: worst.cycle_time_hours,
      optimized_cycle_hours: best.cycle_time_hours,
      traditional_cost: worst.cost_per_element_inr,
      optimized_cost: best.cost_per_element_inr,
    }
  }, [best, worst])

  const cardColors = ['#0d9488', '#22d3ee', '#f59e0b', '#10b981', '#10b981']
  const cards = [
    { label: 'Cycle time reduction', value: `${kpi.cycle_time_reduction_pct.toFixed(1)}%`, sub: 'vs worst scenario' },
    { label: 'Cost savings', value: `${kpi.cost_savings_pct.toFixed(1)}%`, sub: 'vs worst scenario' },
    { label: 'Throughput increase', value: `${kpi.throughput_increase_pct.toFixed(1)}%`, sub: 'elements/day' },
    { label: 'Energy savings', value: `${kpi.energy_savings_pct}%`, sub: 'estimated' },
    { label: 'CO₂ savings', value: `${kpi.co2_savings_pct}%`, sub: 'estimated' },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/10 bg-surface-800/80 p-6 backdrop-blur-md"
      >
        <h2 className="mb-2 font-mono text-lg font-semibold uppercase tracking-wider text-teal-400">
          KPI Impact Dashboard
        </h2>
        <p className="mb-6 text-sm text-white/60">
          Traditional vs AI-optimized — run scenarios and get AI recommendation to see gains.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/10 bg-surface-700/50 p-4 backdrop-blur-sm"
            >
              <p className="text-xs font-medium uppercase text-white/50">{c.label}</p>
              <p className="mt-1 font-mono text-2xl font-bold" style={{ color: cardColors[i] }}>
                {c.value}
              </p>
              <p className="mt-0.5 text-xs text-white/40">{c.sub}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-surface-700/30 p-4">
            <p className="text-xs text-white/50">Traditional (worst of current set)</p>
            <p className="font-mono text-white">Cycle: {kpi.traditional_cycle_hours}h · Cost: ₹{kpi.traditional_cost?.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-4">
            <p className="text-xs text-teal-400">AI Optimized (recommended)</p>
            <p className="font-mono text-teal-300">Cycle: {kpi.optimized_cycle_hours}h · Cost: ₹{kpi.optimized_cost?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
