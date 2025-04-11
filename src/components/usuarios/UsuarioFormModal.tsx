import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, User, Lock, ShieldCheck } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import { Usuario, UsuarioComPermissoes, UsuarioFormValues } from '@/types/usuario';
import { criarUsuario, atualizarUsuario } from '@/services/usuarioService';

// Schema de validação do formulário
const permissoesSchema = z.object({
  cadastros: z.boolean().default(false),
  financeiro: z.boolean().default(false),
  fiscal: z.boolean().default(false),
  propostas: z.boolean().default(false),
  relatorios: z.boolean().default(false),
  gerenciamento: z.boolean().default(false),
  teste_conexao: z.boolean().default(false),
});

const userFormSchema = z.object({
  nome_completo: z.string({
    required_error: 'Nome completo é obrigatório',
  }).min(3, 'Nome completo deve ter no mínimo 3 caracteres').max(100, 'Nome completo não pode ultrapassar 100 caracteres'),
  
  nome_usuario: z.string({
    required_error: 'Nome de usuário é obrigatório',
  }).min(3, 'Nome de usuário deve ter no mínimo 3 caracteres').max(50, 'Nome de usuário não pode ultrapassar 50 caracteres'),
  
  email: z.string({
    required_error: 'E-mail é obrigatório',
  }).email('E-mail inválido'),
  
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100, 'Senha não pode ultrapassar 100 caracteres'),
  
  confirmar_senha: z.string(),
  
  tipo_usuario: z.enum(['administrador', 'gerente', 'usuario'], {
    required_error: 'Tipo de usuário é obrigatório',
  }),
  
  permissoes: permissoesSchema,
}).refine((data) => data.senha === data.confirmar_senha, {
  message: 'As senhas não conferem',
  path: ['confirmar_senha'],
});

// Criar outro schema para edição onde senha é opcional
const userEditFormSchema = z.object({
  nome_completo: z.string({
    required_error: 'Nome completo é obrigatório',
  }).min(3, 'Nome completo deve ter no mínimo 3 caracteres').max(100, 'Nome completo não pode ultrapassar 100 caracteres'),
  
  nome_usuario: z.string({
    required_error: 'Nome de usuário é obrigatório',
  }).min(3, 'Nome de usuário deve ter no mínimo 3 caracteres').max(50, 'Nome de usuário não pode ultrapassar 50 caracteres'),
  
  email: z.string({
    required_error: 'E-mail é obrigatório',
  }).email('E-mail inválido'),
  
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100, 'Senha não pode ultrapassar 100 caracteres').optional().or(z.literal('')),
  
  confirmar_senha: z.string().optional().or(z.literal('')),
  
  tipo_usuario: z.enum(['administrador', 'gerente', 'usuario'], {
    required_error: 'Tipo de usuário é obrigatório',
  }),
  
  permissoes: permissoesSchema,
}).refine((data) => !data.senha || data.senha === data.confirmar_senha, {
  message: 'As senhas não conferem',
  path: ['confirmar_senha'],
});

// Tipo inferido do formulário
type UserFormValues = z.infer<typeof userFormSchema>;
type UserEditFormValues = z.infer<typeof userEditFormSchema>;

interface UsuarioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: UsuarioComPermissoes | null;
  onSuccess: () => void;
}

