import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageLayout } from '@/components/layout/PageLayout';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  listarCategoriasDespesas, 
  criarCategoriaDespesa, 
  atualizarCategoriaDespesa, 
  excluirCategoriaDespesa 
} from '@/services/categoriaDespesaService';
import { CategoriaDespesa } from '@/types/categoriaDespesa';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome precisa ter pelo menos 2 caracteres').max(50, 'Nome não pode ter mais de 50 caracteres'),
  descricao: z.string().max(200, 'Descrição não pode ter mais de 200 caracteres').optional(),
  despesa_fixa: z.boolean().default(false),
  despesa_fiscal: z.boolean().default(false),
});

export default function GerenciamentoCategoriasDespesas() {
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExcluindoDialogOpen, setIsExcluindoDialogOpen] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState<CategoriaDespesa | null>(null);
  const [filtro, setFiltro] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      despesa_fixa: false,
      despesa_fiscal: false,
    },
  });

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    setIsLoading(true);
    try {
      const data = await listarCategoriasDespesas();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Falha ao carregar categorias de despesas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (categoria?: CategoriaDespesa) => {
    if (categoria) {
      setCategoriaAtual(categoria);
      form.reset({
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        despesa_fixa: categoria.despesa_fixa,
        despesa_fiscal: categoria.despesa_fiscal,
      });
    } else {
      setCategoriaAtual(null);
      form.reset({
        nome: '',
        descricao: '',
        despesa_fixa: false,
        despesa_fiscal: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteModal = (categoria: CategoriaDespesa) => {
    setCategoriaAtual(categoria);
    setIsExcluindoDialogOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (categoriaAtual) {
        await atualizarCategoriaDespesa(categoriaAtual.id, {
          nome: values.nome,
          descricao: values.descricao,
          despesa_fixa: values.despesa_fixa,
          despesa_fiscal: values.despesa_fiscal,
        });
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await criarCategoriaDespesa({
          nome: values.nome,
          descricao: values.descricao,
          despesa_fixa: values.despesa_fixa,
          despesa_fiscal: values.despesa_fiscal,
        });
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
      await excluirCategoriaDespesa(categoriaAtual.id);
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
    <PageLayout title="Categorias de Despesas">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Categorias de Despesas</CardTitle>
              <CardDescription>
                Gerencie as categorias para classificar suas despesas
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fiscal</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoriasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Nenhuma categoria encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoriasFiltradas.map((categoria) => (
                        <TableRow key={categoria.id}>
                          <TableCell className="font-medium">{categoria.nome}</TableCell>
                          <TableCell>{categoria.descricao || '-'}</TableCell>
                          <TableCell>{categoria.despesa_fixa ? 'Fixa' : 'Variável'}</TableCell>
                          <TableCell>{categoria.despesa_fiscal ? 'Sim' : 'Não'}</TableCell>
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
              <DialogTitle>
                {categoriaAtual ? 'Editar Categoria' : 'Nova Categoria de Despesa'}
              </DialogTitle>
              <DialogDescription>
                {categoriaAtual
                  ? 'Edite os detalhes da categoria de despesa'
                  : 'Preencha as informações para criar uma nova categoria de despesa'}
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
                        <Input placeholder="Nome da categoria" {...field} />
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
                        <Input placeholder="Descrição da categoria (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="despesa_fixa"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Despesa Fixa</FormLabel>
                          <FormDescription className="text-xs">
                            Marque se for uma despesa de valor fixo
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="despesa_fiscal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Despesa Fiscal</FormLabel>
                          <FormDescription className="text-xs">
                            Marque se for uma despesa fiscal
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
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
                Tem certeza que deseja excluir a categoria{' '}
                <strong>{categoriaAtual?.nome}</strong>? Esta ação não pode ser desfeita.
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
      </div>
    </PageLayout>
  );
} 