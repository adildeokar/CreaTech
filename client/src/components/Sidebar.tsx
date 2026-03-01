import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/yard', label: 'Digital Twin' },
  { to: '/optimize', label: 'Optimization' },
  { to: '/kpi', label: 'KPI Impact' },
  { to: '/lab', label: 'Scenario Lab' },
]

export function Sidebar() {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-white/10 bg-surface-800/50">
      <nav className="flex flex-col gap-0.5 p-3">
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-teal-500/20 text-teal-400' : 'text-white/70 hover:bg-surface-700 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
