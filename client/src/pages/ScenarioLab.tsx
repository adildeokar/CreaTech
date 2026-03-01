import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useScenarioStore } from '@/stores/scenarioStore'
import { runSimulation } from '@/lib/simulationEngine'
import { getClimateContext } from '@/lib/climateEngine'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts'

export function ScenarioLab() {
  const { parameters } = useScenarioStore()
  const [curingSlider, setCuringSlider] = useState(parameters.curing_hours)
  const [tempOffset, setTempOffset] = useState(0)
  const [samples, setSamples] = useState(50)

  const climate = useMemo(() => {
    const base = getClimateContext(parameters.region)
    return { ...base, temp: base.temp + tempOffset }
  }, [parameters.region, tempOffset])

  const monteCarloResults = useMemo(() => {
    const out: { curing_hours: number; cycle_time_hours: number; cost: number; risk: string }[] = []
    for (let i = 0; i < samples; i++) {
      const noise = (Math.random() - 0.5) * 4
      const ch = Math.max(4, Math.min(48, curingSlider + noise))
      const params = { ...parameters, curing_hours: ch }
      const result = runSimulation(params, `lab_${i}`, `Run ${i + 1}`, climate)
      out.push({
        curing_hours: Math.round(ch * 10) / 10,
        cycle_time_hours: result.cycle_time_hours,
        cost: result.cost_per_element_inr,
        risk: result.risk_level,
      })
    }
    return out.sort((a, b) => a.curing_hours - b.curing_hours)
  }, [parameters, curingSlider, samples, climate])

  const uncertaintyBand = useMemo(() => {
    const byCuring = new Map<number, number[]>()
    monteCarloResults.forEach((r) => {
      const key = Math.round(r.curing_hours)
      if (!byCuring.has(key)) byCuring.set(key, [])
      byCuring.get(key)!.push(r.cycle_time_hours)
    })
    return Array.from(byCuring.entries()).map(([ch, arr]) => {
      const min = Math.min(...arr)
      const max = Math.max(...arr)
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length
      return { curing_hours: ch, cycle_avg: avg, cycle_min: min, cycle_max: max }
    })
  }, [monteCarloResults])

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-white/10 bg-surface-800/80 p-6 backdrop-blur-md"
      >
        <h2 className="mb-2 font-mono text-lg font-semibold uppercase tracking-wider text-teal-400">
          Scenario Lab — Monte Carlo & sensitivity
        </h2>
        <p className="mb-6 text-sm text-white/60">
          Adjust sliders and run real-time sensitivity. Uncertainty band from Monte Carlo (multiple runs).
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/70">Curing hours (center)</label>
            <input
              type="range"
              min={4}
              max={48}
              value={curingSlider}
              onChange={(e) => setCuringSlider(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
            <span className="mt-1 block font-mono text-teal-400">{curingSlider} h</span>
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/70">Temp offset (°C)</label>
            <input
              type="range"
              min={-10}
              max={10}
              value={tempOffset}
              onChange={(e) => setTempOffset(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <span className="mt-1 block font-mono text-cyan-400">{climate.temp}°C effective</span>
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/70">Monte Carlo samples</label>
            <input
              type="number"
              min={20}
              max={200}
              value={samples}
              onChange={(e) => setSamples(Math.max(20, Math.min(200, Number(e.target.value))))}
              className="w-full max-w-[120px] rounded-lg border border-white/20 bg-surface-700 px-3 py-2 font-mono text-white"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/10 bg-surface-800/80 p-6 backdrop-blur-md"
      >
        <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
          Cycle time vs curing hours (uncertainty band)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={uncertaintyBand} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="curing_hours" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="cycle_max" stroke="none" fill="rgba(13,148,136,0.2)" />
              <Area type="monotone" dataKey="cycle_min" stroke="none" fill="#0f1419" />
              <Line type="monotone" dataKey="cycle_avg" stroke="#0d9488" strokeWidth={2} dot={false} name="Avg cycle (h)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}
