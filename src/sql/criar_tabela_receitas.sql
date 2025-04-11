-- Tabela para formas de pagamento
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  descricao VARCHAR(200),
  requer_detalhes BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir formas de pagamento padrão se a tabela estiver vazia
INSERT INTO formas_pagamento (nome, requer_detalhes)
SELECT 'Pix', TRUE
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Pix');

INSERT INTO formas_pagamento (nome, requer_detalhes)
SELECT 'Dinheiro', FALSE
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Dinheiro');

INSERT INTO formas_pagamento (nome, requer_detalhes)
SELECT 'Débito', FALSE
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Débito');

INSERT INTO formas_pagamento (nome, requer_detalhes)
SELECT 'Cartão de crédito', TRUE
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Cartão de crédito');

INSERT INTO formas_pagamento (nome, requer_detalhes)
SELECT 'Boleto', FALSE
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Boleto');

INSERT INTO formas_pagamento (nome, requer_detalhes)
SELECT 'Permuta', FALSE
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Permuta');

INSERT INTO formas_pagamento (nome, requer_detalhes)
SELECT 'Carteira', FALSE
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Carteira');

-- Criar enum para status da receita
CREATE TYPE receita_status AS ENUM ('pendente', 'pago_parcial', 'pago');

-- Tabela principal de receitas
CREATE TABLE IF NOT EXISTS receitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposta_id UUID REFERENCES propostas(id),
  categoria_id UUID REFERENCES categorias_receitas(id),
  cliente_id UUID REFERENCES clientes(id),
  valor_total DECIMAL(15, 2) NOT NULL,
  descricao TEXT,
  status receita_status DEFAULT 'pendente',
  data_vencimento DATE,
  data_pagamento DATE,
  observacoes TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_receitas_proposta ON receitas(proposta_id);
CREATE INDEX IF NOT EXISTS idx_receitas_categoria ON receitas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_receitas_cliente ON receitas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas(status);

-- Tabela para itens de receita (parcelas ou condições de pagamento)
CREATE TABLE IF NOT EXISTS receitas_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receita_id UUID REFERENCES receitas(id) ON DELETE CASCADE,
  condicao_pagamento_id UUID REFERENCES proposta_condicoes_pagamento(id),
  forma_pagamento_id UUID REFERENCES formas_pagamento(id),
  valor DECIMAL(15, 2) NOT NULL,
  status receita_status DEFAULT 'pendente',
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  parcela INT DEFAULT 1,
  total_parcelas INT DEFAULT 1,
  taxa_juros DECIMAL(5, 2) DEFAULT 0,
  detalhes_pagamento JSONB, -- Para armazenar chaves PIX, detalhes de cartão, etc.
  ordem INT,
  descricao TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_receitas_itens_receita ON receitas_itens(receita_id);
CREATE INDEX IF NOT EXISTS idx_receitas_itens_condicao ON receitas_itens(condicao_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_receitas_itens_forma ON receitas_itens(forma_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_receitas_itens_status ON receitas_itens(status);

-- Função para atualizar o status da receita principal quando os itens são atualizados
CREATE OR REPLACE FUNCTION atualizar_status_receita()
RETURNS TRIGGER AS $$
DECLARE
  total_itens INTEGER;
  itens_pagos INTEGER;
BEGIN
  -- Contar total de itens para esta receita
  SELECT COUNT(*) INTO total_itens 
  FROM receitas_itens 
  WHERE receita_id = NEW.receita_id;
  
  -- Contar itens pagos
  SELECT COUNT(*) INTO itens_pagos 
  FROM receitas_itens 
  WHERE receita_id = NEW.receita_id AND status = 'pago';
  
  -- Atualizar o status da receita principal
  IF itens_pagos = 0 THEN
    UPDATE receitas SET status = 'pendente' WHERE id = NEW.receita_id;
  ELSIF itens_pagos = total_itens THEN
    UPDATE receitas SET status = 'pago' WHERE id = NEW.receita_id;
  ELSE
    UPDATE receitas SET status = 'pago_parcial' WHERE id = NEW.receita_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função quando um item é inserido ou atualizado
CREATE TRIGGER trigger_atualizar_status_receita
AFTER INSERT OR UPDATE ON receitas_itens
FOR EACH ROW
EXECUTE FUNCTION atualizar_status_receita();

-- Comentários para documentar as tabelas
COMMENT ON TABLE receitas IS 'Registros de receitas vinculadas a propostas';
COMMENT ON TABLE receitas_itens IS 'Itens ou parcelas de pagamento de uma receita';
COMMENT ON TABLE formas_pagamento IS 'Formas de pagamento disponíveis';

COMMENT ON COLUMN receitas.proposta_id IS 'Referência à proposta que gerou a receita';
COMMENT ON COLUMN receitas.categoria_id IS 'Categoria da receita';
COMMENT ON COLUMN receitas.cliente_id IS 'Cliente associado à receita';
COMMENT ON COLUMN receitas.valor_total IS 'Valor total da receita';
COMMENT ON COLUMN receitas.status IS 'Status do pagamento da receita';

COMMENT ON COLUMN receitas_itens.receita_id IS 'Receita à qual este item pertence';
COMMENT ON COLUMN receitas_itens.condicao_pagamento_id IS 'Referência à condição de pagamento da proposta';
COMMENT ON COLUMN receitas_itens.forma_pagamento_id IS 'Forma de pagamento deste item';
COMMENT ON COLUMN receitas_itens.valor IS 'Valor deste item ou parcela';
COMMENT ON COLUMN receitas_itens.parcela IS 'Número da parcela (para pagamentos parcelados)';
COMMENT ON COLUMN receitas_itens.total_parcelas IS 'Total de parcelas (para pagamentos parcelados)';
COMMENT ON COLUMN receitas_itens.taxa_juros IS 'Taxa de juros aplicada (para cartão de crédito)';
COMMENT ON COLUMN receitas_itens.detalhes_pagamento IS 'Detalhes específicos da forma de pagamento (chave PIX, etc)'; 