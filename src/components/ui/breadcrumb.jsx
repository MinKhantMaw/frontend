import { ChevronRight } from 'lucide-react'

export function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="fade-rise">
      <ol className="inline-flex items-center gap-2 rounded-full border bg-card/75 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={index === items.length - 1 ? 'font-semibold text-foreground' : ''}>{item.label}</span>
            {index < items.length - 1 && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
          </li>
        ))}
      </ol>
    </nav>
  )
}
