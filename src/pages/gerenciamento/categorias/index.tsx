import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageLayout } from '@/components/layout/PageLayout';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  listarCategoriasReceitas, 
  criarCategoriaReceita, 
  atualizarCategoriaReceita, 
  excluirCategoriaReceita 
} from '@/services/categoriaReceitaService';
import { CategoriaReceita } from '@/types/categoriaReceita';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome precisa ter pelo menos 2 caracteres').max(50, 'Nome não pode ter mais de 50 caracteres'),
  descricao: z.string().max(200, 'Descrição não pode ter mais de 200 caracteres').optional(),
});

export default function GerenciamentoCategorias() {
  const [categorias, setCategorias] = useState<CategoriaReceita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExcluindoDialogOpen, setIsExcluindoDialogOpen] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState<CategoriaReceita | null>(null);
  const [filtro, setFiltro] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
    },
  });

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    setIsLoading(true);
    try {
      const data = await listarCategoriasReceitas();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Falha ao carregar categorias de receitas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (categoria?: CategoriaReceita) => {
    if (categoria) {
      setCategoriaAtual(categoria);
      form.reset({
        nome: categoria.nome,
        descricao: categoria.descricao || '',
      });
    } else {
      setCategoriaAtual(null);
      form.reset({
        nome: '',
        descricao: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteModal = (categoria: CategoriaReceita) => {
    setCategoriaAtual(categoria);
    setIsExcluindoDialogOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (categoriaAtual) {
        await atualizarCategoriaReceita(categoriaAtual.id, values);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await criarCategoriaReceita(values);
        toast.success('Categoria criada com sucesso!');
      }
      setIsDialogOpen(false);
      carregarCategorias();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Falha ao salvar categoria');
    }
  };

  const handleDelete = async () => {
    if (!categoriaAtual) return;
    
    try {
      await excluirCategoriaReceita(categoriaAtual.id);
      toast.success('Categoria excluída com sucesso!');
      setIsExcluindoDialogOpen(false);
      carregarCategorias();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Falha ao excluir categoria');
    }
  };

  const categoriasFiltradas = categorias.filter(categoria => 
    categoria.nome.toLowerCase().includes(filtro.toLowerCase()) || 
    (categoria.descricao && categoria.descricao.toLowerCase().includes(filtro.toLowerCase()))
  );

  return (
    <PageLayout title="Categorias de Receitas">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Categorias de Receitas</CardTitle>
              <CardDescription>
                Gerencie as categorias para classificar suas receitas
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-erio-500 hover:bg-erio-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Filtrar categorias..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="max-w-sm"
              />
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoriasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          Nenhuma categoria encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoriasFiltradas.map((categoria) => (
                        <TableRow key={categoria.id}>
                          <TableCell className="font-medium">{categoria.nome}</TableCell>
                          <TableCell>{categoria.descricao || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleOpenModal(categoria)}
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleOpenDeleteModal(categoria)}
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

        {/* Modal de criar/editar categoria */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{categoriaAtual ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              <DialogDescription>
                {categoriaAtual
                  ? 'Atualize os detalhes da categoria de receita'
                  : 'Preencha os detalhes para criar uma nova categoria de receita'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da categoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descrição (opcional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-erio-500 hover:bg-erio-600">
                    {categoriaAtual ? 'Salvar Alterações' : 'Criar Categoria'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmação de exclusão */}
        <Dialog open={isExcluindoDialogOpen} onOpenChange={setIsExcluindoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Categoria</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a categoria "{categoriaAtual?.nome}"?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExcluindoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
} 