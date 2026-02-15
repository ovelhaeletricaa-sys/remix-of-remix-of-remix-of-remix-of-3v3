import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  ArrowRightLeft, 
  Bell, 
  FileBarChart,
  Warehouse,
  ChevronRight,
  Boxes,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Composições', href: '/composicoes', icon: Boxes },
  { name: 'Armazém', href: '/armazem', icon: MapPin },
  { name: 'Movimentações', href: '/movimentacoes', icon: ArrowRightLeft },
  { name: 'Alertas', href: '/alertas', icon: Bell },
  { name: 'Inventários', href: '/inventarios', icon: ClipboardCheck },
  { name: 'Relatórios', href: '/relatorios', icon: FileBarChart },
];

export function Sidebar() {
  const location = useLocation();
  const { alerts } = useInventoryContext();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Warehouse className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
            3V3 Estoque
          </span>
          <span className="text-[11px] font-medium text-primary uppercase tracking-widest">
            Armazém
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/30">
          Menu Principal
        </p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn(
                'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
              )} />
              <span className="flex-1">{item.name}</span>
              {item.name === 'Alertas' && unreadAlerts > 0 && (
                <Badge 
                  variant="destructive" 
                  className="h-[18px] min-w-[18px] justify-center rounded-full px-1 text-[10px] font-semibold"
                >
                  {unreadAlerts}
                </Badge>
              )}
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mx-3 mb-3">
        <div className="rounded-lg bg-sidebar-muted/50 px-4 py-3">
          <p className="text-[11px] font-semibold text-sidebar-foreground/50">3V3 Tecnologia</p>
          <p className="mt-0.5 text-[10px] text-sidebar-foreground/30">Dados armazenados localmente</p>
        </div>
      </div>
    </aside>
  );
}
