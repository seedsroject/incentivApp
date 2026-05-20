-- ═══════════════════════════════════════════════════════════════
-- 017: Adiciona purchase_date à tabela inventory_items
--      Para rastreamento de renovação de estoque
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS purchase_date DATE;

COMMENT ON COLUMN inventory_items.purchase_date IS 'Data de compra/cadastro do item para previsão de renovação de estoque';

-- Backfill: itens existentes recebem a data de criação como data de compra
UPDATE inventory_items 
SET purchase_date = created_at::date
WHERE purchase_date IS NULL;
