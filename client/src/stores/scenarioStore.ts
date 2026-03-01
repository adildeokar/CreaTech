import { create } from 'zustand'
import type { Parameters, ScenarioWithParams, RecommendationResponse } from '@/types'
import { DEFAULT_PARAMETERS } from '@/lib/constants'
import { runSimulation, computeOptimizationScore } from '@/lib/simulationEngine'

export interface ScenarioState {
  parameters: Parameters
  scenarios: ScenarioWithParams[]
  activeScenarioId: string | null
  recommendation: RecommendationResponse | null
  recommendationLoading: boolean
  recommendationError: string | null
  optimizationScore: number
  aiPanelOpen: boolean
}

export interface ScenarioActions {
  setParameters: (p: Partial<Parameters>) => void
  addScenario: (name?: string) => void
  removeScenario: (id: string) => void
  updateScenarioParams: (id: string, p: Partial<Parameters>) => void
  runAllScenarios: () => void
  setRecommendation: (r: RecommendationResponse | null) => void
  setRecommendationLoading: (v: boolean) => void
  setRecommendationError: (e: string | null) => void
  setAiPanelOpen: (v: boolean) => void
}

const defaultParams: Parameters = { ...DEFAULT_PARAMETERS }

function buildScenarioId() {
  return 'scenario_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useScenarioStore = create<ScenarioState & ScenarioActions>((set, get) => ({
  parameters: defaultParams,
  scenarios: [],
  activeScenarioId: null,
  recommendation: null,
  recommendationLoading: false,
  recommendationError: null,
  optimizationScore: 0,
  aiPanelOpen: false,

  setParameters: (p) => set((s) => ({ parameters: { ...s.parameters, ...p } })),

  addScenario: (name) => {
    const id = buildScenarioId()
    const params = get().parameters
    const result = runSimulation(params, id, name || `Scenario ${get().scenarios.length + 1}`)
    const withParams: ScenarioWithParams = { ...result, parameters: { ...params } }
    set((s) => ({
      scenarios: [...s.scenarios, withParams],
      activeScenarioId: id,
    }))
    get().runAllScenarios()
  },

  removeScenario: (id) => {
    set((s) => {
      const next = s.scenarios.filter((sc) => sc.scenario_id !== id)
      return {
        scenarios: next,
        activeScenarioId: s.activeScenarioId === id ? (next[0]?.scenario_id ?? null) : s.activeScenarioId,
      }
    })
    get().runAllScenarios()
  },

  updateScenarioParams: (id, p) => {
    set((s) => ({
      scenarios: s.scenarios.map((sc) =>
        sc.scenario_id === id
          ? { ...runSimulation({ ...sc.parameters, ...p }, id, sc.name), parameters: { ...sc.parameters, ...p } }
          : sc
      ),
    }))
    get().runAllScenarios()
  },

  runAllScenarios: () => {
    set((s) => ({
      scenarios: s.scenarios.map((sc) => ({
        ...runSimulation(sc.parameters, sc.scenario_id, sc.name),
        parameters: sc.parameters,
      })),
    }))
    const state = get()
    const bestId = state.recommendation?.recommendation?.ranked_strategies?.[0]?.strategy_id ?? state.scenarios[0]?.scenario_id
    const score = computeOptimizationScore(state.scenarios, bestId ?? '')
    set({ optimizationScore: score })
  },

  setRecommendation: (r) => set({ recommendation: r, recommendationError: null }),
  setRecommendationLoading: (v) => set({ recommendationLoading: v }),
  setRecommendationError: (e) => set({ recommendationError: e }),
  setAiPanelOpen: (v) => set({ aiPanelOpen: v }),
}))
