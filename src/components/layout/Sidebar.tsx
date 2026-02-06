import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  ArrowRightLeft, 
  Bell, 
  FileBarChart,
  Settings,
  Factory
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Armazém', href: '/armazem', icon: MapPin },
  { name: 'Movimentações', href: '/movimentacoes', icon: ArrowRightLeft },
  { name: 'Alertas', href: '/alertas', icon: Bell },
  { name: 'Relatórios', href: '/relatorios', icon: FileBarChart },
];

export function Sidebar() {
  const location = useLocation();
  const { alerts } = useInventoryContext();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Factory className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">EstoqueMax</h1>
          <p className="text-xs text-sidebar-foreground/60">Controle Industrial</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.name === 'Alertas' && unreadAlerts > 0 && (
                <Badge 
                  variant="destructive" 
                  className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs"
                >
                  {unreadAlerts}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/10 p-3">
          <p className="text-xs text-sidebar-foreground/60">Dados armazenados localmente</p>
          <p className="text-xs font-medium text-sidebar-foreground/80">neste navegador</p>
        </div>
      </div>
    </aside>
  );
}
