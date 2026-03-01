import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend } from 'recharts'
import { runLocalOptimization } from '@/lib/optimizationEngine'
import type { OptimizationObjective } from '@/types'
import { getClimateContext } from '@/lib/climateEngine'

const OBJECTIVES: { id: OptimizationObjective; label: string }[] = [
  { id: 'balanced', label: 'Balanced (Pareto)' },
  { id: 'minimize_cost', label: 'Minimize Cost' },
  { id: 'minimize_time', label: 'Minimize Time' },
  { id: 'minimize_risk', label: 'Minimize Risk' },
]

export function OptimizationPage() {
  const [objective, setObjective] = useState<OptimizationObjective>('balanced')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof runLocalOptimization> | null>(null)

  const runOptimization = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const res = runLocalOptimization({
        regionId: 'north_india',
        objective,
        maxScenarios: 100,
        climateContext: getClimateContext('north_india'),
      })
      setResult(res)
      setLoading(false)
    }, 800)
  }, [objective])

  const scatterData = result?.scenarios.map((s) => ({
    x: s.cycle_time_hours,
    y: s.cost_per_element_inr,
    z: s.risk_score * 100,
    name: s.name,
    is_frontier: s.is_frontier,
  })) ?? []

  const frontierOnly = result?.scenarios.filter((s) => s.is_frontier) ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-white/10 bg-surface-800/80 p-6 backdrop-blur-md"
      >
        <h2 className="mb-2 font-mono text-lg font-semibold uppercase tracking-wider text-teal-400">
          Multi-objective Optimization
        </h2>
        <p className="mb-4 text-sm text-white/60">
          Generate 100+ parameter combinations and view cost–time tradeoff (Pareto frontier).
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <span className="text-sm text-white/60">Objective:</span>
          {OBJECTIVES.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setObjective(o.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                objective === o.id
                  ? 'border-teal-500 bg-teal-500/20 text-teal-400'
                  : 'border-white/20 text-white/70 hover:bg-surface-700'
              }`}
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={runOptimization}
            disabled={loading}
            className="ml-auto rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate 100+ scenarios'}
          </button>
        </div>
        {result && (
          <p className="mb-4 text-xs text-white/50">
            Generated {result.total_generated} scenarios · Climate: {result.climate_context.temp}°C, {result.climate_context.season}
          </p>
        )}
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-surface-800/80 p-6 backdrop-blur-md"
        >
          <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
            Cost vs cycle time (h) — frontier highlighted
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" dataKey="x" name="Cycle (h)" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <YAxis type="number" dataKey="y" name="Cost (₹)" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Risk" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  formatter={(value: number, name: string) => [name === 'x' ? `${value} h` : name === 'y' ? `₹${Number(value).toLocaleString('en-IN')}` : value, name]}
                  labelFormatter={(_label, payload) => payload[0]?.payload?.name && `Frontier: ${payload[0].payload.is_frontier}`}
                />
                <Scatter name="All" data={scatterData.filter((d) => !d.is_frontier)} fill="rgba(255,255,255,0.15)" fillOpacity={0.6} />
                <Scatter name="Pareto frontier" data={scatterData.filter((d) => d.is_frontier)} fill="#0d9488" fillOpacity={0.9} />
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Optimal frontier: {frontierOnly.length} solutions. Click &quot;Get AI recommendation&quot; on Dashboard to rank.
          </p>
        </motion.div>
      )}
    </div>
  )
}
