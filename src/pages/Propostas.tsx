import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Pencil, Plus, Trash2, FileDown, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatarMoeda } from "@/lib/formatters";
import { listarPropostas } from '@/services/propostaService';
import { PropostaViewer } from '@/components/propostas/PropostaViewer';
import { PropostaEditor } from '@/components/propostas/PropostaEditor';
import { PropostaDeleteDialog } from '@/components/propostas/PropostaDeleteDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Proposta {
  id: string;
  codigo: string;
  titulo: string;
  cliente?: {
    nome: string;
  };
  valor_total: number;
  data_criacao: string;
  status: string;
}

const Propostas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar a visualização, edição e exclusão
  const [selectedPropostaId, setSelectedPropostaId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPropostaDetails, setSelectedPropostaDetails] = useState<{
    id: string;
    codigo: string;
    titulo: string;
  } | null>(null);
  
  useEffect(() => {
    loadPropostas();
  }, []);
  
  const loadPropostas = async () => {
    setLoading(true);
    try {
      const data = await listarPropostas();
      setPropostas(data);
    } catch (error) {
      console.error('Erro ao carregar propostas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'enviada':
        return 'default';
      case 'aprovada':
        return 'success';
      case 'rejeitada':
        return 'destructive';
      case 'vencida':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };
  
  const handleViewProposta = (propostaId: string) => {
    setSelectedPropostaId(propostaId);
    setIsViewModalOpen(true);
  };
  
  const handleEditProposta = (propostaId: string) => {
    setSelectedPropostaId(propostaId);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteProposta = (proposta: { id: string; codigo: string; titulo: string }) => {
    setSelectedPropostaDetails(proposta);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateNewProposta = () => {
    navigate('/propostas/nova');
  };

  const filteredPropostas = propostas.filter(proposta => {
    const searchLower = searchTerm.toLowerCase();
    const codigo = proposta.codigo?.toLowerCase() || '';
    const titulo = proposta.titulo?.toLowerCase() || '';
    const cliente = proposta.cliente?.nome?.toLowerCase() || '';
    
    return (
      codigo.includes(searchLower) ||
      titulo.includes(searchLower) ||
      cliente.includes(searchLower)
    );
  });

  return (
    <PageLayout title="Propostas">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Gestão de Propostas</h2>
                <p className="text-muted-foreground">Crie e gerencie propostas de orçamento para seus clientes</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Input
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-8"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="icon"
                  title="Exportar"
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
                  size="icon"
                  title="Imprimir"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                
                <Button onClick={handleCreateNewProposta}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Proposta
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Código</th>
                    <th className="px-4 py-3 text-left font-medium">Título</th>
                    <th className="px-4 py-3 text-left font-medium">Cliente</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-center font-medium">Data de Criação</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">Carregando propostas...</p>
                      </td>
                    </tr>
                  ) : filteredPropostas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <p className="text-muted-foreground">Nenhuma proposta encontrada.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPropostas.map((proposta) => (
                      <tr key={proposta.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">{proposta.codigo}</td>
                        <td className="px-4 py-3">{proposta.titulo}</td>
                        <td className="px-4 py-3">{proposta.cliente?.nome}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatarMoeda(proposta.valor_total)}</td>
                        <td className="px-4 py-3 text-center">{formatDate(proposta.data_criacao)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={getStatusBadgeVariant(proposta.status)} className="capitalize">
                            {proposta.status || 'rascunho'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewProposta(proposta.id)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProposta(proposta.id)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4 text-amber-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProposta({
                                id: proposta.id,
                                codigo: proposta.codigo,
                                titulo: proposta.titulo
                              })}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <p>Mostrando 1 a {filteredPropostas.length} de {filteredPropostas.length} registros</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button variant="outline" size="sm">Página 1 de 1</Button>
                <Button variant="outline" size="icon" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modais de Visualização, Edição e Exclusão */}
      {selectedPropostaId && (
        <PropostaViewer
          propostaId={selectedPropostaId}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
      
      {selectedPropostaId && (
        <PropostaEditor
          propostaId={selectedPropostaId}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaveSuccess={() => {
            loadPropostas();
            setIsEditModalOpen(false);
          }}
        />
      )}
      
      {selectedPropostaDetails && (
        <PropostaDeleteDialog
          propostaId={selectedPropostaDetails.id}
          propostaCodigo={selectedPropostaDetails.codigo}
          propostaTitulo={selectedPropostaDetails.titulo}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleteSuccess={loadPropostas}
        />
      )}
    </PageLayout>
  );
};

export default Propostas;
