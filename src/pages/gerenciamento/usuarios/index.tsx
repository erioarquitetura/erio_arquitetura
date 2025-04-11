import { useState, useEffect } from 'react';
import { PlusCircle, Search, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { UsuarioFormModal } from '@/components/usuarios/UsuarioFormModal';
import { listarUsuarios, excluirUsuario } from '@/services/usuarioService';
import { Usuario, UsuarioComPermissoes } from '@/types/usuario';
import { toast } from 'sonner';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioComPermissoes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExcluindoDialogOpen, setIsExcluindoDialogOpen] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioComPermissoes | null>(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setIsLoading(true);
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Falha ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (usuario?: UsuarioComPermissoes) => {
    setUsuarioAtual(usuario || null);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (usuario: UsuarioComPermissoes) => {
    setUsuarioAtual(usuario);
    setIsExcluindoDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!usuarioAtual) return;
    
    try {
      await excluirUsuario(usuarioAtual.id);
      toast.success('Usuário excluído com sucesso!');
      setIsExcluindoDialogOpen(false);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Falha ao excluir usuário');
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => (
    usuario.nome_completo.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.nome_usuario.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.email.toLowerCase().includes(filtro.toLowerCase())
  ));

  const getTipoUsuarioBadge = (tipo: string) => {
    switch (tipo) {
      case 'administrador':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Administrador</Badge>;
      case 'gerente':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Gerente</Badge>;
      case 'usuario':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Usuário</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{tipo}</Badge>;
    }
  };

  return (
    <PageLayout title="Usuários">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Usuários</CardTitle>
              <CardDescription>
                Gerencie todos os usuários do sistema
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenFormModal()} className="bg-erio-500 hover:bg-erio-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row mb-4 justify-between">
              <div className="w-full md:w-1/2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filtrar usuários..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full pl-9"
                  />
                </div>
              </div>
              {filtro && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setFiltro('')}
                  className="h-10 w-10 p-0 md:ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-erio-500"></div>
                <span className="ml-2">Carregando...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>Nome de Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuariosFiltrados.map((usuario) => (
                        <TableRow key={usuario.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {usuario.nome_completo}
                          </TableCell>
                          <TableCell>
                            {usuario.nome_usuario}
                          </TableCell>
                          <TableCell>
                            {usuario.email}
                          </TableCell>
                          <TableCell>
                            {getTipoUsuarioBadge(usuario.tipo_usuario)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFormModal(usuario);
                                }}
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteModal(usuario);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de criação/edição de usuário */}
      <UsuarioFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        usuario={usuarioAtual}
        onSuccess={carregarUsuarios}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={isExcluindoDialogOpen} onOpenChange={setIsExcluindoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsExcluindoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
} 