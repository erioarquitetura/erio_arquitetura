
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cliente, Endereco } from "@/types";
import { ClienteInput } from "@/services/clienteService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogFooter } from "@/components/ui/dialog";

export const clienteFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Email inválido." }),
  telefone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 dígitos." }),
  documento: z.string().min(11, { message: "CPF ou CNPJ inválido." }),
  observacoes: z.string().optional(),
  logradouro: z.string().min(3, { message: "Logradouro obrigatório." }),
  numero: z.string().min(1, { message: "Número obrigatório." }),
  complemento: z.string().optional(),
  bairro: z.string().min(2, { message: "Bairro obrigatório." }),
  cidade: z.string().min(2, { message: "Cidade obrigatória." }),
  estado: z.string().length(2, { message: "Estado deve ter 2 caracteres." }),
  cep: z.string().min(8, { message: "CEP inválido." }),
  ativo: z.boolean().default(true),
});

type ClienteFormProps = {
  clienteAtual: Cliente | null;
  viewMode: boolean;
  onSubmit: (data: ClienteInput) => void;
  onCancel: () => void;
  isPending: boolean;
};

export function ClienteForm({
  clienteAtual,
  viewMode,
  onSubmit,
  onCancel,
  isPending
}: ClienteFormProps) {
  const form = useForm<z.infer<typeof clienteFormSchema>>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nome: clienteAtual?.nome || "",
      email: clienteAtual?.email || "",
      telefone: clienteAtual?.telefone || "",
      documento: clienteAtual?.documento || "",
      observacoes: clienteAtual?.observacoes || "",
      logradouro: clienteAtual?.endereco?.logradouro || "",
      numero: clienteAtual?.endereco?.numero || "",
      complemento: clienteAtual?.endereco?.complemento || "",
      bairro: clienteAtual?.endereco?.bairro || "",
      cidade: clienteAtual?.endereco?.cidade || "",
      estado: clienteAtual?.endereco?.estado || "",
      cep: clienteAtual?.endereco?.cep || "",
      ativo: clienteAtual?.ativo ?? true,
    },
  });

  const handleSubmit = (values: z.infer<typeof clienteFormSchema>) => {
    const clienteData: ClienteInput = {
      nome: values.nome,
      email: values.email,
      telefone: values.telefone,
      documento: values.documento,
      observacoes: values.observacoes,
      logradouro: values.logradouro,
      numero: values.numero,
      complemento: values.complemento,
      bairro: values.bairro,
      cidade: values.cidade,
      estado: values.estado,
      cep: values.cep,
      ativo: values.ativo,
    };
    
    onSubmit(clienteData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="info">Informações Gerais</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome do cliente" 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email*</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento (CPF/CNPJ)*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o cliente" 
                      {...field} 
                      rows={3}
                      disabled={viewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={viewMode}
                      className="h-4 w-4 text-erio-600 rounded border-gray-300 focus:ring-erio-500"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Cliente ativo</FormLabel>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="address" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="logradouro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, Avenida, etc." 
                          {...field} 
                          disabled={viewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Número" 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="complemento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Apto, Sala, etc." 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Bairro" 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Cidade" 
                          {...field} 
                          disabled={viewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="UF" 
                        {...field} 
                        disabled={viewMode}
                        maxLength={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00000-000" 
                        {...field} 
                        disabled={viewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {viewMode ? "Fechar" : "Cancelar"}
          </Button>
          
          {!viewMode && (
            <Button 
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
                "Salvando..."
              ) : (
                clienteAtual ? "Atualizar" : "Cadastrar"
              )}
            </Button>
          )}
        </DialogFooter>
      </form>
    </Form>
  );
}
