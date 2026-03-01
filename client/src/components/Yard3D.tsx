/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — R3F JSX intrinsics (mesh, boxGeometry, etc.) not recognized under React 19 TS; runtime works.
import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useScenarioStore } from '@/stores/scenarioStore'

const STRIP_RESET_HOURS: Record<string, number> = { manual: 4, semi: 2.5, full: 1.5 }

function Bed({ position, state, phase }: { position: [number, number, number]; state: string; phase: number }) {
  const colors: Record<string, string> = { casting: '#22d3ee', curing: '#0d9488', stripping: '#f59e0b', ready: '#10b981' }
  const color = colors[state] ?? '#374151'
  const yOffset = state === 'casting' ? Math.sin(phase * 0.5) * 0.02 : 0
  return (
    <mesh position={[position[0], position[1] + yOffset, position[2]]} castShadow receiveShadow>
      <boxGeometry args={[2.8, 0.4, 1.2]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
    </mesh>
  )
}

function YardGrid({ cycleTimeHours, automationLevel, tick }: { cycleTimeHours: number; automationLevel: string; tick: number }) {
  const yardBeds = Math.min(24, 24)
  const cols = Math.ceil(Math.sqrt(yardBeds))
  const beds = useMemo(() => {
    const out: { position: [number, number, number]; index: number }[] = []
    for (let i = 0; i < yardBeds; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      out.push({
        position: [col * 3.2 - (cols * 3.2) / 2 + 1.6, 0, row * 1.6 - 2],
        index: i,
      })
    }
    return out
  }, [yardBeds, cols])

  const stripHours = STRIP_RESET_HOURS[automationLevel] ?? 2.5
  const demouldHours = Math.max(1, cycleTimeHours - stripHours)
  const cycleTotal = cycleTimeHours

  const getState = (phase: number) => {
    const demouldRatio = demouldHours / cycleTotal
    if (phase < demouldRatio * 0.2) return 'casting'
    if (phase < demouldRatio) return 'curing'
    if (phase < demouldRatio + (stripHours / cycleTotal)) return 'stripping'
    return 'ready'
  }

  return (
    <>
      {beds.map((b, i) => {
        const offset = (i / yardBeds) * cycleTotal
        const phase = (tick * 0.1 + offset) % cycleTotal
        return (
          <Bed key={b.index} position={b.position} state={getState(phase)} phase={phase} />
        )
      })}
    </>
  )
}

export function Yard3D() {
  const ref = useRef<HTMLDivElement>(null)
  const [tick, setTick] = useState(0)
  const { scenarios, activeScenarioId, parameters } = useScenarioStore()
  const active = scenarios.find((s) => s.scenario_id === activeScenarioId) ?? scenarios[0]
  const cycleTimeHours = active?.cycle_time_hours ?? 20
  const throughputPerDay = 24 / cycleTimeHours
  const utilization = Math.min(100, (throughputPerDay / (24 / 12)) * 100)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 800)
    return () => clearInterval(id)
  }, [])

  return (
    <div ref={ref} className="relative h-full w-full bg-surface-900">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-3 rounded-lg border border-white/10 bg-surface-800/90 px-3 py-2 backdrop-blur-sm">
        <span className="font-mono text-xs text-teal-400">Throughput: {throughputPerDay.toFixed(1)}/day</span>
        <span className="font-mono text-xs text-cyan-400">Cycle: {cycleTimeHours}h</span>
        <span className="font-mono text-xs text-amber-400">Utilization: {utilization.toFixed(0)}%</span>
        <span className="text-xs text-white/50">Casting → Curing → Demould → Reset</span>
      </div>
      <Canvas
        camera={{ position: [12, 10, 12], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0f1419']} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <Grid
          args={[30, 30]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a1f26"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#252b33"
          fadeDistance={35}
          fadeStrength={1}
          infiniteGrid
        />
        <YardGrid tick={tick} cycleTimeHours={cycleTimeHours} automationLevel={parameters.automation_level} />
        <OrbitControls
          enablePan
          enableZoom
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      </Canvas>
    </div>
  )
}
