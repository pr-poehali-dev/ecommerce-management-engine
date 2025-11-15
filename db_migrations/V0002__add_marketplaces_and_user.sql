-- Add missing columns and data for ecommerce platform

-- Add user to users table
INSERT INTO t_p86529894_ecommerce_management.users (email, password_hash, full_name, company_name, subscription_plan, role, status, created_at) VALUES
('demo@sellhub.com', '$2a$10$dummyhash', 'Александр Иванов', 'ИП Иванов А.С.', 'premium', 'seller', 'active', CURRENT_TIMESTAMP);

-- Insert marketplaces data
INSERT INTO t_p86529894_ecommerce_management.marketplaces (name, slug, country, logo_url, api_available, status) VALUES
('Amazon', 'amazon', 'USA', 'https://logo.clearbit.com/amazon.com', true, 'active'),
('eBay', 'ebay', 'USA', 'https://logo.clearbit.com/ebay.com', true, 'active'),
('Wildberries', 'wildberries', 'Russia', 'https://logo.clearbit.com/wildberries.ru', true, 'active'),
('Ozon', 'ozon', 'Russia', 'https://logo.clearbit.com/ozon.ru', true, 'active'),
('AliExpress', 'aliexpress', 'China', 'https://logo.clearbit.com/aliexpress.com', true, 'active'),
('Etsy', 'etsy', 'USA', 'https://logo.clearbit.com/etsy.com', true, 'active'),
('Shopify', 'shopify', 'Canada', 'https://logo.clearbit.com/shopify.com', true, 'active'),
('Alibaba', 'alibaba', 'China', 'https://logo.clearbit.com/alibaba.com', true, 'active'),
('Mercado Libre', 'mercadolibre', 'Argentina', 'https://logo.clearbit.com/mercadolibre.com', true, 'active'),
('Rakuten', 'rakuten', 'Japan', 'https://logo.clearbit.com/rakuten.com', true, 'active');

-- Add some demo integrations
INSERT INTO t_p86529894_ecommerce_management.user_marketplace_integrations (user_id, marketplace_id, store_id, status, created_at) VALUES
(1, 1, 'amazon-store-123', 'active', CURRENT_TIMESTAMP),
(1, 3, 'wb-store-456', 'active', CURRENT_TIMESTAMP),
(1, 4, 'ozon-store-789', 'active', CURRENT_TIMESTAMP);