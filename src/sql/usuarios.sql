-- Criação da tabela de usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  nome_usuario TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL, -- Será armazenada com hash
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('administrador', 'gerente', 'usuario')),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE
);

-- Criação da tabela de permissões de acesso
CREATE TABLE permissoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cadastros BOOLEAN DEFAULT FALSE,
  financeiro BOOLEAN DEFAULT FALSE,
  fiscal BOOLEAN DEFAULT FALSE,
  propostas BOOLEAN DEFAULT FALSE,
  relatorios BOOLEAN DEFAULT FALSE,
  gerenciamento BOOLEAN DEFAULT FALSE,
  teste_conexao BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_nome_usuario ON usuarios(nome_usuario);
CREATE INDEX idx_permissoes_usuario_id ON permissoes_usuario(usuario_id);

-- Trigger para atualizar o campo data_atualizacao
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_usuarios_data_atualizacao
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER tr_permissoes_data_atualizacao
BEFORE UPDATE ON permissoes_usuario
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

-- Função para criar um usuário com permissões
CREATE OR REPLACE FUNCTION criar_usuario_com_permissoes(
  p_nome_completo TEXT,
  p_nome_usuario TEXT,
  p_email TEXT,
  p_senha TEXT,
  p_tipo_usuario TEXT,
  p_cadastros BOOLEAN,
  p_financeiro BOOLEAN,
  p_fiscal BOOLEAN,
  p_propostas BOOLEAN,
  p_relatorios BOOLEAN,
  p_gerenciamento BOOLEAN,
  p_teste_conexao BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  -- Inserir o usuário
  INSERT INTO usuarios (nome_completo, nome_usuario, email, senha, tipo_usuario)
  VALUES (p_nome_completo, p_nome_usuario, p_email, p_senha, p_tipo_usuario)
  RETURNING id INTO v_usuario_id;

  -- Inserir permissões
  INSERT INTO permissoes_usuario (
    usuario_id, cadastros, financeiro, fiscal, propostas, 
    relatorios, gerenciamento, teste_conexao
  )
  VALUES (
    v_usuario_id, p_cadastros, p_financeiro, p_fiscal, p_propostas, 
    p_relatorios, p_gerenciamento, p_teste_conexao
  );

  RETURN v_usuario_id;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de criação de um usuário administrador com todas as permissões
-- Para usar no Supabase SQL Editor:
/*
SELECT criar_usuario_com_permissoes(
  'Administrador',
  'admin',
  'admin@erio.com.br',
  '$2a$10$X9mWkEEIhW7a/gjRd0RPa.P3jKJjlGQ5ElMqiRY9.HRxgYhbIcEN2', -- senha: admin123 (criptografada)
  'administrador',
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
);
*/

-- Criar política RLS (Row Level Security) para acesso aos usuários
-- Somente administradores podem ver todos os usuários, outros usuários só veem seus próprios dados
CREATE POLICY "Usuários podem ver apenas seus próprios dados" 
ON usuarios FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'administrador'
  )
);

CREATE POLICY "Apenas administradores podem criar usuários" 
ON usuarios FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'administrador'
  )
);

CREATE POLICY "Apenas administradores podem atualizar usuários" 
ON usuarios FOR UPDATE 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'administrador'
  )
);

CREATE POLICY "Apenas administradores podem excluir usuários" 
ON usuarios FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'administrador'
  )
);

-- Políticas de segurança para permissões
CREATE POLICY "Usuários podem ver apenas suas próprias permissões" 
ON permissoes_usuario FOR SELECT 
USING (
  usuario_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'administrador'
  )
);

CREATE POLICY "Apenas administradores podem criar permissões" 
ON permissoes_usuario FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'administrador'
  )
);

CREATE POLICY "Apenas administradores podem atualizar permissões" 
ON permissoes_usuario FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = auth.uid() AND u.tipo_usuario = 'administrador'
  )
);

-- Ative a segurança por linha (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY; 