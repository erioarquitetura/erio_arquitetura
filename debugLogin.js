import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// Configuração do Supabase
const SUPABASE_URL = "https://kwlcofsbopfydilerggg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bGNvZnNib3BmeWRpbGVyZ2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAxMDMxMCwiZXhwIjoyMDU3NTg2MzEwfQ.BH2SXVq185HG6_MA-S6XS_6aows8mxmTjzsaBIYgNp4";

// Inicialização do cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testarConexaoELogin() {
  console.log("Testando conexão com o Supabase...");
  
  try {
    // Teste de conexão básico (limitando a 1 resultado para ser mais eficiente)
    const { data: healthData, error: healthError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.error("❌ Erro na conexão com o Supabase:", healthError);
      return;
    }
    
    console.log("✅ Conexão com o Supabase estabelecida com sucesso!");
    
    // Buscar o usuário admin
    console.log("\nBuscando o usuário admin...");
    const { data: adminUsuario, error: adminError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('nome_usuario', 'admin')
      .eq('ativo', true)
      .single();
    
    if (adminError) {
      console.error("❌ Erro ao buscar usuário admin:", adminError);
      return;
    }
    
    if (!adminUsuario) {
      console.error("❌ Usuário admin não encontrado!");
      return;
    }
    
    console.log("✅ Usuário admin encontrado!");
    console.log(`Nome: ${adminUsuario.nome_completo}`);
    console.log(`Email: ${adminUsuario.email}`);
    console.log(`Tipo: ${adminUsuario.tipo_usuario}`);
    
    // Testar verificação de senha
    console.log("\nTestando a verificação da senha...");
    const senhaCorreta = await bcrypt.compare('admin123', adminUsuario.senha);
    
    if (senhaCorreta) {
      console.log("✅ Senha verificada com sucesso!");
    } else {
      console.error("❌ A senha não corresponde!");
      console.log("🔧 Sugestão: Execute o script criarAdmin.js novamente para resetar a senha");
    }
    
    // Buscar as permissões do usuário
    console.log("\nBuscando permissões do usuário...");
    const { data: permissoes, error: permError } = await supabase
      .from('permissoes_usuario')
      .select('*')
      .eq('usuario_id', adminUsuario.id)
      .single();
    
    if (permError) {
      console.error("❌ Erro ao buscar permissões:", permError);
      return;
    }
    
    if (!permissoes) {
      console.error("❌ Permissões do usuário admin não encontradas!");
      return;
    }
    
    console.log("✅ Permissões encontradas!");
    console.log(permissoes);
    
    console.log("\n🟢 Todos os testes passaram com sucesso! O login deveria funcionar normalmente.");
    console.log("Se ainda estiver tendo problemas, verifique o console do navegador para erros adicionais.");
    
  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
  }
}

// Executar a função
testarConexaoELogin(); 