import { ScoreBadge } from '@/components/ScoreBadge'
import { useEffect, useState } from 'react'
import { fetchWeather } from '@/lib/api'
import { useScenarioStore } from '@/stores/scenarioStore'

interface TopBarProps {
  score: number
  aiPanelOpen: boolean
  onToggleAi: () => void
}

export function TopBar({ score, aiPanelOpen, onToggleAi }: TopBarProps) {
  const { parameters } = useScenarioStore()
  const [weather, setWeather] = useState<{ temp?: number; humidity?: number; source?: string } | null>(null)
  const regionLabel = parameters.region.replace(/_/g, ' ')

  useEffect(() => {
    const lat = parameters.region === 'north_india' ? 28.61 : parameters.region === 'south_india' ? 13.08 : 28.61
    const lon = parameters.region === 'north_india' ? 77.21 : parameters.region === 'south_india' ? 80.27 : 77.21
    fetchWeather(lat, lon)
      .then((d) => setWeather({ temp: d.temp, humidity: d.humidity, source: d.source }))
      .catch(() => setWeather({ temp: 32, humidity: 65 }))
  }, [parameters.region])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-surface-900/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <h1 className="font-mono text-lg font-semibold tracking-tight text-teal-400">
          PRECYCLE
        </h1>
        <span className="text-sm text-white/50">Precast Cycle Intelligence Engine</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-surface-800/80 px-3 py-1.5">
          <span className="text-sm text-white/60">Weather</span>
          <span className="font-mono text-sm text-cyan-400">{weather?.temp ?? '—'}°C</span>
          <span className="text-xs text-white/40">{regionLabel}</span>
        </div>
        <button
          type="button"
          onClick={onToggleAi}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            aiPanelOpen
              ? 'border-teal-500/60 bg-teal-500/20 text-teal-400'
              : 'border-white/20 bg-surface-800 text-white/80 hover:border-teal-500/40 hover:bg-surface-700'
          }`}
        >
          AI Co-pilot
        </button>
        <ScoreBadge score={score} />
      </div>
    </header>
  )
}
