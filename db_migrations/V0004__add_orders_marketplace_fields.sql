ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace_id INTEGER REFERENCES marketplaces(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(10) DEFAULT 'FBS';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;

COMMENT ON COLUMN orders.marketplace_id IS 'ID маркетплейса откуда пришел заказ';
COMMENT ON COLUMN orders.fulfillment_type IS 'Тип выполнения заказа: FBO (склад маркетплейса) или FBS (свой склад)';
COMMENT ON COLUMN orders.tracking_number IS 'Трек-номер отправления';
COMMENT ON COLUMN orders.shipped_at IS 'Дата и время отправки заказа';