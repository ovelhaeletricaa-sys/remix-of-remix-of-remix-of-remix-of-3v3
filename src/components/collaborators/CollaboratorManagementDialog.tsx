import { useState } from 'react';
import { Plus, Pencil, Trash2, Lock, Unlock, Users, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useInventoryContext } from '@/contexts/InventoryContext';
import type { Collaborator, CollaboratorRole, CollaboratorBlockReason } from '@/types/inventory';
import { COLLABORATOR_BLOCK_REASONS } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';

const ROLE_OPTIONS: { value: CollaboratorRole; label: string }[] = [
  { value: 'ANALISTA_ESTOQUE', label: 'Analista de Estoque' },
  { value: 'ALMOXARIFE', label: 'Almoxarife' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'OPERADOR', label: 'Operador' },
];

const ROLE_LABELS: Record<CollaboratorRole, string> = {
  ANALISTA_ESTOQUE: 'Analista de Estoque',
  ALMOXARIFE: 'Almoxarife',
  SUPERVISOR: 'Supervisor',
  GERENTE: 'Gerente',
  OPERADOR: 'Operador',
};

export function CollaboratorManagementDialog() {
  const {
    collaborators, addCollaborator, updateCollaborator, deleteCollaborator,
    blockCollaborator, unblockCollaborator, movements,
  } = useInventoryContext();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaborator | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [blockingCollab, setBlockingCollab] = useState<Collaborator | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'OPERADOR' as CollaboratorRole,
  });

  const [blockData, setBlockData] = useState({
    reason: '' as CollaboratorBlockReason | '',
    customReason: '',
  });

  const activeCollabs = collaborators.filter(c => !c.isBlocked);
  const blockedCollabs = collaborators.filter(c => c.isBlocked);

  const openAddForm = () => {
    setEditingCollab(null);
    setFormData({ name: '', role: 'OPERADOR' });
    setIsFormOpen(true);
  };

  const openEditForm = (collab: Collaborator) => {
    setEditingCollab(collab);
    setFormData({ name: collab.name, role: collab.role });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }

    if (editingCollab) {
      updateCollaborator(editingCollab.id, { name: formData.name.toUpperCase(), role: formData.role });
      toast({ title: 'Colaborador atualizado' });
    } else {
      addCollaborator({ name: formData.name.toUpperCase(), role: formData.role, isActive: true });
      toast({ title: 'Colaborador adicionado' });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (collab: Collaborator) => {
    const hasMovements = movements.some(m => m.collaborator === collab.name);
    if (hasMovements) {
      toast({
        title: 'Não é possível excluir',
        description: 'Este colaborador possui movimentações vinculadas. Use o bloqueio.',
        variant: 'destructive',
      });
      return;
    }
    deleteCollaborator(collab.id);
    toast({ title: 'Colaborador excluído' });
  };

  const openBlockDialog = (collab: Collaborator) => {
    setBlockingCollab(collab);
    setBlockData({ reason: '', customReason: '' });
    setIsBlockOpen(true);
  };

  const handleBlock = () => {
    if (!blockingCollab || !blockData.reason) {
      toast({ title: 'Selecione um motivo', variant: 'destructive' });
      return;
    }
    blockCollaborator(
      blockingCollab.id,
      blockData.reason,
      blockData.reason === 'OUTROS' ? blockData.customReason : undefined,
    );
    toast({ title: `${blockingCollab.name} bloqueado`, description: COLLABORATOR_BLOCK_REASONS.find(r => r.value === blockData.reason)?.label });
    setIsBlockOpen(false);
    setBlockingCollab(null);
  };

  const handleUnblock = (collab: Collaborator) => {
    unblockCollaborator(collab.id);
    toast({ title: `${collab.name} desbloqueado` });
  };

  const getBlockReasonLabel = (collab: Collaborator) => {
    if (collab.blockReason === 'OUTROS') return collab.blockReasonCustom || 'Outros';
    return COLLABORATOR_BLOCK_REASONS.find(r => r.value === collab.blockReason)?.label || '';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
            <Users className="h-[18px] w-[18px]" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Colaboradores
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{activeCollabs.length} ativos · {blockedCollabs.length} bloqueados</p>
              <Button size="sm" onClick={openAddForm} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Novo
              </Button>
            </div>

            {/* Active collaborators */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ativos</h4>
              {activeCollabs.map(collab => (
                <div key={collab.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{collab.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {ROLE_LABELS[collab.role] || collab.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(collab)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-warning" onClick={() => openBlockDialog(collab)}>
                      <Lock className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir {collab.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Se o colaborador tem movimentações, use o bloqueio.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(collab)} className="bg-destructive text-destructive-foreground">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>

            {/* Blocked collaborators */}
            {blockedCollabs.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Bloqueados
                </h4>
                {blockedCollabs.map(collab => (
                  <div key={collab.id} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground line-through">{collab.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {ROLE_LABELS[collab.role] || collab.role}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-destructive">
                        {getBlockReasonLabel(collab)}
                        {collab.blockedAt && ` · ${new Date(collab.blockedAt).toLocaleDateString('pt-BR')}`}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleUnblock(collab)}>
                      <Unlock className="h-3 w-3" />
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCollab ? 'Editar' : 'Novo'} Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome do colaborador"
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={formData.role} onValueChange={v => setFormData(f => ({ ...f, role: v as CollaboratorRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave}>
              {editingCollab ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-warning" />
              Bloquear {blockingCollab?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo do Bloqueio</Label>
              <Select value={blockData.reason} onValueChange={v => setBlockData(f => ({ ...f, reason: v as CollaboratorBlockReason }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                <SelectContent>
                  {COLLABORATOR_BLOCK_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {blockData.reason === 'OUTROS' && (
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={blockData.customReason}
                  onChange={e => setBlockData(f => ({ ...f, customReason: e.target.value }))}
                  placeholder="Descreva o motivo..."
                  rows={2}
                />
              </div>
            )}
            <Button className="w-full bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleBlock}>
              Confirmar Bloqueio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
