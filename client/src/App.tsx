import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { YardPage } from './pages/YardPage'
import { KPIDashboard } from './pages/KPIDashboard'
import { OptimizationPage } from './pages/OptimizationPage'
import { ScenarioLab } from './pages/ScenarioLab'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="scenarios" element={<Dashboard />} />
        <Route path="yard" element={<YardPage />} />
        <Route path="kpi" element={<KPIDashboard />} />
        <Route path="optimize" element={<OptimizationPage />} />
        <Route path="lab" element={<ScenarioLab />} />
      </Route>
    </Routes>
  )
}
