/**
 * Formata um valor numérico para moeda brasileira (R$)
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Converte uma string formatada como moeda para um número
 */
export const parseMoeda = (valor: string): number => {
  if (!valor) return 0;
  return parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
};

/**
 * Formata um número de telefone brasileiro
 */
export const formatarTelefone = (telefone: string): string => {
  if (!telefone) return '';
  
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  if (apenasNumeros.length === 11) {
    return apenasNumeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  } else if (apenasNumeros.length === 10) {
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  return telefone;
};

/**
 * Formata um CPF
 */
export const formatarCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  const apenasNumeros = cpf.replace(/\D/g, '');
  
  if (apenasNumeros.length !== 11) return cpf;
  
  return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Formata um CNPJ
 */
export const formatarCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  
  const apenasNumeros = cnpj.replace(/\D/g, '');
  
  if (apenasNumeros.length !== 14) return cnpj;
  
  return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}; 