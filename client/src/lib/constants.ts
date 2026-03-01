import type { Region } from '@/types'

export const REGIONS: Region[] = [
  { id: 'north_india', label: 'North India', temp_range: [8, 42], humidity_range: [20, 80] },
  { id: 'south_india', label: 'South India', temp_range: [22, 38], humidity_range: [60, 95] },
  { id: 'west_india', label: 'West India', temp_range: [18, 40], humidity_range: [30, 85] },
  { id: 'east_india', label: 'East India', temp_range: [12, 38], humidity_range: [50, 95] },
  { id: 'central_india', label: 'Central India', temp_range: [10, 45], humidity_range: [25, 90] },
]

export const CEMENT_TYPES = [
  { id: 'OPC_53', label: 'OPC 53' },
  { id: 'OPC_43', label: 'OPC 43' },
  { id: 'PPC', label: 'PPC' },
  { id: 'PSC', label: 'PSC' },
] as const

export const CURING_METHODS = [
  { id: 'ambient', label: 'Ambient' },
  { id: 'steam', label: 'Steam' },
  { id: 'heated_enclosure', label: 'Heated enclosure' },
] as const

export const AUTOMATION_LEVELS = [
  { id: 'manual', label: 'Manual' },
  { id: 'semi', label: 'Semi-automated' },
  { id: 'full', label: 'Fully automated' },
] as const

export const DEFAULT_PARAMETERS = {
  region: 'north_india' as const,
  project_type: 'infrastructure' as const,
  cement_type: 'OPC_53' as const,
  mix_strength_mpa: 45,
  curing_method: 'steam' as const,
  curing_hours: 12,
  automation_level: 'semi' as const,
  yard_beds: 24,
  element_types: ['beam', 'slab'],
}
