import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { deleteProposta } from '@/services/propostaService';

interface PropostaDeleteDialogProps {
  propostaId: string;
  propostaCodigo: string;
  propostaTitulo: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleteSuccess?: () => void;
}

export function PropostaDeleteDialog({
  propostaId,
  propostaCodigo,
  propostaTitulo,
  isOpen,
  onClose,
  onDeleteSuccess
}: PropostaDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const success = await deleteProposta(propostaId);
      if (success) {
        onDeleteSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Erro ao excluir proposta:', err);
      toast.error('Erro ao excluir proposta');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a excluir a proposta <strong>{propostaCodigo}</strong> - "{propostaTitulo}".
            <br /><br />
            Esta ação não pode ser desfeita. Todos os dados relacionados a esta proposta serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir proposta'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 