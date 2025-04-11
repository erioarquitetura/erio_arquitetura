-- Tabela para notas fiscais emitidas
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receita_item_id UUID REFERENCES receitas_itens(id),
  numero_nota VARCHAR(50) NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data_emissao DATE NOT NULL,
  data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  proposta_codigo VARCHAR(50),  -- Campo calculado para facilitar consultas
  cliente_nome VARCHAR(200),    -- Campo calculado para facilitar consultas
  observacoes TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_receita_item ON notas_fiscais(receita_item_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON notas_fiscais(numero_nota);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON notas_fiscais(data_emissao);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_proposta_codigo ON notas_fiscais(proposta_codigo);

-- Função para atualizar a data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao_notas_fiscais()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar data_atualizacao antes de cada update
CREATE TRIGGER atualizar_notas_fiscais_data_atualizacao
BEFORE UPDATE ON notas_fiscais
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao_notas_fiscais();

-- Função para preencher automaticamente os campos proposta_codigo e cliente_nome
CREATE OR REPLACE FUNCTION preencher_info_nota_fiscal()
RETURNS TRIGGER AS $$
DECLARE
  v_proposta_codigo VARCHAR(50);
  v_cliente_nome VARCHAR(200);
BEGIN
  -- Buscar o código da proposta e nome do cliente associados ao item de receita
  SELECT 
    p.codigo,
    c.nome
  INTO 
    v_proposta_codigo,
    v_cliente_nome
  FROM 
    receitas_itens ri
    JOIN receitas r ON ri.receita_id = r.id
    LEFT JOIN propostas p ON r.proposta_id = p.id
    LEFT JOIN clientes c ON r.cliente_id = c.id
  WHERE 
    ri.id = NEW.receita_item_id;
  
  -- Atualizar os campos da nota fiscal
  NEW.proposta_codigo = v_proposta_codigo;
  NEW.cliente_nome = v_cliente_nome;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para preencher informações antes de inserir ou atualizar
CREATE TRIGGER preencher_info_nota_fiscal_trigger
BEFORE INSERT OR UPDATE ON notas_fiscais
FOR EACH ROW
EXECUTE FUNCTION preencher_info_nota_fiscal();

-- Comentários para documentar a tabela
COMMENT ON TABLE notas_fiscais IS 'Registro de notas fiscais emitidas para itens de receitas pagos';
COMMENT ON COLUMN notas_fiscais.receita_item_id IS 'Referência ao item de receita para o qual a nota foi emitida';
COMMENT ON COLUMN notas_fiscais.numero_nota IS 'Número da nota fiscal emitida';
COMMENT ON COLUMN notas_fiscais.valor IS 'Valor da nota fiscal';
COMMENT ON COLUMN notas_fiscais.data_emissao IS 'Data de emissão da nota fiscal';
COMMENT ON COLUMN notas_fiscais.data_lancamento IS 'Data em que a nota fiscal foi lançada no sistema';
COMMENT ON COLUMN notas_fiscais.proposta_codigo IS 'Código da proposta associada (campo auxiliar)';
COMMENT ON COLUMN notas_fiscais.cliente_nome IS 'Nome do cliente (campo auxiliar)';
COMMENT ON COLUMN notas_fiscais.observacoes IS 'Observações adicionais sobre a nota fiscal'; 