import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useScenarioStore } from '@/stores/scenarioStore'
import { getStrengthCurve } from '@/lib/simulationEngine'

export function StrengthCurveChart() {
  const { scenarios, activeScenarioId } = useScenarioStore()
  const active = scenarios.find((s) => s.scenario_id === activeScenarioId) ?? scenarios[0]
  const curve = active ? getStrengthCurve(active.parameters) : []
  const demouldStrength = 20

  return (
    <div className="glass-card glass-card-hover p-4">
      <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
        Strength gain curve
      </h3>
      {curve.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="hours"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                label={{ value: 'Hours', position: 'insideBottom', fill: 'rgba(255,255,255,0.5)' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                label={{ value: 'MPa', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#22d3ee' }}
                formatter={(value: number) => [`${value} MPa`, 'Strength']}
              />
              <ReferenceLine y={demouldStrength} stroke="#f59e0b" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="strength_mpa"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
                name="Strength"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-white/50">Target demould strength: {demouldStrength} MPa (dashed line)</p>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-white/50">
          Run a scenario to see strength curve
        </div>
      )}
    </div>
  )
}
