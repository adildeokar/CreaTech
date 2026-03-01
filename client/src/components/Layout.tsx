import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { AiPanel } from './AiPanel'
import { useScenarioStore } from '../stores/scenarioStore'

export function Layout() {
  const { optimizationScore, aiPanelOpen, setAiPanelOpen } = useScenarioStore()

  return (
    <div
      className="flex h-screen flex-col bg-surface-900"
      style={{ minHeight: '100vh', backgroundColor: '#0f1419' }}
    >
      <TopBar
        score={optimizationScore}
        aiPanelOpen={aiPanelOpen}
        onToggleAi={() => setAiPanelOpen(!aiPanelOpen)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
        <AiPanel />
      </div>
    </div>
  )
}
