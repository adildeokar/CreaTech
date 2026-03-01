import { Yard3D } from '../components/Yard3D'

export function YardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/10 bg-surface-800/80 px-4 py-2 backdrop-blur-sm">
        <p className="text-sm text-white/70">Drag to rotate • Scroll to zoom • Beds colored by state (cyan=casting, teal=curing, amber=stripping, ready)</p>
      </div>
      <div className="h-[calc(100%-48px)] w-full">
        <Yard3D />
      </div>
    </div>
  )
}
