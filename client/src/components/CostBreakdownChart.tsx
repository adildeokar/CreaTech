import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useScenarioStore } from '@/stores/scenarioStore'
import { motion } from 'framer-motion'

const BREAKDOWN_KEYS = [
  { key: 'material', label: 'Material', color: '#0d9488' },
  { key: 'curing', label: 'Steam/Energy', color: '#f59e0b' },
  { key: 'labour', label: 'Labour', color: '#22d3ee' },
  { key: 'amortization', label: 'Amortization', color: '#8b5cf6' },
  { key: 'automation_capex', label: 'Automation CapEx', color: '#6366f1' },
  { key: 'land_yard', label: 'Land/Yard', color: '#64748b' },
  { key: 'delay_penalties', label: 'Delay penalties', color: '#ef4444' },
]

export function CostBreakdownChart() {
  const { scenarios, activeScenarioId } = useScenarioStore()
  const active = scenarios.find((s) => s.scenario_id === activeScenarioId) ?? scenarios[0]
  const breakdown = active?.breakdown

  if (!breakdown) {
    return (
      <div className="glass-card glass-card-hover p-4">
        <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
          Cost breakdown
        </h3>
        <div className="flex h-48 items-center justify-center text-sm text-white/50">Run a scenario to see cost breakdown</div>
      </div>
    )
  }

  const data = BREAKDOWN_KEYS.filter((k) => breakdown[k.key as keyof typeof breakdown] != null).map((k) => ({
    name: k.label,
    value: breakdown[k.key as keyof typeof breakdown] ?? 0,
    fill: k.color,
  }))
  const total = data.reduce((s, d) => s + d.value, 0)
  const highest = data.length ? data.reduce((a, b) => (a.value > b.value ? a : b)) : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card glass-card-hover p-4"
    >
      <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
        Cost breakdown
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 70, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} width={65} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
              labelFormatter={(label) => `${label} — ${total > 0 ? ((data.find((d) => d.name === label)?.value ?? 0) / total * 100).toFixed(0) : 0}%`}
            />
            <Bar dataKey="value" name="INR" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {highest && (
        <p className="mt-2 text-xs text-white/50">
          Highest contributor: <span className="font-mono text-amber-400">{highest.name}</span> (₹{highest.value.toLocaleString('en-IN')})
        </p>
      )}
    </motion.div>
  )
}