export function UsuarioFormModal({ open, onOpenChange, usuario, onSuccess }: UsuarioFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdicao = !!usuario;

  // Inicializa o formulário com o resolver do Zod adequado para edição ou criação
  const form = useForm<UserFormValues | UserEditFormValues>({
    resolver: zodResolver(isEdicao ? userEditFormSchema : userFormSchema),
    defaultValues: {
      nome_completo: '',
      nome_usuario: '',
      email: '',
      senha: '',
      confirmar_senha: '',
      tipo_usuario: 'usuario' as const,
      permissoes: {
        cadastros: false,
        financeiro: false,
        fiscal: false,
        propostas: false,
        relatorios: false,
        gerenciamento: false,
        teste_conexao: false,
      },
    },
  });

  // Preencher o formulário quando receber um usuário para edição
  useEffect(() => {
    if (usuario) {
      form.reset({
        nome_completo: usuario.nome_completo,
        nome_usuario: usuario.nome_usuario,
        email: usuario.email,
        senha: '',
        confirmar_senha: '',
        tipo_usuario: usuario.tipo_usuario,
        permissoes: {
          cadastros: usuario.permissoes.cadastros,
          financeiro: usuario.permissoes.financeiro,
          fiscal: usuario.permissoes.fiscal,
          propostas: usuario.permissoes.propostas,
          relatorios: usuario.permissoes.relatorios,
          gerenciamento: usuario.permissoes.gerenciamento,
          teste_conexao: usuario.permissoes.teste_conexao,
        },
      });
    } else {
      form.reset({
        nome_completo: '',
        nome_usuario: '',
        email: '',
        senha: '',
        confirmar_senha: '',
        tipo_usuario: 'usuario',
        permissoes: {
          cadastros: false,
          financeiro: false,
          fiscal: false,
          propostas: false,
          relatorios: false,
          gerenciamento: false,
          teste_conexao: false,
        },
      });
    }
  }, [usuario, form]);

  // Configurar permissões padrão com base no tipo de usuário
  const handleTipoUsuarioChange = (tipo: string) => {
    // Se for administrador, concede todas as permissões
    if (tipo === 'administrador') {
      form.setValue('permissoes.cadastros', true);
      form.setValue('permissoes.financeiro', true);
      form.setValue('permissoes.fiscal', true);
      form.setValue('permissoes.propostas', true);
      form.setValue('permissoes.relatorios', true);
      form.setValue('permissoes.gerenciamento', true);
      form.setValue('permissoes.teste_conexao', true);
    }
    // Se for gerente, concede permissões exceto gerenciamento
    else if (tipo === 'gerente') {
      form.setValue('permissoes.cadastros', true);
      form.setValue('permissoes.financeiro', true);
      form.setValue('permissoes.fiscal', true);
      form.setValue('permissoes.propostas', true);
      form.setValue('permissoes.relatorios', true);
      form.setValue('permissoes.gerenciamento', false);
      form.setValue('permissoes.teste_conexao', true);
    }
  };

  // Enviar o formulário
  const onSubmit = async (values: UserFormValues | UserEditFormValues) => {
    setIsLoading(true);
    try {
      if (isEdicao && usuario) {
        // Garantir que todos os campos de permissões sejam booleanos
        const permissoes = {
          cadastros: Boolean(values.permissoes.cadastros),
          financeiro: Boolean(values.permissoes.financeiro),
          fiscal: Boolean(values.permissoes.fiscal),
          propostas: Boolean(values.permissoes.propostas),
          relatorios: Boolean(values.permissoes.relatorios),
          gerenciamento: Boolean(values.permissoes.gerenciamento),
          teste_conexao: Boolean(values.permissoes.teste_conexao)
        };
        
        // Preparar objeto para atualização (omitir confirmar_senha)
        const dadosAtualizacao: UsuarioFormValues = {
          nome_completo: values.nome_completo,
          nome_usuario: values.nome_usuario,
          email: values.email,
          senha: values.senha || '',
          confirmar_senha: values.confirmar_senha || '',
          tipo_usuario: values.tipo_usuario,
          permissoes
        };
        
        // Atualizar usuário existente
        await atualizarUsuario(usuario.id, dadosAtualizacao);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Garantir que todos os campos de permissões sejam booleanos para criação
        const permissoes = {
          cadastros: Boolean(values.permissoes.cadastros),
          financeiro: Boolean(values.permissoes.financeiro),
          fiscal: Boolean(values.permissoes.fiscal),
          propostas: Boolean(values.permissoes.propostas),
          relatorios: Boolean(values.permissoes.relatorios),
          gerenciamento: Boolean(values.permissoes.gerenciamento),
          teste_conexao: Boolean(values.permissoes.teste_conexao)
        };
        
        // Criar novo usuário
        const dadosCriacao: UsuarioFormValues = {
          ...values as UserFormValues,
          permissoes
        };
        
        await criarUsuario(dadosCriacao);
        toast.success('Usuário criado com sucesso!');
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdicao ? 'Editar' : 'Novo'} Usuário</DialogTitle>
          <DialogDescription>
            {isEdicao 
              ? 'Edite as informações do usuário abaixo.'
              : 'Preencha as informações para criar um novo usuário.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Nome Completo */}
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input placeholder="Nome Completo" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome de Usuário */}
            <FormField
              control={form.control}
              name="nome_usuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input placeholder="Nome de Usuário" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Usado para login no sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input type="email" placeholder="email@exemplo.com" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Senha */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEdicao ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input type="password" placeholder="********" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmação de Senha */}
              <FormField
                control={form.control}
                name="confirmar_senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input type="password" placeholder="********" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tipo de Usuário */}
            <FormField
              control={form.control}
              name="tipo_usuario"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Usuário</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTipoUsuarioChange(value);
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="administrador" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Administrador
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="gerente" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Gerente
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="usuario" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Usuário
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permissões */}
            <div className="space-y-3">
              <div className="flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium">Permissões de Acesso</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="permissoes.cadastros"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Cadastros
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissoes.financeiro"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Financeiro
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissoes.fiscal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Fiscal
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissoes.propostas"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Propostas
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissoes.relatorios"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Relatórios
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissoes.gerenciamento"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Gerenciamento
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissoes.teste_conexao"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Teste de Conexão
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-erio-500 hover:bg-erio-600"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : isEdicao ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 