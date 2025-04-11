-- SQL para adicionar o campo taxa_imposto à tabela notas_fiscais
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS taxa_imposto DECIMAL(5, 2) DEFAULT 15.00 NOT NULL;

-- Adicionar comentário para o novo campo
COMMENT ON COLUMN notas_fiscais.taxa_imposto IS 'Taxa de imposto aplicada à nota fiscal (em porcentagem)';

-- Atualizar os registros existentes para usar o valor padrão de 15%
UPDATE notas_fiscais
SET taxa_imposto = 6.00
WHERE taxa_imposto IS NULL;

-- Verificar se a coluna foi adicionada corretamente
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'notas_fiscais' AND column_name = 'taxa_imposto';

-- Comando para rodar esta migração:
-- psql -U seu_usuario -d sua_base_dados -f atualizar_tabela_notas_fiscais.sql 