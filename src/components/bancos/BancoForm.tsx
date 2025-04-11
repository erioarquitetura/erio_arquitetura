import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Landmark, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";

import { Banco, TipoChavePix, TipoFavorecido, BancoFormValues } from '@/types/banco';
import { criarBanco, atualizarBanco } from '@/services/bancoService';
import { toast } from 'sonner';

interface BancoFormProps {
  banco?: Banco | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  nome: z.string().min(1, 'Nome do banco é obrigatório'),
  codigo: z.string().min(1, 'Código do banco é obrigatório'),
  agencia: z.string().min(1, 'Agência é obrigatória'),
  conta: z.string().min(1, 'Conta é obrigatória'),
  tipo_chave_pix: z.enum(['cpf', 'cnpj', 'telefone', 'email', 'aleatoria']),
  chave_pix: z.string().min(1, 'Chave PIX é obrigatória'),
  nome_favorecido: z.string().min(1, 'Nome do favorecido é obrigatório'),
  tipo_favorecido: z.enum(['cpf', 'cnpj']),
});

type FormValues = z.infer<typeof formSchema>;

export function BancoForm({ banco, onSuccess }: BancoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTipoChavePix, setSelectedTipoChavePix] = useState<TipoChavePix>(
    banco?.tipo_chave_pix || 'cpf'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: banco?.nome || '',
      codigo: banco?.codigo || '',
      agencia: banco?.agencia || '',
      conta: banco?.conta || '',
      tipo_chave_pix: banco?.tipo_chave_pix || 'cpf',
      chave_pix: banco?.chave_pix || '',
      nome_favorecido: banco?.nome_favorecido || '',
      tipo_favorecido: banco?.tipo_favorecido || 'cpf',
    },
  });

  // Obtém o tipo de chave PIX quando é alterado no formulário
  const watchTipoChavePix = form.watch('tipo_chave_pix');
  if (watchTipoChavePix !== selectedTipoChavePix) {
    setSelectedTipoChavePix(watchTipoChavePix);
  }

  // Retorna o placeholder adequado para o tipo de chave PIX selecionado
  const getChavePixPlaceholder = (): string => {
    switch (selectedTipoChavePix) {
      case 'cpf':
        return 'Digite o CPF (apenas números)';
      case 'cnpj':
        return 'Digite o CNPJ (apenas números)';
      case 'telefone':
        return 'Digite o telefone com DDD (apenas números)';
      case 'email':
        return 'Digite o email';
      case 'aleatoria':
        return 'Digite a chave aleatória';
      default:
        return 'Digite a chave PIX';
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Garantir que todos os campos necessários estão preenchidos para o BancoFormValues
      const bancoData: BancoFormValues = {
        nome: values.nome,
        codigo: values.codigo,
        agencia: values.agencia,
        conta: values.conta,
        tipo_chave_pix: values.tipo_chave_pix,
        chave_pix: values.chave_pix,
        nome_favorecido: values.nome_favorecido,
        tipo_favorecido: values.tipo_favorecido,
      };

      if (banco?.id) {
        // Atualizar banco existente
        await atualizarBanco(banco.id, bancoData);
        toast.success('Banco atualizado com sucesso!');
      } else {
        // Criar novo banco
        await criarBanco(bancoData);
        toast.success('Banco cadastrado com sucesso!');
      }
      onSuccess();
      form.reset();
    } catch (error) {
      console.error('Erro ao salvar banco:', error);
      toast.error('Erro ao salvar dados do banco. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações do Banco */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="h-5 w-5 text-erio-600" />
                <h3 className="text-lg font-medium text-erio-700">Dados do Banco</h3>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nome do Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Banco do Brasil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Código do Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="agencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Agência</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 12345-6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do PIX */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-erio-600" />
                <h3 className="text-lg font-medium text-erio-700">Dados do PIX</h3>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo_chave_pix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Tipo de Chave PIX</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de chave PIX" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="telefone">Telefone</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chave_pix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Chave PIX</FormLabel>
                      <FormControl>
                        <Input placeholder={getChavePixPlaceholder()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nome_favorecido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nome do Favorecido</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do favorecido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_favorecido"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-700">Tipo de Favorecido</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cpf" id="cpf" />
                            <label htmlFor="cpf" className="text-sm font-medium">
                              Pessoa Física (CPF)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cnpj" id="cnpj" />
                            <label htmlFor="cnpj" className="text-sm font-medium">
                              Pessoa Jurídica (CNPJ)
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button 
            type="submit" 
            className="bg-erio-600 hover:bg-erio-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {banco ? 'Atualizando...' : 'Cadastrando...'}
              </>
            ) : (
              <>{banco ? 'Atualizar Banco' : 'Cadastrar Banco'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 