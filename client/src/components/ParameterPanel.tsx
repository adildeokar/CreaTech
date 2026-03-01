import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { REGIONS, CEMENT_TYPES, CURING_METHODS, AUTOMATION_LEVELS } from '@/lib/constants'
import type { Parameters } from '@/types'
import { useScenarioStore } from '@/stores/scenarioStore'

const schema = z.object({
  region: z.string(),
  project_type: z.enum(['infrastructure', 'building']),
  cement_type: z.string(),
  mix_strength_mpa: z.number().min(25).max(80),
  curing_method: z.string(),
  curing_hours: z.number().min(4).max(48),
  automation_level: z.string(),
  yard_beds: z.number().min(1).max(200),
})

type FormValues = z.infer<typeof schema>

export function ParameterPanel() {
  const { parameters, setParameters, addScenario } = useScenarioStore()

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      region: parameters.region,
      project_type: parameters.project_type,
      cement_type: parameters.cement_type,
      mix_strength_mpa: parameters.mix_strength_mpa,
      curing_method: parameters.curing_method,
      curing_hours: parameters.curing_hours,
      automation_level: parameters.automation_level,
      yard_beds: parameters.yard_beds,
    },
  })

  const onSubmit = (data: FormValues) => {
    setParameters({
      region: data.region as Parameters['region'],
      project_type: data.project_type,
      cement_type: data.cement_type as Parameters['cement_type'],
      mix_strength_mpa: data.mix_strength_mpa,
      curing_method: data.curing_method as Parameters['curing_method'],
      curing_hours: data.curing_hours,
      automation_level: data.automation_level as Parameters['automation_level'],
      yard_beds: data.yard_beds,
      element_types: parameters.element_types,
    })
    addScenario()
  }

  return (
    <div className="glass-card glass-card-hover p-4">
      <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-teal-400">
        Parameters
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-white/60">Region</label>
          <select
            {...register('region')}
            className="w-full rounded-lg border border-white/20 bg-surface-700 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Project type</label>
          <select
            {...register('project_type')}
            className="w-full rounded-lg border border-white/20 bg-surface-700 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
          >
            <option value="infrastructure">Infrastructure</option>
            <option value="building">Building</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Cement type</label>
          <select
            {...register('cement_type')}
            className="w-full rounded-lg border border-white/20 bg-surface-700 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
          >
            {CEMENT_TYPES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Mix strength (MPa)</label>
          <input
            type="number"
            {...register('mix_strength_mpa', { valueAsNumber: true })}
            min={25}
            max={80}
            className="w-full rounded-lg border border-white/20 bg-surface-700 px-3 py-2 font-mono text-sm text-white focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Curing method</label>
          <select
            {...register('curing_method')}
            className="w-full rounded-lg border border-white/20 bg-surface-700 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
          >
            {CURING_METHODS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Curing hours</label>
          <input
            type="range"
            min={4}
            max={48}
            step={1}
            {...register('curing_hours', { valueAsNumber: true })}
            onChange={(e) => setValue('curing_hours', Number(e.target.value))}
            className="w-full accent-teal-500"
          />
          <span className="mt-1 block font-mono text-sm text-teal-400">{watch('curing_hours')} h</span>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Automation</label>
          <select
            {...register('automation_level')}
            className="w-full rounded-lg border border-white/20 bg-surface-700 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
          >
            {AUTOMATION_LEVELS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Yard beds</label>
          <input
            type="number"
            {...register('yard_beds', { valueAsNumber: true })}
            min={1}
            max={200}
            className="w-full rounded-lg border border-white/20 bg-surface-700 px-3 py-2 font-mono text-sm text-white focus:border-teal-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
        >
          Run scenario
        </button>
      </form>
    </div>
  )
}
