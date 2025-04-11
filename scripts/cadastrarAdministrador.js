const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Configuração do Supabase
const SUPABASE_URL = "https://kwlcofsbopfydilerggg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bGNvZnNib3BmeWRpbGVyZ2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAxMDMxMCwiZXhwIjoyMDU3NTg2MzEwfQ.BH2SXVq185HG6_MA-S6XS_6aows8mxmTjzsaBIYgNp4";

// Inicialização do cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dados do usuário administrador
const admin = {
  nome_completo: "Administrador",
  nome_usuario: "admin",
  email: "admin@erioestudio.com.br",
  senha: "admin123",
  tipo_usuario: "administrador",
  ativo: true
};

// Permissões do administrador (todas habilitadas)
const permissoes = {
  cadastros: true,
  financeiro: true,
  fiscal: true,
  propostas: true,
  relatorios: true,
  gerenciamento: true,
  teste_conexao: true
};

async function cadastrarAdmin() {
  try {
    console.log("Iniciando cadastro do usuário administrador...");

    // Verificar se o usuário já existe
    const { data: usuarioExistente, error: erroConsulta } = await supabase
      .from('usuarios')
      .select('id')
      .or(`nome_usuario.eq.${admin.nome_usuario},email.eq.${admin.email}`)
      .maybeSingle();

    if (erroConsulta) {
      throw new Error(`Erro ao consultar usuário: ${erroConsulta.message}`);
    }

    if (usuarioExistente) {
      console.log("Um usuário com este nome de usuário ou email já existe.");
      return;
    }

    // Gerar hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(admin.senha, saltRounds);

    // Criar ID único para o usuário
    const usuarioId = uuidv4();

    // Inserir o usuário
    const { data: usuarioInserido, error: erroInsercao } = await supabase
      .from('usuarios')
      .insert({
        id: usuarioId,
        nome_completo: admin.nome_completo,
        nome_usuario: admin.nome_usuario,
        email: admin.email,
        senha: senhaHash,
        tipo_usuario: admin.tipo_usuario,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        ativo: admin.ativo
      })
      .select('id')
      .single();

    if (erroInsercao) {
      throw new Error(`Erro ao inserir usuário: ${erroInsercao.message}`);
    }

    // Inserir as permissões do usuário
    const { error: erroPermissoes } = await supabase
      .from('permissoes_usuario')
      .insert({
        usuario_id: usuarioId,
        cadastros: permissoes.cadastros,
        financeiro: permissoes.financeiro,
        fiscal: permissoes.fiscal,
        propostas: permissoes.propostas,
        relatorios: permissoes.relatorios,
        gerenciamento: permissoes.gerenciamento,
        teste_conexao: permissoes.teste_conexao,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString()
      });

    if (erroPermissoes) {
      throw new Error(`Erro ao inserir permissões: ${erroPermissoes.message}`);
    }

    console.log("Usuário administrador criado com sucesso!");
    console.log("Nome de usuário: admin");
    console.log("Senha: admin123");
    
  } catch (error) {
    console.error("Erro durante o cadastro do administrador:", error);
  }
}

// Executar a função principal
cadastrarAdmin(); 