import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (!parts.length) return 'U'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export function groupPermissions(permissions = []) {
  return permissions.reduce((acc, permission) => {
    const [group = 'General'] = permission.name.split('.')
    if (!acc[group]) acc[group] = []
    acc[group].push(permission)
    return acc
  }, {})
}
