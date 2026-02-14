import { cloneElement, isValidElement } from 'react'
import { useAuthorization } from '@/hooks/useAuthorization'

export function PermissionGate({
  permissions = [],
  fallback = null,
  children,
  mode = 'hide',
  disabledReason = 'You do not have permission.',
}) {
  const { can } = useAuthorization()

  if (can(permissions)) return children
  if (mode !== 'disable') return fallback

  if (isValidElement(children)) {
    return cloneElement(children, {
      disabled: true,
      title: children.props?.title || disabledReason,
      'aria-disabled': true,
    })
  }

  return fallback
}
