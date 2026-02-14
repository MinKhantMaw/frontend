import { NavLink } from 'react-router-dom'
import { Shield, Users, LayoutDashboard, KeyRound, Grid2X2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionGate } from '@/components/shared/PermissionGate'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permissions: [] },
  { to: '/users', label: 'Users', icon: Users, permissions: ['users.view'] },
  { to: '/roles', label: 'Roles', icon: Shield, permissions: ['roles.view'] },
  { to: '/permissions', label: 'Permissions', icon: KeyRound, permissions: ['permissions.show'] },
  { to: '/permission-matrix', label: 'Permission Matrix', icon: Grid2X2, permissions: ['permissions.show'] },
]

export function Sidebar() {
  return (
    <aside className="h-full w-72 border-r bg-card px-4 py-6">
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
        <h1 className="mt-2 text-xl font-bold">Laravel Control</h1>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon

          return (
            <PermissionGate key={link.to} permissions={link.permissions}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            </PermissionGate>
          )
        })}
      </nav>
    </aside>
  )
}
