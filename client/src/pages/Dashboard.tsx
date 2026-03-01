import { ParameterPanel } from '../components/ParameterPanel'
import { ScenarioComparison } from '../components/ScenarioComparison'
import { StrengthCurveChart } from '../components/StrengthCurveChart'
import { CostBreakdownChart } from '../components/CostBreakdownChart'
import { RiskHeatmap } from '../components/RiskHeatmap'
import { DemouldMeter } from '../components/DemouldMeter'

export function Dashboard() {
  return (
    <div className="flex flex-1 gap-6 overflow-auto p-6">
      <div className="w-72 shrink-0">
        <ParameterPanel />
      </div>
      <div className="min-w-0 flex-1 space-y-6">
        <ScenarioComparison />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StrengthCurveChart />
          <DemouldMeter />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CostBreakdownChart />
          <RiskHeatmap />
        </div>
      </div>
    </div>
  )
}
