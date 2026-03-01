import { motion } from 'framer-motion'

interface ScoreBadgeProps {
  score: number
  className?: string
}

export function ScoreBadge({ score, className = '' }: ScoreBadgeProps) {
  const tier = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low'
  const color = tier === 'high' ? 'text-emerald-400' : tier === 'medium' ? 'text-amber-400' : 'text-red-400'
  const borderColor = tier === 'high' ? 'border-emerald-500/50' : tier === 'medium' ? 'border-amber-500/50' : 'border-red-500/50'

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${borderColor} bg-surface-800/90 backdrop-blur-sm ${className}`}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-white/70">Score</span>
      <motion.span
        key={score}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-mono text-2xl font-bold ${color}`}
      >
        {Math.min(100, Math.max(0, score))}
      </motion.span>
      <span className="text-xs text-white/50">/100</span>
    </motion.div>
  )
}
