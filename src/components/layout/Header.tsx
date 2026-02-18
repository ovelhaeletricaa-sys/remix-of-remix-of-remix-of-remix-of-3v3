import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, X, Package, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const { alerts, currentUser, collaborators, setUser, products, movements } = useInventoryContext();
  const navigate = useNavigate();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const activeCollaborators = collaborators.filter(c => !c.isBlocked);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const query = searchQuery.toLowerCase().trim();

  const searchResults = query.length >= 2 ? {
    products: products.filter(p =>
      p.code.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    ).slice(0, 5),
    movements: movements.filter(m =>
      m.productCode.toLowerCase().includes(query) ||
      m.productDescription.toLowerCase().includes(query)
    ).slice(0, 3),
  } : { products: [], movements: [] };

  const hasResults = searchResults.products.length > 0 || searchResults.movements.length > 0;

  const handleProductClick = (productCode: string) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    navigate(`/produtos?search=${encodeURIComponent(productCode)}`);
  };

  const handleMovementClick = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
    navigate(`/movimentacoes`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-border/60 bg-background/80 px-8 backdrop-blur-xl">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Global Search */}
        <div className="relative hidden lg:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar produto ou código..."
            className="h-9 w-60 rounded-lg border-border/60 bg-muted/50 pl-9 pr-8 text-[13px] placeholder:text-muted-foreground/50 focus-visible:bg-background"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => { if (query.length >= 2) setIsSearchOpen(true); }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Dropdown results */}
          {isSearchOpen && query.length >= 2 && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-border bg-popover p-2 shadow-lg">
              {!hasResults ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhum resultado para "{searchQuery}"</p>
              ) : (
                <>
                  {searchResults.products.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Produtos</p>
                      {searchResults.products.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleProductClick(p.code)}
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted transition-colors"
                        >
                          <Package className="h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-xs font-medium">{p.code}</p>
                            <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">Est: {p.currentStock}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.movements.length > 0 && (
                    <div className="mt-1 border-t border-border pt-1">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Movimentações</p>
                      {searchResults.movements.map(m => (
                        <button
                          key={m.id}
                          onClick={handleMovementClick}
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted transition-colors"
                        >
                          <ArrowRightLeft className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-xs font-medium">{m.productCode}</p>
                            <p className="truncate text-xs text-muted-foreground">{m.type} · {m.quantity} · {new Date(m.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
