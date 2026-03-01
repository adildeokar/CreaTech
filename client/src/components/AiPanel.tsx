import { motion } from 'framer-motion'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useEffect, useState } from 'react'
import { fetchCopilotSuggest } from '@/lib/api'

export function AiPanel() {
  const { recommendation, recommendationLoading, recommendationError, aiPanelOpen, scenarios, parameters } = useScenarioStore()
  const [suggest, setSuggest] = useState<{ why_recommended?: string; impact_summary?: string; suggested_changes?: { parameter: string; suggestion: string; impact: string }[] } | null>(null)

  useEffect(() => {
    if (!recommendation?.recommendation?.ranked_strategies?.length || scenarios.length === 0) {
      setSuggest(null)
      return
    }
    const summary: Record<string, { cycle_time_hours: number; cost_per_element_inr: number; risk_level: string }> = {}
    scenarios.forEach((s) => {
      summary[s.scenario_id] = {
        cycle_time_hours: s.cycle_time_hours,
        cost_per_element_inr: s.cost_per_element_inr,
        risk_level: s.risk_level,
      }
    })
    fetchCopilotSuggest(summary, parameters.region, 'balanced')
      .then(setSuggest)
      .catch(() => setSuggest(null))
  }, [recommendation, scenarios, parameters.region])

  if (!aiPanelOpen) return null

  const rec = recommendation?.recommendation
  const expl = recommendation?.explanation

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="flex shrink-0 flex-col border-l border-white/10 bg-surface-800/95 backdrop-blur-sm"
    >
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
          AI Co-pilot
        </h3>
        <p className="mt-0.5 text-xs text-white/50">Why this is recommended · Impact of changes</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {recommendationLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            <p className="text-sm text-white/60">Getting AI recommendation…</p>
          </div>
        )}
        {!recommendationLoading && recommendationError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
            <h4 className="mb-1 text-xs font-medium uppercase text-red-400">Error</h4>
            <p className="text-sm text-red-200">{recommendationError}</p>
            <p className="mt-2 text-xs text-white/50">Ensure the API server is running (port 3001) and OPENAI_API_KEY is set in server/.env</p>
          </div>
        )}
        {!recommendationLoading && !recommendationError && (rec || suggest) && (
          <>
            {(suggest?.why_recommended ?? rec?.primary_reason) && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase text-white/60">Why this is recommended</h4>
                <p className="text-sm text-white/90">{suggest?.why_recommended ?? rec?.primary_reason}</p>
                {rec?.confidence != null && rec.confidence > 0 && (
                  <p className="mt-2 text-xs text-white/50">Confidence: {Math.round(rec.confidence * 100)}%</p>
                )}
              </div>
            )}
            {suggest?.impact_summary && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase text-white/60">Impact of parameter changes</h4>
                <p className="text-sm text-white/80">{suggest.impact_summary}</p>
              </div>
            )}
            {suggest?.suggested_changes && suggest.suggested_changes.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase text-white/60">Dynamic suggestions</h4>
                <ul className="space-y-2">
                  {suggest.suggested_changes.map((c, i) => (
                    <li key={i} className="rounded border border-white/10 bg-surface-700/50 p-2 text-sm">
                      <span className="font-medium text-teal-400">{c.parameter}</span>: {c.suggestion}
                      <p className="mt-1 text-xs text-white/50">{c.impact}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rec?.caveats && rec.caveats.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase text-white/60">Caveats</h4>
                <ul className="list-inside list-disc text-sm text-amber-400/90">
                  {rec.caveats.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            {expl?.trade_offs && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase text-white/60">Trade-offs</h4>
                <p className="text-sm text-white/80">{expl.trade_offs}</p>
              </div>
            )}
            {expl?.climate_note && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase text-white/60">Climate note</h4>
                <p className="text-sm text-cyan-400/90">{expl.climate_note}</p>
              </div>
            )}
          </>
        )}
        {!recommendationLoading && !recommendationError && !rec && !suggest && (
          <p className="text-sm text-white/50">
            Add scenarios and click &quot;Get AI recommendation&quot; to see reasoning and impact here.
          </p>
        )}
      </div>
    </motion.div>
  )
}
