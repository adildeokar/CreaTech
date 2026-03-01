import { motion, AnimatePresence } from 'framer-motion'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useRecommendation } from '@/hooks/useRecommendation'

export function ScenarioComparison() {
  const { scenarios, recommendation, recommendationLoading, recommendationError } = useScenarioStore()
  const { getRecommendation } = useRecommendation()
  const bestId = recommendation?.recommendation?.ranked_strategies?.[0]?.strategy_id

  return (
    <div className="glass-card glass-card-hover overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
          Scenario comparison
        </h3>
        <button
          type="button"
          onClick={getRecommendation}
          disabled={scenarios.length === 0 || recommendationLoading}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
        >
          {recommendationLoading ? 'Getting recommendation…' : 'Get AI recommendation'}
        </button>
      </div>
      {recommendationError && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {recommendationError}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/60">
              <th className="px-4 py-3 font-medium">Scenario</th>
              <th className="px-4 py-3 font-mono font-medium">Cycle (h)</th>
              <th className="px-4 py-3 font-mono font-medium">Cost (INR)</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="w-8 px-2" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {scenarios.map((sc) => (
                <motion.tr
                  key={sc.scenario_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className={`border-b border-white/5 ${
                    sc.scenario_id === bestId ? 'bg-teal-500/10' : 'hover:bg-surface-700/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{sc.name}</span>
                    {sc.scenario_id === bestId && (
                      <span className="ml-2 rounded bg-teal-500/30 px-1.5 py-0.5 text-xs text-teal-400">
                        Recommended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-cyan-400">{sc.cycle_time_hours}</td>
                  <td className="px-4 py-3 font-mono text-white">{sc.cost_per_element_inr.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        sc.risk_level === 'low'
                          ? 'text-emerald-400'
                          : sc.risk_level === 'medium'
                            ? 'text-amber-400'
                            : 'text-red-400'
                      }
                    >
                      {sc.risk_level}
                    </span>
                  </td>
                  <td className="px-2">
                    <button
                      type="button"
                      onClick={() => useScenarioStore.getState().removeScenario(sc.scenario_id)}
                      className="rounded p-1 text-white/50 hover:bg-red-500/20 hover:text-red-400"
                      aria-label="Remove scenario"
                    >
                      ×
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {scenarios.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-white/50">
          Add parameters and click &quot;Run scenario&quot; to add scenarios, then get AI recommendation.
        </div>
      )}
    </div>
  )
}
