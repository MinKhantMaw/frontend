import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatusTimeline({ steps = [], current = '' }) {
  const currentIndex = steps.findIndex((step) => step === current)

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => {
        const done = currentIndex >= 0 && index <= currentIndex
        return (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded-full border',
                done ? 'border-primary bg-primary/15 text-primary' : 'text-muted-foreground',
              )}
            >
              {done ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
            </span>
            <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>{step}</span>
          </li>
        )
      })}
    </ol>
  )
}

