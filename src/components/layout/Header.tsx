import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { CollaboratorManagementDialog } from '@/components/collaborators/CollaboratorManagementDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { alerts, currentUser, collaborators, setUser } = useInventoryContext();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const activeCollaborators = collaborators.filter(c => !c.isBlocked);

  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-border/60 bg-background/80 px-8 backdrop-blur-xl">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input 
            placeholder="Buscar produto ou código..." 
            className="h-9 w-60 rounded-lg border-border/60 bg-muted/50 pl-9 text-[13px] placeholder:text-muted-foreground/50 focus-visible:bg-background"
          />
        </div>

        {/* Collaborator Management */}
        <CollaboratorManagementDialog />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          {unreadAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadAlerts}
            </span>
          )}
        </Button>

        {/* Separator */}
        <div className="mx-1 h-6 w-px bg-border/60" />

        {/* User selector - only active/unblocked collaborators */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2.5 rounded-lg px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="hidden md:inline">
                {currentUser || 'Selecionar'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Colaborador</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activeCollaborators.map((collab) => (
              <DropdownMenuItem 
                key={collab.id}
                onClick={() => setUser(collab.name)}
                className={currentUser === collab.name ? 'bg-primary/10 text-primary font-medium' : ''}
              >
                {collab.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}