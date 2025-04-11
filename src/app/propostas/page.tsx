'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { PropostaViewer } from '@/components/propostas/PropostaViewer';
import { PropostaEditor } from '@/components/propostas/PropostaEditor';
import { PropostaDeleteDialog } from '@/components/propostas/PropostaDeleteDialog';
import { getPropostas } from '@/services/propostaService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import type { PropostaBasica } from '@/types/proposta';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PropostasPage() {
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState<PropostaBasica[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewProposta, setViewProposta] = useState<string | null>(null);
  const [editProposta, setEditProposta] = useState<string | null>(null);
  const [deleteProposta, setDeleteProposta] = useState<PropostaBasica | null>(null);

  useEffect(() => {
    loadPropostas();
  }, []);

  const loadPropostas = async () => {
    setLoading(true);
    try {
      const data = await getPropostas();
      setPropostas(data);
    } catch (error) {
      console.error('Erro ao carregar propostas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RASCUNHO':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'ENVIADA':
        return <Badge variant="secondary">Enviada</Badge>;
      case 'APROVADA':
        return <Badge variant="success">Aprovada</Badge>;
      case 'RECUSADA':
        return <Badge variant="destructive">Recusada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Propostas</h1>
        <Button onClick={() => navigate('/propostas/nova')}>
          <Plus className="mr-2 h-4 w-4" /> Nova Proposta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Propostas</CardTitle>
          <CardDescription>
            Visualize, edite ou exclua suas propostas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando propostas...</span>
            </div>
          ) : propostas.length === 0 ? (
            <div className="text-center p-8 border rounded-lg border-dashed">
              <p className="text-muted-foreground">Nenhuma proposta encontrada</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/propostas/nova')}
              >
                <Plus className="mr-2 h-4 w-4" /> Criar Proposta
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propostas.map((proposta) => (
                  <TableRow key={proposta.id}>
                    <TableCell className="font-medium">{proposta.codigo}</TableCell>
                    <TableCell>{proposta.cliente_nome}</TableCell>
                    <TableCell>{proposta.titulo}</TableCell>
                    <TableCell>
                      {proposta.data_criacao && format(new Date(proposta.data_criacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{formatCurrency(proposta.valor_total)}</TableCell>
                    <TableCell>{getStatusBadge(proposta.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setViewProposta(proposta.id)}
                          title="Visualizar proposta"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditProposta(proposta.id)}
                          title="Editar proposta"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteProposta(proposta)}
                          title="Excluir proposta"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {viewProposta && (
        <PropostaViewer 
          propostaId={viewProposta} 
          isOpen={!!viewProposta}
          onClose={() => setViewProposta(null)}
        />
      )}

      {editProposta && (
        <PropostaEditor
          propostaId={editProposta}
          isOpen={!!editProposta}
          onClose={() => setEditProposta(null)}
          onSaveSuccess={loadPropostas}
        />
      )}

      {deleteProposta && (
        <PropostaDeleteDialog
          propostaId={deleteProposta.id}
          propostaCodigo={deleteProposta.codigo}
          propostaTitulo={deleteProposta.titulo}
          isOpen={!!deleteProposta}
          onClose={() => setDeleteProposta(null)}
          onDeleteSuccess={loadPropostas}
        />
      )}
    </div>
  );
} 