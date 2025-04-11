-- Criar tabela de categorias de receitas
CREATE TABLE IF NOT EXISTS categorias_receitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  descricao VARCHAR(200),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para melhorar a performance de buscas por nome
CREATE INDEX IF NOT EXISTS idx_categorias_receitas_nome ON categorias_receitas(nome);

-- Comentários para documentar a tabela
COMMENT ON TABLE categorias_receitas IS 'Categorias para classificação de receitas';
COMMENT ON COLUMN categorias_receitas.id IS 'Identificador único da categoria';
COMMENT ON COLUMN categorias_receitas.nome IS 'Nome da categoria de receita';
COMMENT ON COLUMN categorias_receitas.descricao IS 'Descrição opcional da categoria';
COMMENT ON COLUMN categorias_receitas.data_criacao IS 'Data de criação do registro';
COMMENT ON COLUMN categorias_receitas.data_atualizacao IS 'Data da última atualização do registro';

-- Adicionar coluna categoria_id na tabela de receitas (se ela já existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'receitas') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'receitas' AND column_name = 'categoria_id') THEN
            ALTER TABLE receitas ADD COLUMN categoria_id UUID REFERENCES categorias_receitas(id);
            COMMENT ON COLUMN receitas.categoria_id IS 'Referência para a categoria da receita';
        END IF;
    END IF;
END
$$;
