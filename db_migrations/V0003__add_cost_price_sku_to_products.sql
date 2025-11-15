ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

COMMENT ON COLUMN products.cost_price IS 'Себестоимость товара для расчета чистой прибыли';
COMMENT ON COLUMN products.sku IS 'Артикул товара (SKU)';