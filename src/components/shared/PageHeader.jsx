export function PageHeader({ title, description, actions }) {
  return (
    <div className="surface-ring elevate-soft fade-rise flex flex-col gap-4 rounded-2xl border bg-card/95 p-5 md:flex-row md:items-center md:justify-between md:p-6">
      <div>
        <h2 className="text-[1.55rem] font-bold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
