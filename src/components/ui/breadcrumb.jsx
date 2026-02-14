import { ChevronRight } from 'lucide-react'

export function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={index === items.length - 1 ? 'font-medium text-foreground' : ''}>{item.label}</span>
            {index < items.length - 1 && <ChevronRight className="h-4 w-4" />}
          </li>
        ))}
      </ol>
    </nav>
  )
}
