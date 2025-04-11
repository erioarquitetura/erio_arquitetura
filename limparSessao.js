
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
