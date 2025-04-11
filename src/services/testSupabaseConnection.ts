import { supabase } from "@/integrations/supabase/client";

/**
 * Obtém as informações de configuração do cliente Supabase
 */
export const getSupabaseConfig = () => {
  // Obter informações do arquivo de configuração
  const supabaseUrl = "https://kwlcofsbopfydilerggg.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bGNvZnNib3BmeWRpbGVyZ2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAxMDMxMCwiZXhwIjoyMDU3NTg2MzEwfQ.BH2SXVq185HG6_MA-S6XS_6aows8mxmTjzsaBIYgNp4";
  
  // Obtém o ID do projeto a partir da URL
  const projectId = supabaseUrl.split('.')[0].split('//')[1];
  
  return {
    supabaseUrl,
    supabaseKey: `${supabaseKey.substring(0, 15)}...${supabaseKey.substring(supabaseKey.length - 10)}`, // Por segurança, mascaramos a chave
    projectId,
    apiVersion: "1", // Versão padrão da API do Supabase
    clientVersion: "2.39.0" // Versão do cliente Supabase JS
  };
};

/**
 * Testa a conexão com o Supabase verificando a resposta da API
 * e retornando o status e informações da conexão
 */
export const testSupabaseConnection = async () => {
  try {
    // Obter configurações do Supabase
    const config = getSupabaseConfig();
    
    // Verifica se a conexão está funcionando consultando o servidor
    const startTime = window.performance.now();
    const { data, error, status } = await supabase
      .from('clientes')
      .select('count()', { count: 'exact' })
      .limit(0);
    const endTime = window.performance.now();
    const pingTime = Math.round(endTime - startTime);
    
    if (error) {
      return {
        connected: false,
        status,
        error: error.message,
        details: error,
        message: "Falha ao conectar com o Supabase",
        config
      };
    }
    
    // Obtém os limites de uso da conta
    // Simulando - em um ambiente real, você poderia chamar APIs administrativas
    const limits = {
      rowLimit: "Ilimitado",
      storageLimit: "500 MB",
      bandwidthLimit: "5 GB/mês",
      plan: "Free Tier"
    };
    
    // Teste de performance simplificado
    const connectionPerformance = {
      ping: pingTime,
      status: pingTime < 300 ? "Ótimo" : pingTime < 700 ? "Bom" : "Lento"
    };
    
    return {
      connected: true,
      status,
      count: data,
      projectId: config.projectId,
      projectUrl: config.supabaseUrl,
      message: "Conexão com Supabase estabelecida com sucesso",
      config,
      limits,
      performance: connectionPerformance
    };
  } catch (error) {
    console.error("Erro ao testar conexão com Supabase:", error);
    return {
      connected: false,
      status: 500,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      message: "Erro inesperado ao conectar com o Supabase",
      config: getSupabaseConfig()
    };
  }
};

/**
 * Verifica as permissões e tabelas disponíveis no banco de dados
 */
export const checkSupabaseSchema = async () => {
  try {
    // Tenta listar as tabelas que temos acesso
    const availableTables = [];
    
    // Lista de tabelas principais a serem verificadas
    const tablesToCheck = [
      'clientes', 
      'propostas', 
      'usuarios', 
      'permissoes_usuario', 
      'receitas', 
      'despesas', 
      'categorias_receita',
      'categorias_despesa',
      'bancos'
    ];
    
    // Verifica cada tabela
    for (const tableName of tablesToCheck) {
      try {
        // @ts-ignore - Ignorando o erro de tipagem para permitir consulta dinâmica de tabelas
        const result = await supabase.from(tableName).select('count()', { count: 'exact' }).limit(0);
        if (!result.error) {
          availableTables.push({
            name: tableName,
            count: result.count,
            accessible: true
          });
        }
      } catch (e) {
        console.log(`Erro ao verificar tabela ${tableName}:`, e);
        // Ignora o erro e continua verificando as próximas tabelas
      }
    }
    
    // Tenta verificar informações sobre o usuário atual
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    // Verifica o status do serviço de armazenamento
    const { data: storageData, error: storageError } = await supabase.storage.listBuckets();
    
    // Verifica a versão do PostgreSQL (simulado, o Supabase não expõe isso diretamente via API)
    const pgVersion = "PostgreSQL 15.0";
    
    return {
      schema: {
        tables: availableTables,
        permissions: !authError ? "Autenticado" : "Anônimo",
        authentication: {
          user: authData?.user || null,
          status: !authError ? "Conectado" : "Não autenticado"
        },
        storage: {
          available: !storageError,
          buckets: storageData?.length || 0
        },
        database: {
          version: pgVersion,
          extensions: ["pgcrypto", "uuid-ossp", "pgjwt"]
        }
      }
    };
    
  } catch (error) {
    console.error("Erro ao verificar esquema do Supabase:", error);
    return {
      error: error instanceof Error ? error.message : "Erro desconhecido",
      schema: null
    };
  }
}; 