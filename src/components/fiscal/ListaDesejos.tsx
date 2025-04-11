import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Heart, HeartOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ListaDesejo {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  valor_estimado: number;
  prioridade: 'baixa' | 'media' | 'alta';
  data_desejada?: string;
  status: 'pendente' | 'aprovado' | 'negado' | 'comprado';
  data_criacao?: string;
}

const formSchema = z.object({
  titulo: z.string().min(3, "Título precisa ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  categoria: z.string().min(1, "Selecione uma categoria"),
  valor_estimado: z.number().min(0, "Valor estimado não pode ser negativo"),
  prioridade: z.enum(["baixa", "media", "alta"]),
  data_desejada: z.string().optional()
});

export function ListaDesejos() {
  const [listaDesejos, setListaDesejos] = useState<ListaDesejo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuscando, setIsBuscando] = useState(true);
  const [itemParaEditar, setItemParaEditar] = useState<ListaDesejo | null>(null);
  const [categorias, setCategorias] = useState([
    'Equipamento', 
    'Software', 
    'Mobiliário', 
    'Material', 
    'Serviço',
    'Outro'
  ]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      categoria: '',
      valor_estimado: 0,
      prioridade: 'media',
      data_desejada: ''
    },
  });
  
  useEffect(() => {
    carregarListaDesejos();
  }, []);
  
  useEffect(() => {
    if (itemParaEditar) {
      form.reset({
        titulo: itemParaEditar.titulo,
        descricao: itemParaEditar.descricao || '',
        categoria: itemParaEditar.categoria,
        valor_estimado: itemParaEditar.valor_estimado,
        prioridade: itemParaEditar.prioridade,
        data_desejada: itemParaEditar.data_desejada || ''
      });
    } else {
      form.reset({
        titulo: '',
        descricao: '',
        categoria: '',
        valor_estimado: 0,
        prioridade: 'media',
        data_desejada: ''
      });
    }
  }, [itemParaEditar, form]);
  
  const carregarListaDesejos = async () => {
    setIsBuscando(true);
    try {
      // Tentar carregar do Supabase
      const { data, error } = await supabase
        .from('lista_desejos')
        .select('*')
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      
      setListaDesejos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lista de desejos:', error);
      // Usar dados de exemplo para desenvolvimento
      setListaDesejos([
        {
          id: '1',
          titulo: 'Notebook para designer',
          descricao: 'MacBook Pro 16 polegadas para o setor de design',
          categoria: 'Equipamento',
          valor_estimado: 15000,
          prioridade: 'alta',
          data_desejada: '2024-06-30',
          status: 'pendente',
          data_criacao: new Date().toISOString()
        },
        {
          id: '2',
          titulo: 'Software de renderização',
          descricao: 'Licença anual do V-Ray para renderização 3D',
          categoria: 'Software',
          valor_estimado: 3500,
          prioridade: 'media',
          data_desejada: '2024-04-15',
          status: 'aprovado',
          data_criacao: new Date().toISOString()
        },
        {
          id: '3',
          titulo: 'Mesa digitalizadora',
          descricao: 'Wacom Intuos Pro para o setor de design',
          categoria: 'Equipamento',
          valor_estimado: 2200,
          prioridade: 'baixa',
          data_desejada: '2024-08-01',
          status: 'pendente',
          data_criacao: new Date().toISOString()
        }
      ]);
    } finally {
      setIsBuscando(false);
    }
  };
  
  const abrirModal = (item?: ListaDesejo) => {
    setItemParaEditar(item || null);
    setIsModalOpen(true);
  };
  
  const fecharModal = () => {
    setIsModalOpen(false);
    setItemParaEditar(null);
    form.reset();
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      const itemDesejo = {
        titulo: values.titulo,
        descricao: values.descricao || null,
        categoria: values.categoria,
        valor_estimado: values.valor_estimado,
        prioridade: values.prioridade,
        data_desejada: values.data_desejada || null,
        status: 'pendente'
      };
      
      if (itemParaEditar) {
        // Atualizar item existente
        const { error } = await supabase
          .from('lista_desejos')
          .update(itemDesejo)
          .eq('id', itemParaEditar.id);
          
        if (error) throw error;
        
        toast.success("Item atualizado com sucesso!");
      } else {
        // Inserir novo item
        const { error } = await supabase
          .from('lista_desejos')
          .insert(itemDesejo);
          
        if (error) throw error;
        
        toast.success("Item adicionado com sucesso!");
      }
      
      fecharModal();
      carregarListaDesejos();
    } catch (error) {
      console.error('Erro ao salvar item da lista de desejos:', error);
      toast.error("Não foi possível salvar o item. Tente novamente.");
      
      // Simulação para desenvolvimento
      if (!itemParaEditar) {
        setListaDesejos([
          {
            id: Math.random().toString(),
            titulo: values.titulo,
            descricao: values.descricao,
            categoria: values.categoria,
            valor_estimado: values.valor_estimado,
            prioridade: values.prioridade,
            data_desejada: values.data_desejada,
            status: 'pendente',
            data_criacao: new Date().toISOString()
          },
          ...listaDesejos
        ]);
      } else {
        setListaDesejos(listaDesejos.map(item => 
          item.id === itemParaEditar.id
            ? {
                ...item,
                titulo: values.titulo,
                descricao: values.descricao,
                categoria: values.categoria,
                valor_estimado: values.valor_estimado,
                prioridade: values.prioridade,
                data_desejada: values.data_desejada
              }
            : item
        ));
      }
      fecharModal();
    } finally {
      setIsLoading(false);
    }
  };
  
  const alterarStatus = async (id: string, novoStatus: 'pendente' | 'aprovado' | 'negado' | 'comprado') => {
    try {
      const { error } = await supabase
        .from('lista_desejos')
        .update({ status: novoStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      setListaDesejos(listaDesejos.map(item => 
        item.id === id ? { ...item, status: novoStatus } : item
      ));
      
      toast.success(`Status do item alterado para ${novoStatus}`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error("Não foi possível alterar o status do item");
      
      // Simulação para desenvolvimento
      setListaDesejos(listaDesejos.map(item => 
        item.id === id ? { ...item, status: novoStatus } : item
      ));
    }
  };
  
  const excluirItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const { error } = await supabase
          .from('lista_desejos')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        setListaDesejos(listaDesejos.filter(item => item.id !== id));
        toast.success("Item excluído com sucesso");
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        toast.error("Não foi possível excluir o item");
        
        // Simulação para desenvolvimento
        setListaDesejos(listaDesejos.filter(item => item.id !== id));
      }
    }
  };
  
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Lista de Desejos</h3>
          <p className="text-sm text-gray-500">
            Registre produtos e serviços desejados para futuras despesas
          </p>
        </div>
        <Button onClick={() => abrirModal()} className="bg-erio-600 hover:bg-erio-700">
          <Plus className="mr-2 h-4 w-4" />
          Novo Desejo
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data Desejada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBuscando ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-erio-500"></div>
                      <span className="ml-2">Carregando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : listaDesejos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    Nenhum item na lista de desejos.
                  </TableCell>
                </TableRow>
              ) : (
                listaDesejos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.titulo}
                      {item.descricao && (
                        <div className="text-xs text-gray-500 mt-1">{item.descricao}</div>
                      )}
                    </TableCell>
                    <TableCell>{item.categoria}</TableCell>
                    <TableCell className="font-medium">{formatarValor(item.valor_estimado)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.prioridade === 'alta' 
                          ? 'bg-red-100 text-red-700' 
                          : item.prioridade === 'media'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.prioridade === 'alta' ? 'Alta' : item.prioridade === 'media' ? 'Média' : 'Baixa'}
                      </span>
                    </TableCell>
                    <TableCell>{item.data_desejada ? new Date(item.data_desejada).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'aprovado' 
                          ? 'bg-green-100 text-green-700' 
                          : item.status === 'negado'
                            ? 'bg-red-100 text-red-700'
                            : item.status === 'comprado'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status === 'aprovado' ? 'Aprovado' : 
                         item.status === 'negado' ? 'Negado' : 
                         item.status === 'comprado' ? 'Comprado' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {item.status === 'pendente' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => alterarStatus(item.id, 'aprovado')}
                            className="h-8 w-8 p-0 text-green-600"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => alterarStatus(item.id, 'pendente')}
                            className="h-8 w-8 p-0 text-gray-600"
                          >
                            <HeartOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => abrirModal(item)}
                          className="h-8 w-8 p-0 text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => excluirItem(item.id)}
                          className="h-8 w-8 p-0 text-red-600"
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
        </CardContent>
      </Card>
      
      {/* Modal para adicionar/editar item */}
      <Dialog open={isModalOpen} onOpenChange={fecharModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{itemParaEditar ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            <DialogDescription>
              {itemParaEditar
                ? 'Edite os detalhes do item desejado abaixo.'
                : 'Adicione um novo item à sua lista de desejos.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Notebook para designer" {...field} />
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
                      <Textarea placeholder="Descreva o item desejado em detalhes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="valor_estimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Estimado</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="data_desejada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Desejada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModal}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-erio-600 hover:bg-erio-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
                      Processando
                    </>
                  ) : (
                    itemParaEditar ? 'Salvar Alterações' : 'Adicionar Item'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 