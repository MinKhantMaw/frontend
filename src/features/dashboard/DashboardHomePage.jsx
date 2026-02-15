import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const cards = [
  { label: 'User Operations', value: 'CRUD + Search', description: 'Manage app users and account access.' },
  { label: 'Role Policies', value: 'RBAC Enabled', description: 'Assign groups of permissions quickly.' },
  { label: 'Permission Control', value: 'Granular', description: 'Gate routes and actions per permission.' },
]

export function DashboardHomePage() {
  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="fade-rise">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.1em]">{card.label}</CardDescription>
            <CardTitle className="text-2xl">{card.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
