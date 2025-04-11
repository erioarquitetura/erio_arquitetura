import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Configuração do Supabase
const SUPABASE_URL = "https://kwlcofsbopfydilerggg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bGNvZnNib3BmeWRpbGVyZ2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAxMDMxMCwiZXhwIjoyMDU3NTg2MzEwfQ.BH2SXVq185HG6_MA-S6XS_6aows8mxmTjzsaBIYgNp4";

// Inicialização do cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função principal
async function criarAdmin() {
  try {
    console.log("Iniciando cadastro do usuário administrador...");
    
    // Dados do usuário
    const nome_usuario = "admin";
    const email = "admin@erioestudio.com.br";
    
    // Verificar se o usuário já existe
    const { data: usuariosExistentes, error: erroConsulta } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nome_usuario', nome_usuario);
      
    if (erroConsulta) {
      console.error("Erro ao verificar usuário existente:", erroConsulta);
      return;
    }
    
    if (usuariosExistentes && usuariosExistentes.length > 0) {
      console.log("Um usuário administrador já existe!");
      return;
    }
    
    // Gerar hash da senha
    const senha = "admin123";
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);
    
    // ID do usuário
    const usuarioId = uuidv4();
    
    // Inserir usuário
    const { error: erroUsuario } = await supabase
      .from('usuarios')
      .insert({
        id: usuarioId,
        nome_completo: "Administrador",
        nome_usuario: nome_usuario,
        email: email,
        senha: senhaHash,
        tipo_usuario: "administrador",
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        ativo: true
      });
      
    if (erroUsuario) {
      console.error("Erro ao criar usuário:", erroUsuario);
      return;
    }
    
    // Inserir permissões
    const { error: erroPermissoes } = await supabase
      .from('permissoes_usuario')
      .insert({
        usuario_id: usuarioId,
        cadastros: true,
        financeiro: true,
        fiscal: true,
        propostas: true,
        relatorios: true,
        gerenciamento: true,
        teste_conexao: true,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString()
      });
      
    if (erroPermissoes) {
      console.error("Erro ao criar permissões:", erroPermissoes);
      return;
    }
    
    console.log("----------------------------------------");
    console.log("Usuário administrador criado com sucesso!");
    console.log("Nome de usuário: admin");
    console.log("Senha: admin123");
    console.log("----------------------------------------");
    
  } catch (error) {
    console.error("Erro durante o cadastro do administrador:", error);
  }
}

// Executar a função
criarAdmin(); 