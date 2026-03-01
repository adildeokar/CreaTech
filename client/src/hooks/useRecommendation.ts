import { useCallback } from 'react'
import { useScenarioStore } from '@/stores/scenarioStore'
import { fetchRecommendation } from '@/lib/api'
import { computeOptimizationScore } from '@/lib/simulationEngine'

export function useRecommendation() {
  const {
    scenarios,
    setRecommendation,
    setRecommendationLoading,
    setRecommendationError,
    parameters,
  } = useScenarioStore()

  const getRecommendation = useCallback(async () => {
    if (scenarios.length === 0) {
      setRecommendationError('Add at least one scenario first.')
      return
    }
    setRecommendationLoading(true)
    setRecommendationError(null)
    try {
      const scenarioSummary: Record<string, { cycle_time_hours: number; cost_per_element_inr: number; risk_level: string }> = {}
      scenarios.forEach((s) => {
        scenarioSummary[s.scenario_id] = {
          cycle_time_hours: s.cycle_time_hours,
          cost_per_element_inr: s.cost_per_element_inr,
          risk_level: s.risk_level,
        }
      })
      const data = await fetchRecommendation(scenarioSummary, { max_risk: 'medium', prefer: 'balance' }, parameters.region)
      if (!data?.recommendation?.ranked_strategies?.length) {
        setRecommendationError('Server returned no strategies. Check server logs.')
        setRecommendation(null)
        return
      }
      setRecommendation(data)
      const bestId = data.recommendation.ranked_strategies[0].strategy_id
      useScenarioStore.setState({ optimizationScore: computeOptimizationScore(scenarios, bestId) })
      useScenarioStore.getState().setAiPanelOpen(true)
    } catch (e) {
      setRecommendationError(e instanceof Error ? e.message : 'Failed to get recommendation')
      setRecommendation(null)
    } finally {
      setRecommendationLoading(false)
    }
  }, [scenarios, parameters.region, setRecommendation, setRecommendationLoading, setRecommendationError])

  return { getRecommendation }
}
