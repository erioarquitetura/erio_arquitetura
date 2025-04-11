import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PropostaForm } from './PropostaForm';
import { getPropostaCompleta, updateProposta } from '@/services/propostaService';
import { PropostaCompleta } from "@/types/proposal";

interface PropostaEditorProps {
  propostaId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export function PropostaEditor({ propostaId, isOpen, onClose, onSaveSuccess }: PropostaEditorProps) {
  const [loading, setLoading] = useState(false);
  const [proposta, setProposta] = useState<PropostaCompleta | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && propostaId) {
      setLoading(true);
      setError(null);
      
      getPropostaCompleta(propostaId)
        .then(data => {
          if (data) {
            setProposta(data);
          } else {
            setError('Proposta não encontrada');
          }
        })
        .catch(err => {
          console.error('Erro ao carregar proposta:', err);
          setError('Erro ao carregar dados da proposta');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, propostaId]);
  
  const handleSave = async (data: PropostaCompleta) => {
    setLoading(true);
    try {
      // Definir o status como rascunho para permitir que o cliente veja a proposta novamente
      const propostaAtualizada: PropostaCompleta = {
        ...data,
        status: 'rascunho'
      };
      
      const success = await updateProposta(propostaId, propostaAtualizada);
      if (success) {
        toast.success('Proposta atualizada com sucesso!');
        toast.info('Status alterado para "Rascunho". A proposta está disponível para compartilhamento.');
        onSaveSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Erro ao salvar proposta:', err);
      toast.error('Erro ao salvar proposta');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proposta</DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando...</span>
          </div>
        )}
        
        {error && (
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">{error}</p>
            <Button variant="secondary" onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        )}
        
        {!loading && !error && proposta && (
          <PropostaForm 
            initialData={proposta} 
            isEditing={true} 
            onSave={handleSave}
            isSubmitting={loading}
          />
        )}
        
        {!loading && !error && !proposta && (
          <div className="p-4 border border-amber-300 bg-amber-50 text-amber-700 rounded-md">
            <p className="font-medium">Proposta não encontrada</p>
            <Button variant="secondary" onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 