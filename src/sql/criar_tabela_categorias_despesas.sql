-- Criação da tabela categorias_despesas
CREATE TABLE categorias_despesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  descricao TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar índice para melhorar a performance de consultas por nome
CREATE INDEX idx_categorias_despesas_nome ON categorias_despesas (nome);

-- Comentários na tabela e nas colunas para melhor documentação
COMMENT ON TABLE categorias_despesas IS 'Categorias para classificação de despesas';
COMMENT ON COLUMN categorias_despesas.id IS 'Identificador único da categoria';
COMMENT ON COLUMN categorias_despesas.nome IS 'Nome da categoria de despesa';
COMMENT ON COLUMN categorias_despesas.descricao IS 'Descrição detalhada da categoria de despesa';
COMMENT ON COLUMN categorias_despesas.data_criacao IS 'Data e hora de criação do registro';
COMMENT ON COLUMN categorias_despesas.data_atualizacao IS 'Data e hora da última atualização do registro';

-- Criação da função para atualizar a data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao_categorias_despesas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criação do trigger para atualizar data_atualizacao antes de cada update
CREATE TRIGGER atualizar_categorias_despesas_data_atualizacao
BEFORE UPDATE ON categorias_despesas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao_categorias_despesas();

-- Adicionar políticas de segurança (RLS - Row Level Security)
ALTER TABLE categorias_despesas ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para todos os usuários autenticados
CREATE POLICY categorias_despesas_policy_select ON categorias_despesas
FOR SELECT USING (auth.role() = 'authenticated');

-- Criar política para permitir inserção para todos os usuários autenticados
CREATE POLICY categorias_despesas_policy_insert ON categorias_despesas
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar política para permitir update para todos os usuários autenticados
CREATE POLICY categorias_despesas_policy_update ON categorias_despesas
FOR UPDATE USING (auth.role() = 'authenticated');

-- Criar política para permitir delete para todos os usuários autenticados
CREATE POLICY categorias_despesas_policy_delete ON categorias_despesas
FOR DELETE USING (auth.role() = 'authenticated'); 