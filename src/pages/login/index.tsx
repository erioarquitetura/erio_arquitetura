import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AtSign, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Esquema de validação do formulário
const formSchema = z.object({
  identifier: z.string().min(3, 'Digite um nome de usuário ou e-mail válido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

// Componente para debug
const DebugConsole = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = function(...args) {
      setLogs(prev => [...prev, `LOG: ${args.map(a => JSON.stringify(a)).join(' ')}`]);
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function(...args) {
      setLogs(prev => [...prev, `ERROR: ${args.map(a => JSON.stringify(a)).join(' ')}`]);
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);
  
  if (import.meta.env.MODE !== 'development') return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 text-green-400 p-2 max-h-40 overflow-auto text-xs font-mono">
      <div className="flex justify-between mb-1">
        <h3>Debug Console</h3>
        <button onClick={() => setLogs([])} className="text-white px-2">Clear</button>
      </div>
      {logs.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Formulário com validação
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      senha: '',
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isLoading) return; // Evitar múltiplos envios
    
    setIsLoading(true);
    console.log("Iniciando processo de login:", values.identifier);
    
    try {
      const success = await login(values.identifier, values.senha);
      console.log("Resultado do login:", success);

      if (success) {
        console.log("Login bem-sucedido, redirecionando...");
        // O redirecionamento será feito pelo contexto de autenticação
      } else {
        console.log("Login falhou, exibindo erro");
        // O erro específico é tratado no serviço ou contexto com toast
        form.setError('senha', {
          type: 'manual',
          message: 'Credenciais inválidas',
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Ocorreu um erro ao tentar fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-erio-600">ERIO STUDIO</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestão Financeira</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Campo de email/usuário */}
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email ou Nome de Usuário</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="usuario@exemplo.com ou usuario" 
                            className="pl-9"
                            autoComplete="username"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de senha */}
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pl-9 pr-9"
                            autoComplete="current-password"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-erio-500 hover:bg-erio-600"
                  disabled={isLoading}
                  onClick={(e) => {
                    // Tentar submeter o formulário manualmente se o botão for clicado
                    console.log("Botão de login clicado");
                    if (!form.formState.isSubmitting) {
                      form.handleSubmit(onSubmit)(e);
                    }
                  }}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            <p>Sistema de Gestão - © ERIO STUDIO {new Date().getFullYear()}</p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Debug Console */}
      <DebugConsole />
    </div>
  );
} 