import { Moon, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const roleLabel =
    user?.role?.label ||
    user?.role?.name ||
    (Array.isArray(user?.roles) && user.roles[0]?.label) ||
    (Array.isArray(user?.roles) && user.roles[0]?.name) ||
    (Array.isArray(user?.roles) && typeof user.roles[0] === 'string' ? user.roles[0] : null) ||
    'User'

  return (
    <header className="surface-ring flex h-16 items-center justify-end gap-3 border-b bg-card/70 px-4 backdrop-blur-md sm:px-6">
      <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full ring-2 ring-transparent transition-all hover:ring-primary/25">
            <Avatar>
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="font-semibold">{user?.name || 'User'}</DropdownMenuItem>
          <DropdownMenuItem className="text-muted-foreground">{user?.email || '-'}</DropdownMenuItem>
          <DropdownMenuItem className="text-muted-foreground">{roleLabel}</DropdownMenuItem>
          <DropdownMenuItem onSelect={logout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
