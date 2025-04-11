
import { Cliente } from "@/types";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

type ClienteDeleteConfirmationProps = {
  cliente: Cliente | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
};

export function ClienteDeleteConfirmation({
  cliente,
  onConfirm,
  onCancel,
  isPending
}: ClienteDeleteConfirmationProps) {
  return (
    <div>
      <p className="mb-4">
        Deseja realmente excluir o cliente {cliente?.nome}? Esta ação não pode ser desfeita.
      </p>
      
      <DialogFooter className="space-x-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          variant="destructive"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? "Excluindo..." : "Sim, excluir"}
        </Button>
      </DialogFooter>
    </div>
  );
}
