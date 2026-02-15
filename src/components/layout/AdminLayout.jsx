import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Breadcrumb } from '@/components/ui/breadcrumb'

const breadcrumbMap = {
  '/': [{ label: 'Dashboard' }],
  '/orders': [{ label: 'Dashboard' }, { label: 'Orders' }],
  '/products': [{ label: 'Dashboard' }, { label: 'Products' }],
  '/products/:id': [{ label: 'Dashboard' }, { label: 'Products' }, { label: 'Details' }],
  '/categories': [{ label: 'Dashboard' }, { label: 'Categories' }],
  '/users': [{ label: 'Dashboard' }, { label: 'Users' }],
  '/roles': [{ label: 'Dashboard' }, { label: 'Roles' }],
  '/permissions': [{ label: 'Dashboard' }, { label: 'Permissions' }],
  '/permission-matrix': [{ label: 'Dashboard' }, { label: 'Permission Matrix' }],
}

function resolveBreadcrumbs(pathname) {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname]
  if (pathname.startsWith('/products/')) return breadcrumbMap['/products/:id']
  return [{ label: 'Dashboard' }]
}

export function AdminLayout() {
  const location = useLocation()
  const breadcrumbs = resolveBreadcrumbs(location.pathname)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 space-y-5 p-4 sm:p-6">
          <Breadcrumb items={breadcrumbs} />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
