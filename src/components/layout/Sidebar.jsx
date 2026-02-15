import { NavLink } from 'react-router-dom'
import { Shield, Users, LayoutDashboard, KeyRound, Grid2X2, Package, ShoppingCart, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionGate } from '@/components/shared/PermissionGate'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permissions: [] },
  { to: '/orders', label: 'Orders', icon: ShoppingCart, permissions: ['orders.view'] },
  { to: '/products', label: 'Products', icon: Package, permissions: ['products.view'] },
  { to: '/categories', label: 'Categories', icon: Layers, permissions: ['categories.view'] },
  { to: '/users', label: 'Users', icon: Users, permissions: ['users.view'] },
  { to: '/roles', label: 'Roles', icon: Shield, permissions: ['roles.view'] },
  { to: '/permissions', label: 'Permissions', icon: KeyRound, permissions: ['permissions.show'] },
  { to: '/permission-matrix', label: 'Permission Matrix', icon: Grid2X2, permissions: ['permissions.show'] },
]

export function Sidebar() {
  return (
    <aside className="surface-ring h-full w-72 border-r bg-card/90 px-4 py-5 backdrop-blur-md">
      <div className="mb-7 rounded-xl border bg-background/55 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Admin Console</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight">Laravel Control</h1>
        <p className="mt-1 text-xs text-muted-foreground">Commerce operations panel</p>
      </div>

      <nav className="space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon

          return (
            <PermissionGate key={link.to} permissions={link.permissions}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_40%,transparent)]'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
                {link.label}
              </NavLink>
            </PermissionGate>
          )
        })}
      </nav>
    </aside>
  )
}
