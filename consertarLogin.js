import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Configuração do Supabase
const SUPABASE_URL = "https://kwlcofsbopfydilerggg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bGNvZnNib3BmeWRpbGVyZ2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAxMDMxMCwiZXhwIjoyMDU3NTg2MzEwfQ.BH2SXVq185HG6_MA-S6XS_6aows8mxmTjzsaBIYgNp4";

// Inicialização do cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para verificar se o .env existe e tem as credenciais corretas
async function verificarEnv() {
  console.log("\n🔍 Verificando configuração de ambiente...");
  
  try {
    // Verificar se existe um arquivo .env
    const envExists = fs.existsSync('.env');
    if (!envExists) {
      console.log("❌ Arquivo .env não encontrado. Criando arquivo com as configurações necessárias...");
      
      const envContent = `
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}
`;
      fs.writeFileSync('.env', envContent);
      console.log("✅ Arquivo .env criado com sucesso!");
    } else {
      console.log("✅ Arquivo .env já existe. Verificando conteúdo...");
      
      const envContent = fs.readFileSync('.env', 'utf8');
      let modified = false;
      
      if (!envContent.includes('VITE_SUPABASE_URL')) {
        const newContent = envContent + `\nVITE_SUPABASE_URL=${SUPABASE_URL}`;
        fs.writeFileSync('.env', newContent);
        modified = true;
      }
      
      if (!envContent.includes('VITE_SUPABASE_ANON_KEY')) {
        const newContent = envContent + `\nVITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}`;
        fs.writeFileSync('.env', newContent);
        modified = true;
      }
      
      if (modified) {
        console.log("✅ Arquivo .env atualizado com as configurações do Supabase!");
      } else {
        console.log("✅ Arquivo .env já contém as configurações necessárias.");
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar/criar arquivo .env:", error);
  }
}

// Função para verificar sessão armazenada
async function limparSessionStorage() {
  console.log("\n🔍 Criando script para limpar o sessionStorage...");
  
  try {
    const scriptContent = `
// Script para limpar a sessão anterior e resolver problemas de login
// Execute este script no console do navegador na página de login
// ou adicione-o a um arquivo JavaScript que seja carregado na página de login

(function() {
  console.log('Limpando dados de sessão anteriores...');
  
  // Limpar sessionStorage
  sessionStorage.removeItem('usuarioLogado');
  
  // Limpar localStorage relacionado ao Supabase
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('Sessão limpa com sucesso! Tente fazer login novamente.');
})();
`;
    
    fs.writeFileSync('limparSessao.js', scriptContent);
    console.log("✅ Script 'limparSessao.js' criado com sucesso!");
    console.log("   Você pode adicionar este script à página de login ou executá-lo no console do navegador.");
  } catch (error) {
    console.error("❌ Erro ao criar script para limpar sessionStorage:", error);
  }
}

// Função para resetar a senha do usuário admin caso esteja com problemas
async function resetarSenhaAdmin() {
  console.log("\n🔍 Verificando se é necessário resetar a senha do admin...");
  
  try {
    // Buscar o usuário admin
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
      console.log("❌ Usuário admin não encontrado. Execute o script criarAdmin.js primeiro.");
      return;
    }
    
    // Resetar a senha para admin123
    const senha = "admin123";
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);
    
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ 
        senha: senhaHash,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', adminUsuario.id);
    
    if (updateError) {
      console.error("❌ Erro ao resetar senha do admin:", updateError);
      return;
    }
    
    console.log("✅ Senha do admin resetada com sucesso para 'admin123'!");
  } catch (error) {
    console.error("❌ Erro ao resetar senha do admin:", error);
  }
}

// Função principal
async function consertarLogin() {
  console.log("🛠️  Iniciando correção de problemas de login...");
  
  // Verificar arquivo .env
  await verificarEnv();
  
  // Criar script para limpar session storage
  await limparSessionStorage();
  
  // Resetar senha do admin
  await resetarSenhaAdmin();
  
  console.log("\n✅ Processo concluído! Sugestões para resolver o problema de login:");
  console.log("1. Reinicie o servidor de desenvolvimento com 'npm run dev'");
  console.log("2. Limpe o cache do navegador e cookies do site");
  console.log("3. Execute o script limparSessao.js no console do navegador");
  console.log("4. Tente fazer login com as credenciais: admin / admin123");
  console.log("5. Verifique o console do navegador para possíveis erros");
}

// Executar a função principal
consertarLogin(); 