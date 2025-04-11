
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from "zod";
import { PageLayout } from '@/components/layout/PageLayout';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Cliente } from "@/types";
import { ClienteInput, createCliente, updateCliente, getClientes, deleteCliente } from '@/services/clienteService';
import { ClienteForm, clienteFormSchema } from '@/components/clientes/ClienteForm';
import { ClienteDeleteConfirmation } from '@/components/clientes/ClienteDeleteConfirmation';
import { getClienteColumns } from '@/components/clientes/ClienteTableColumns';

const CadastroClientes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clienteAtual, setClienteAtual] = useState<Cliente | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes
  });

  const createClienteMutation = useMutation({
    mutationFn: (data: ClienteInput) => createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao cadastrar cliente:', error);
    }
  });

  const updateClienteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteInput }) => updateCliente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao atualizar cliente:', error);
    }
  });

  const deleteClienteMutation = useMutation({
    mutationFn: (id: string) => deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setIsDeleting(false);
      setClienteToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir cliente:', error);
      setIsDeleting(false);
    }
  });

  const handleSubmit = (data: ClienteInput) => {
    if (clienteAtual) {
      updateClienteMutation.mutate({
        id: clienteAtual.id,
        data
      });
    } else {
      createClienteMutation.mutate(data);
    }
  };

  const handleEditCliente = (cliente: Cliente) => {
    setClienteAtual(cliente);
    setViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewCliente = (cliente: Cliente) => {
    setClienteAtual(cliente);
    setViewMode(true);
    setIsDialogOpen(true);
  };

  const handleAddCliente = () => {
    setClienteAtual(null);
    setViewMode(false);
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setIsDeleting(true);
  };

  const handleDeleteCliente = () => {
    if (clienteToDelete) {
      deleteClienteMutation.mutate(clienteToDelete.id);
    }
  };

  const closeDeleteDialog = () => {
    setIsDeleting(false);
    setClienteToDelete(null);
  };

  const clienteColumns = getClienteColumns(
    handleViewCliente,
    handleEditCliente,
    handleConfirmDelete
  );

  return (
    <PageLayout title="Clientes">
      <DataTable 
        title="Gestão de Clientes"
        description="Cadastre e gerencie seus clientes"
        columns={clienteColumns}
        data={clientes}
        actions={
          <Button onClick={() => handleAddCliente()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
        onRowClick={handleViewCliente}
        isLoading={isLoading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode
                ? "Detalhes do Cliente"
                : clienteAtual
                ? "Editar Cliente"
                : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {viewMode
                ? "Visualize as informações do cliente."
                : clienteAtual
                ? "Edite as informações do cliente existente."
                : "Preencha as informações para cadastrar um novo cliente."}
            </DialogDescription>
          </DialogHeader>

          <ClienteForm
            clienteAtual={clienteAtual}
            viewMode={viewMode}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isPending={createClienteMutation.isPending || updateClienteMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          
          <ClienteDeleteConfirmation
            cliente={clienteToDelete}
            onConfirm={handleDeleteCliente}
            onCancel={closeDeleteDialog}
            isPending={deleteClienteMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default CadastroClientes;
