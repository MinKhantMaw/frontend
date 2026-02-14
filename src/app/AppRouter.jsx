import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardHomePage } from '@/features/dashboard/DashboardHomePage'
import { PermissionMatrixPage } from '@/features/permissions/PermissionMatrixPage'
import { PermissionsPage } from '@/features/permissions/PermissionsPage'
import { RolesPage } from '@/features/roles/RolesPage'
import { UsersPage } from '@/features/users/UsersPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardHomePage /> },
          {
            element: <ProtectedRoute requiredPermissions={['users.view']} />,
            children: [{ path: '/users', element: <UsersPage /> }],
          },
          {
            element: <ProtectedRoute requiredPermissions={['roles.view']} />,
            children: [{ path: '/roles', element: <RolesPage /> }],
          },
          {
            element: <ProtectedRoute requiredPermissions={['permissions.show']} />,
            children: [{ path: '/permissions', element: <PermissionsPage /> }],
          },
          {
            element: <ProtectedRoute requiredPermissions={['permissions.show']} />,
            children: [{ path: '/permission-matrix', element: <PermissionMatrixPage /> }],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
