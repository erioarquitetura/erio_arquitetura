import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/layout/PageLayout';
import { PlusCircle, Search, Pencil, Trash2, Landmark, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarBancos, excluirBanco } from '@/services/bancoService';
import { Banco, TipoChavePix, TipoFavorecido } from '@/types/banco';
import { toast } from 'sonner';
import { BancoForm } from '@/components/bancos/BancoForm';

export default function BancosPage() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bancoAtual, setBancoAtual] = useState<Banco | null>(null);
  
  useEffect(() => {
    carregarBancos();
  }, []);

  const carregarBancos = async () => {
    setIsLoading(true);
    try {
      const data = await listarBancos();
      setBancos(data);
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
      toast.error('Falha ao carregar bancos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (banco?: Banco) => {
    setBancoAtual(banco || null);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteDialog = (banco: Banco) => {
    setBancoAtual(banco);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!bancoAtual) return;
    
    try {
      const sucesso = await excluirBanco(bancoAtual.id);
      if (sucesso) {
        toast.success('Banco excluído com sucesso');
        carregarBancos();
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro ao excluir banco:', error);
      toast.error('Falha ao excluir banco');
    }
  };

  const formatarTipoChavePix = (tipo: TipoChavePix): string => {
    switch (tipo) {
      case 'cpf':
        return 'CPF';
      case 'cnpj':
        return 'CNPJ';
      case 'telefone':
        return 'Telefone';
      case 'email':
        return 'E-mail';
      case 'aleatoria':
        return 'Chave Aleatória';
      default:
        return tipo;
    }
  };

  const formatarTipoFavorecido = (tipo: TipoFavorecido): string => {
    switch (tipo) {
      case 'cpf':
        return 'Pessoa Física (CPF)';
      case 'cnpj':
        return 'Pessoa Jurídica (CNPJ)';
      default:
        return tipo;
    }
  };

  const bancosFiltrados = bancos.filter(banco => {
    const termoLower = filtro.toLowerCase();
    return (
      banco.nome.toLowerCase().includes(termoLower) ||
      banco.codigo.toLowerCase().includes(termoLower) ||
      banco.nome_favorecido.toLowerCase().includes(termoLower)
    );
  });

  return (
    <PageLayout title="Financeiro">
      <div className="container mx-auto py-6 px-4">
        <Tabs defaultValue="bancos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="bancos">Bancos</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bancos" className="mt-6">
            <Card className="bg-white shadow-sm border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between bg-erio-50 border-b pb-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-erio-800">Bancos</CardTitle>
                  <CardDescription className="text-erio-600">
                    Gerencie os bancos para transações financeiras
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenFormModal()} className="bg-erio-600 hover:bg-erio-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Banco
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-white border-b">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar bancos..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="pl-8 border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center p-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-erio-600"></div>
                    <span className="ml-3 text-lg text-gray-600">Carregando bancos...</span>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-b-md">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Nome</TableHead>
                          <TableHead className="font-semibold">Código</TableHead>
                          <TableHead className="font-semibold">Agência</TableHead>
                          <TableHead className="font-semibold">Conta</TableHead>
                          <TableHead className="font-semibold">Tipo de Chave PIX</TableHead>
                          <TableHead className="font-semibold">Favorecido</TableHead>
                          <TableHead className="font-semibold text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bancosFiltrados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Landmark className="h-8 w-8 mb-2 text-gray-400" />
                                <p className="font-medium">Nenhum banco encontrado</p>
                                <p className="text-sm">Tente ajustar o filtro ou cadastre um novo banco</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          bancosFiltrados.map((banco) => (
                            <TableRow key={banco.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium flex items-center">
                                <div className="bg-erio-50 p-1.5 rounded-full mr-2">
                                  <Landmark className="h-4 w-4 text-erio-600" />
                                </div>
                                {banco.nome}
                              </TableCell>
                              <TableCell>{banco.codigo}</TableCell>
                              <TableCell>{banco.agencia}</TableCell>
                              <TableCell>{banco.conta}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
                                >
                                  {formatarTipoChavePix(banco.tipo_chave_pix)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{banco.nome_favorecido}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatarTipoFavorecido(banco.tipo_favorecido)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenFormModal(banco)}
                                    title="Editar"
                                    className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDeleteDialog(banco)}
                                    title="Excluir"
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
          </TabsContent>
          
          <TabsContent value="categorias" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>
                  Gerencie as categorias de receitas e despesas (em desenvolvimento)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Esta funcionalidade será implementada em breve</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de criação/edição de banco */}
        <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="banco-form-description">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="text-2xl font-bold text-erio-600">
                {bancoAtual ? 'Editar Banco' : 'Novo Banco'}
              </DialogTitle>
              <DialogDescription id="banco-form-description" className="text-gray-500">
                {bancoAtual 
                  ? 'Atualize as informações do banco' 
                  : 'Preencha os detalhes para cadastrar um novo banco'}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <BancoForm 
                banco={bancoAtual} 
                onSuccess={() => {
                  carregarBancos();
                  setIsFormModalOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="border-red-100">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Excluir Banco</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este banco?
                <p className="font-medium mt-2">Esta ação não pode ser desfeita.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-300">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
} 