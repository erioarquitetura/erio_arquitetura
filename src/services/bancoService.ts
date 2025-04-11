import { supabase } from "@/integrations/supabase/client";
import { Banco, BancoFormValues } from "@/types/banco";
import { toast } from "sonner";

/**
 * Lista todos os bancos cadastrados
 */
export const listarBancos = async (): Promise<Banco[]> => {
  try {
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) throw error;
    return data as Banco[];
  } catch (error) {
    console.error('Erro ao listar bancos:', error);
    return [];
  }
};

/**
 * Busca um banco pelo ID
 */
export const buscarBanco = async (id: string): Promise<Banco | null> => {
  try {
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Banco;
  } catch (error) {
    console.error('Erro ao buscar banco:', error);
    return null;
  }
};

/**
 * Cria um novo banco
 */
export const criarBanco = async (banco: BancoFormValues): Promise<Banco | null> => {
  try {
    const { data, error } = await supabase
      .from('bancos')
      .insert([{
        ...banco,
        ativo: true
      }])
      .select()
      .single();

    if (error) throw error;
    toast.success('Banco cadastrado com sucesso!');
    return data as Banco;
  } catch (error) {
    console.error('Erro ao criar banco:', error);
    toast.error('Falha ao cadastrar banco');
    return null;
  }
};

/**
 * Atualiza um banco existente
 */
export const atualizarBanco = async (id: string, banco: BancoFormValues): Promise<Banco | null> => {
  try {
    const { data, error } = await supabase
      .from('bancos')
      .update({
        ...banco,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Banco atualizado com sucesso!');
    return data as Banco;
  } catch (error) {
    console.error('Erro ao atualizar banco:', error);
    toast.error('Falha ao atualizar banco');
    return null;
  }
};

/**
 * Exclui (desativa) um banco
 */
export const excluirBanco = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bancos')
      .update({ 
        ativo: false,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    toast.success('Banco excluído com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao excluir banco:', error);
    toast.error('Falha ao excluir banco');
    return false;
  }
};

/**
 * Formata a chave PIX de acordo com o tipo
 */
export const formatarChavePix = (tipo: string, valor: string): string => {
  if (!valor) return '';
  
  // Remove caracteres não numéricos para formatação
  const apenasNumeros = valor.replace(/\D/g, '');
  
  switch (tipo) {
    case 'cpf':
      if (apenasNumeros.length !== 11) return valor;
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    
    case 'cnpj':
      if (apenasNumeros.length !== 14) return valor;
      return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    
    case 'telefone':
      if (apenasNumeros.length === 11) {
        return apenasNumeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
      } else if (apenasNumeros.length === 10) {
        return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
      }
      return valor;
    
    // Para e-mail e chave aleatória, retorna o valor original
    case 'email':
    case 'aleatoria':
    default:
      return valor;
  }
}; 