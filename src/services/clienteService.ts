import { supabase } from "@/integrations/supabase/client";
import { Cliente } from "@/types";
import { toast } from "sonner";

export interface ClienteInput {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  observacoes?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  ativo: boolean;
}

export const createCliente = async (cliente: ClienteInput): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        documento: cliente.documento,
        observacoes: cliente.observacoes || null,
        logradouro: cliente.logradouro,
        numero: cliente.numero,
        complemento: cliente.complemento || null,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        estado: cliente.estado,
        cep: cliente.cep,
        ativo: cliente.ativo
      })
      .select("id")
      .single();

    if (error) throw error;
    toast.success("Cliente cadastrado com sucesso!");
    return data?.id || null;
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    toast.error("Erro ao cadastrar cliente.");
    return null;
  }
};

export const updateCliente = async (id: string, cliente: ClienteInput): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("clientes")
      .update({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        documento: cliente.documento,
        observacoes: cliente.observacoes || null,
        logradouro: cliente.logradouro,
        numero: cliente.numero,
        complemento: cliente.complemento || null,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        estado: cliente.estado,
        cep: cliente.cep,
        ativo: cliente.ativo,
        data_atualizacao: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
    toast.success("Cliente atualizado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    toast.error("Erro ao atualizar cliente.");
    return false;
  }
};

export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("data_criacao", { ascending: false });

    if (error) throw error;

    // Transform Supabase data to match the Cliente type
    return data.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      documento: cliente.documento || "",
      dataCriacao: cliente.data_criacao || "",
      dataAtualizacao: cliente.data_atualizacao || "",
      observacoes: cliente.observacoes,
      ativo: cliente.ativo,
      endereco: {
        logradouro: cliente.logradouro || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
        cep: cliente.cep || ""
      }
    }));
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    toast.error("Erro ao buscar clientes.");
    return [];
  }
};

export const deleteCliente = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    toast.success("Cliente excluído com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    toast.error("Erro ao excluir cliente.");
    return false;
  }
};

/**
 * Lista todos os clientes cadastrados
 */
export const listarClientes = async (): Promise<Cliente[]> => {
  try {
    const { data, error } = await supabase
      .from('clientes' as any)
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as Cliente[];
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return [];
  }
};
