import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Центральное API для CRM системы - управление маркетплейсами, товарами, заказами, аналитикой
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id, function_name
    Returns: HTTP response dict с данными CRM системы
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return cors_response()
    
    query_params = event.get('queryStringParameters', {}) or {}
    action = query_params.get('action', '')
    
    try:
        if action == 'getMarketplaces':
            return get_marketplaces()
        elif action == 'connectMarketplace' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return connect_marketplace(body_data)
        elif action == 'disconnectMarketplace' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return disconnect_marketplace(body_data)
        elif action == 'syncProducts' and method == 'POST':
            marketplace = query_params.get('marketplace')
            return sync_products(marketplace)
        elif action == 'fullSync' and method == 'POST':
            marketplace_id = query_params.get('marketplaceId')
            return full_marketplace_sync(marketplace_id)
        elif action == 'getProducts':
            marketplace = query_params.get('marketplace')
            return get_products(marketplace)
        elif action == 'updateProduct' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return update_product(body_data)
        elif action == 'getOrders':
            status = query_params.get('status')
            marketplace = query_params.get('marketplace')
            return get_orders(status, marketplace)
        elif action == 'updateOrderStatus' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return update_order_status(body_data)
        elif action == 'shipOrder' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return ship_order(body_data)
        elif action == 'getAnalytics':
            period = query_params.get('period', '30d')
            return get_analytics(period)
        elif action == 'getDashboard':
            return get_dashboard()
        else:
            return error_response('Invalid action', 400)
    except Exception as e:
        import traceback
        return error_response(f'{str(e)}\n\n{traceback.format_exc()}', 500)


def get_db_connection():
    """Получение подключения к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not set')
    conn = psycopg2.connect(database_url)
    conn.set_session(autocommit=True)
    return conn


def call_ozon_api(endpoint: str, client_id: str, api_key: str, method: str = 'POST', data: Optional[Dict] = None) -> Dict[str, Any]:
    """Вызов Ozon Seller API"""
    url = f'https://api-seller.ozon.ru{endpoint}'
    
    headers = {
        'Client-Id': client_id,
        'Api-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    req_data = json.dumps(data or {}).encode('utf-8')
    request = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f'Ozon API Error {e.code}: {error_body}')
    except Exception as e:
        raise Exception(f'Ozon API Request failed: {str(e)}')


def call_wildberries_api(endpoint: str, api_key: str, method: str = 'GET', data: Optional[Dict] = None) -> Any:
    """Вызов Wildberries Seller API"""
    url = f'https://suppliers-api.wildberries.ru{endpoint}'
    
    headers = {
        'Authorization': api_key,
        'Content-Type': 'application/json'
    }
    
    req_data = json.dumps(data).encode('utf-8') if data else None
    request = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            content = response.read().decode('utf-8')
            if content:
                return json.loads(content)
            return {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f'Wildberries API Error {e.code}: {error_body}')
    except Exception as e:
        raise Exception(f'Wildberries API Request failed: {str(e)}')


def sync_ozon_products(marketplace_id: int, client_id: str, api_key: str, conn, cur) -> int:
    """Синхронизация товаров с Ozon"""
    try:
        response = call_ozon_api('/v2/product/list', client_id, api_key, data={
            'filter': {'visibility': 'ALL'},
            'limit': 100
        })
        
        products = response.get('result', {}).get('items', [])
        synced = 0
        
        for item in products:
            product_id = item.get('product_id')
            if not product_id:
                continue
            
            info_response = call_ozon_api('/v2/product/info', client_id, api_key, data={
                'product_id': product_id
            })
            
            product_info = info_response.get('result', {})
            
            name = (product_info.get('name') or 'Товар без названия').replace("'", "''")
            sku = (product_info.get('offer_id') or f'OZON-{product_id}').replace("'", "''")
            price = float(product_info.get('price') or 0)
            stock = int(product_info.get('stocks', {}).get('present', 0))
            category = (product_info.get('category_name') or 'Без категории').replace("'", "''")
            
            cur.execute(f"SELECT id FROM products WHERE sku = '{sku}' LIMIT 1")
            existing = cur.fetchone()
            
            if existing:
                db_product_id = existing['id']
                cur.execute(f"""
                    UPDATE products
                    SET name = '{name}', price = {price}, stock = {stock}, 
                        category = '{category}', updated_at = CURRENT_TIMESTAMP
                    WHERE id = {db_product_id}
                """)
            else:
                cur.execute(f"""
                    INSERT INTO products (name, sku, price, stock, category)
                    VALUES ('{name}', '{sku}', {price}, {stock}, '{category}')
                    RETURNING id
                """)
                db_product_id = cur.fetchone()['id']
            
            cur.execute(f"""
                SELECT id FROM marketplace_products 
                WHERE product_id = {db_product_id} AND marketplace_id = {marketplace_id}
            """)
            
            if cur.fetchone():
                cur.execute(f"""
                    UPDATE marketplace_products
                    SET price = {price}, stock = {stock}, synced_at = CURRENT_TIMESTAMP
                    WHERE product_id = {db_product_id} AND marketplace_id = {marketplace_id}
                """)
            else:
                cur.execute(f"""
                    INSERT INTO marketplace_products (product_id, marketplace_id, price, stock, synced_at)
                    VALUES ({db_product_id}, {marketplace_id}, {price}, {stock}, CURRENT_TIMESTAMP)
                """)
            
            synced += 1
        
        return synced
    except Exception as e:
        raise Exception(f'Ozon sync failed: {str(e)}')


def sync_wildberries_products(marketplace_id: int, api_key: str, conn, cur) -> int:
    """Синхронизация товаров с Wildberries"""
    try:
        response = call_wildberries_api('/content/v1/cards/cursor/list', api_key, method='POST', data={
            'sort': {'cursor': {'limit': 100}},
            'filter': {'withPhoto': -1}
        })
        
        cards = response.get('data', {}).get('cards', [])
        synced = 0
        
        for card in cards:
            nm_id = card.get('nmID')
            if not nm_id:
                continue
            
            name = (card.get('title') or 'Товар без названия').replace("'", "''")
            sku = f'WB-{nm_id}'
            
            sizes = card.get('sizes', [])
            price = float(sizes[0].get('price', 0)) if sizes else 0
            stock = sum(int(s.get('stocks', [{}])[0].get('qty', 0)) for s in sizes)
            
            category = (card.get('object') or 'Без категории').replace("'", "''")
            
            cur.execute(f"SELECT id FROM products WHERE sku = '{sku}' LIMIT 1")
            existing = cur.fetchone()
            
            if existing:
                db_product_id = existing['id']
                cur.execute(f"""
                    UPDATE products
                    SET name = '{name}', price = {price}, stock = {stock}, 
                        category = '{category}', updated_at = CURRENT_TIMESTAMP
                    WHERE id = {db_product_id}
                """)
            else:
                cur.execute(f"""
                    INSERT INTO products (name, sku, price, stock, category)
                    VALUES ('{name}', '{sku}', {price}, {stock}, '{category}')
                    RETURNING id
                """)
                db_product_id = cur.fetchone()['id']
            
            cur.execute(f"""
                SELECT id FROM marketplace_products 
                WHERE product_id = {db_product_id} AND marketplace_id = {marketplace_id}
            """)
            
            if cur.fetchone():
                cur.execute(f"""
                    UPDATE marketplace_products
                    SET price = {price}, stock = {stock}, synced_at = CURRENT_TIMESTAMP
                    WHERE product_id = {db_product_id} AND marketplace_id = {marketplace_id}
                """)
            else:
                cur.execute(f"""
                    INSERT INTO marketplace_products (product_id, marketplace_id, price, stock, synced_at)
                    VALUES ({db_product_id}, {marketplace_id}, {price}, {stock}, CURRENT_TIMESTAMP)
                """)
            
            synced += 1
        
        return synced
    except Exception as e:
        raise Exception(f'Wildberries sync failed: {str(e)}')


def full_marketplace_sync(marketplace_id: Optional[str] = None) -> Dict[str, Any]:
    """Полная синхронизация всех данных с маркетплейса"""
    if not marketplace_id:
        return error_response('Marketplace ID required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT m.id, m.name, m.slug, umi.api_key, umi.store_id, umi.api_secret
        FROM marketplaces m
        JOIN user_marketplace_integrations umi ON m.id = umi.marketplace_id
        WHERE m.id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    mp = cur.fetchone()
    
    if not mp:
        cur.close()
        conn.close()
        return error_response(f'Marketplace ID {marketplace_id} not connected', 404)
    
    products_synced = 0
    orders_synced = 0
    customers_synced = 0
    
    marketplace_slug = mp['slug'].lower()
    
    try:
        if marketplace_slug == 'ozon':
            client_id = mp.get('store_id') or os.environ.get('OZON_CLIENT_ID')
            api_key = mp.get('api_key') or os.environ.get('OZON_API_KEY')
            
            if not client_id or not api_key:
                raise Exception('Ozon API credentials not configured')
            
            products_synced = sync_ozon_products(mp_id, client_id, api_key, conn, cur)
            
        elif marketplace_slug == 'wildberries':
            api_key = mp.get('api_key') or os.environ.get('WILDBERRIES_API_KEY')
            
            if not api_key:
                raise Exception('Wildberries API key not configured')
            
            products_synced = sync_wildberries_products(mp_id, api_key, conn, cur)
            
        else:
            mock_products = [
                {'name': f'Товар {i} - {mp["name"]}', 'sku': f'SKU-{mp["slug"]}-{i}', 
                 'price': 1500 + i * 100, 'cost_price': 800 + i * 50, 
                 'stock': 10 + i, 'category': 'Электроника'}
                for i in range(1, 6)
            ]
            
            for prod in mock_products:
                sku_escaped = prod['sku'].replace("'", "''")
                name_escaped = prod['name'].replace("'", "''")
                category_escaped = prod['category'].replace("'", "''")
                
                cur.execute(f"SELECT id FROM products WHERE sku = '{sku_escaped}' LIMIT 1")
                existing = cur.fetchone()
                
                if existing:
                    product_id = existing['id']
                    cur.execute(f"""
                        UPDATE products
                        SET name = '{name_escaped}', price = {prod['price']}, cost_price = {prod['cost_price']},
                            stock = {prod['stock']}, category = '{category_escaped}', updated_at = CURRENT_TIMESTAMP
                        WHERE id = {product_id}
                    """)
                else:
                    cur.execute(f"""
                        INSERT INTO products (name, sku, price, cost_price, stock, category)
                        VALUES ('{name_escaped}', '{sku_escaped}', {prod['price']}, {prod['cost_price']}, 
                                {prod['stock']}, '{category_escaped}')
                        RETURNING id
                    """)
                    product_id = cur.fetchone()['id']
                
                cur.execute(f"""
                    SELECT id FROM marketplace_products 
                    WHERE product_id = {product_id} AND marketplace_id = {mp['id']}
                """)
                
                if cur.fetchone():
                    cur.execute(f"""
                        UPDATE marketplace_products
                        SET price = {prod['price']}, stock = {prod['stock']}, synced_at = CURRENT_TIMESTAMP
                        WHERE product_id = {product_id} AND marketplace_id = {mp['id']}
                    """)
                else:
                    cur.execute(f"""
                        INSERT INTO marketplace_products (product_id, marketplace_id, price, stock, synced_at)
                        VALUES ({product_id}, {mp['id']}, {prod['price']}, {prod['stock']}, CURRENT_TIMESTAMP)
                    """)
                
                products_synced += 1
        
        cur.execute(f"""
            UPDATE user_marketplace_integrations
            SET last_sync = CURRENT_TIMESTAMP
            WHERE user_id = 1 AND marketplace_id = {mp['id']}
        """)
        
        cur.close()
        conn.close()
        
        return success_response({
            'products': products_synced,
            'orders': orders_synced,
            'customers': customers_synced,
            'marketplace': mp['name'],
            'message': f'Синхронизировано: товары ({products_synced}), заказы ({orders_synced}), клиенты ({customers_synced})'
        })
        
    except Exception as e:
        cur.close()
        conn.close()
        raise Exception(f'Sync error: {str(e)}')


def sync_products(marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Синхронизация товаров с маркетплейса (имитация)"""
    if not marketplace:
        return error_response('Marketplace parameter required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    marketplace_escaped = marketplace.replace("'", "''")
    cur.execute(f"""
        SELECT m.id, m.name, m.slug, umi.api_key
        FROM marketplaces m
        JOIN user_marketplace_integrations umi ON m.id = umi.marketplace_id
        WHERE (m.slug = '{marketplace_escaped}' OR LOWER(m.name) = LOWER('{marketplace_escaped}'))
          AND umi.user_id = 1
        LIMIT 1
    """)
    
    mp = cur.fetchone()
    
    if not mp:
        cur.close()
        conn.close()
        return error_response(f'Marketplace {marketplace} not connected', 404)
    
    mock_products = [
        {'name': f'Товар {i} - {mp["name"]}', 'sku': f'SKU-{mp["slug"]}-{i}', 'price': 1500 + i * 100, 
         'cost_price': 800 + i * 50, 'stock': 10 + i, 'category': 'Электроника'}
        for i in range(1, 4)
    ]
    
    synced_count = 0
    for prod in mock_products:
        sku_escaped = prod['sku'].replace("'", "''")
        name_escaped = prod['name'].replace("'", "''")
        category_escaped = prod['category'].replace("'", "''")
        
        cur.execute(f"SELECT id FROM products WHERE sku = '{sku_escaped}' LIMIT 1")
        existing = cur.fetchone()
        
        if existing:
            product_id = existing['id']
            cur.execute(f"""
                UPDATE products
                SET name = '{name_escaped}', price = {prod['price']}, cost_price = {prod['cost_price']},
                    stock = {prod['stock']}, category = '{category_escaped}'
                WHERE id = {product_id}
            """)
        else:
            cur.execute(f"""
                INSERT INTO products (name, sku, price, cost_price, stock, category)
                VALUES ('{name_escaped}', '{sku_escaped}', {prod['price']}, {prod['cost_price']}, 
                        {prod['stock']}, '{category_escaped}')
                RETURNING id
            """)
            product_id = cur.fetchone()['id']
        
        cur.execute(f"""
            SELECT id FROM marketplace_products 
            WHERE product_id = {product_id} AND marketplace_id = {mp['id']}
        """)
        mp_link = cur.fetchone()
        
        if mp_link:
            cur.execute(f"""
                UPDATE marketplace_products
                SET price = {prod['price']}, stock = {prod['stock']}, synced_at = CURRENT_TIMESTAMP
                WHERE product_id = {product_id} AND marketplace_id = {mp['id']}
            """)
        else:
            cur.execute(f"""
                INSERT INTO marketplace_products (product_id, marketplace_id, price, stock, synced_at)
                VALUES ({product_id}, {mp['id']}, {prod['price']}, {prod['stock']}, CURRENT_TIMESTAMP)
            """)
        
        synced_count += 1
    
    cur.execute(f"""
        UPDATE user_marketplace_integrations
        SET last_sync = CURRENT_TIMESTAMP
        WHERE user_id = 1 AND marketplace_id = {mp['id']}
    """)
    
    cur.close()
    conn.close()
    
    return success_response({
        'synced': synced_count,
        'marketplace': mp['name'],
        'message': f'Синхронизировано товаров: {synced_count}'
    })


def update_product(data: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление данных товара"""
    product_id = data.get('id')
    
    if not product_id:
        return error_response('Product ID required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    updates = []
    if 'name' in data:
        name_escaped = data['name'].replace("'", "''")
        updates.append(f"name = '{name_escaped}'")
    if 'sku' in data:
        sku_escaped = (data['sku'] or '').replace("'", "''")
        updates.append(f"sku = '{sku_escaped}'")
    if 'price' in data:
        updates.append(f"price = {float(data['price'])}")
    if 'cost_price' in data:
        updates.append(f"cost_price = {float(data['cost_price'])}")
    if 'stock' in data:
        updates.append(f"stock = {int(data['stock'])}")
    if 'category' in data:
        category_escaped = data['category'].replace("'", "''")
        updates.append(f"category = '{category_escaped}'")
    
    if not updates:
        return error_response('No fields to update', 400)
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    update_sql = ', '.join(updates)
    
    cur.execute(f"""
        UPDATE products
        SET {update_sql}
        WHERE id = {product_id}
        RETURNING *
    """)
    
    product = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not product:
        return error_response('Product not found', 404)
    
    return success_response({
        'product': dict(product),
        'message': 'Product updated'
    })


def ship_order(data: Dict[str, Any]) -> Dict[str, Any]:
    """Отправка заказа с трек-номером"""
    order_id = data.get('orderId')
    tracking_number = data.get('trackingNumber')
    
    if not order_id or not tracking_number:
        return error_response('Order ID and tracking number required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    tracking_escaped = tracking_number.replace("'", "''")
    shipped_at = datetime.now()
    
    cur.execute(f"""
        UPDATE orders
        SET status = 'shipped', tracking_number = '{tracking_escaped}', 
            shipped_at = '{shipped_at}', updated_at = CURRENT_TIMESTAMP
        WHERE id = {order_id}
        RETURNING *
    """)
    
    order = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not order:
        return error_response('Order not found', 404)
    
    return success_response({
        'order': dict(order),
        'message': f'Order shipped with tracking {tracking_number}'
    })


def get_marketplaces() -> Dict[str, Any]:
    """Получение списка всех маркетплейсов и их статуса"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            m.id,
            m.name,
            m.slug,
            m.logo_url,
            m.country,
            COALESCE(umi.api_key, '') as api_key,
            COALESCE(umi.store_id, '') as client_id,
            CASE WHEN umi.id IS NOT NULL THEN true ELSE false END as is_connected,
            umi.last_sync as last_sync_at
        FROM marketplaces m
        LEFT JOIN user_marketplace_integrations umi 
            ON m.id = umi.marketplace_id AND umi.user_id = 1
        ORDER BY m.name
    """)
    
    marketplaces = [dict(m) for m in cur.fetchall()]
    
    for marketplace in marketplaces:
        marketplace['products_count'] = 0
        marketplace['orders_count'] = 0
        marketplace['total_revenue'] = 0.0
    
    cur.close()
    conn.close()
    
    return success_response({
        'marketplaces': marketplaces,
        'total': len(marketplaces)
    })


def connect_marketplace(data: Dict[str, Any]) -> Dict[str, Any]:
    """Подключение нового маркетплейса"""
    name = data.get('name')
    api_key = data.get('apiKey')
    client_id = data.get('clientId')
    seller_id = data.get('sellerId')
    
    if not name:
        return error_response('Marketplace name required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    name_escaped = name.replace("'", "''")
    cur.execute(f"""
        SELECT id FROM marketplaces
        WHERE slug = '{name_escaped}' OR LOWER(name) = LOWER('{name_escaped}')
        LIMIT 1
    """)
    
    marketplace_result = cur.fetchone()
    
    if not marketplace_result:
        cur.close()
        conn.close()
        return error_response(f'Marketplace {name} not found', 404)
    
    marketplace_id = marketplace_result['id']
    user_id = 1
    
    cur.execute(f"""
        SELECT id FROM user_marketplace_integrations
        WHERE user_id = {user_id} AND marketplace_id = {marketplace_id}
    """)
    
    existing = cur.fetchone()
    
    if existing:
        api_key_escaped = (api_key or '').replace("'", "''")
        seller_id_escaped = (seller_id or '').replace("'", "''")
        client_id_escaped = (client_id or '').replace("'", "''")
        last_sync = datetime.now()
        cur.execute(f"""
            UPDATE user_marketplace_integrations
            SET api_key = '{api_key_escaped}', api_secret = '{seller_id_escaped}', store_id = '{client_id_escaped}', status = 'active', last_sync = '{last_sync}'
            WHERE user_id = {user_id} AND marketplace_id = {marketplace_id}
            RETURNING id
        """)
    else:
        api_key_escaped = (api_key or '').replace("'", "''")
        seller_id_escaped = (seller_id or '').replace("'", "''")
        client_id_escaped = (client_id or '').replace("'", "''")
        last_sync = datetime.now()
        cur.execute(f"""
            INSERT INTO user_marketplace_integrations 
            (user_id, marketplace_id, api_key, api_secret, store_id, status, last_sync)
            VALUES ({user_id}, {marketplace_id}, '{api_key_escaped}', '{seller_id_escaped}', '{client_id_escaped}', 'active', '{last_sync}')
            RETURNING id
        """)
    
    integration_id = cur.fetchone()['id']
    
    cur.execute(f"""
        SELECT 
            m.id,
            m.name,
            m.slug,
            m.logo_url,
            umi.api_key,
            umi.store_id as client_id,
            true as is_connected,
            umi.last_sync as last_sync_at
        FROM marketplaces m
        JOIN user_marketplace_integrations umi ON m.id = umi.marketplace_id
        WHERE umi.id = {integration_id}
    """)
    
    marketplace_info = cur.fetchone()
    
    cur.close()
    conn.close()
    
    return success_response({
        'marketplace': dict(marketplace_info),
        'message': f'{name.title()} connected',
        'success': True
    })


def disconnect_marketplace(data: Dict[str, Any]) -> Dict[str, Any]:
    """Отключение маркетплейса"""
    marketplace_id = data.get('marketplaceId')
    
    if not marketplace_id:
        return error_response('Marketplace ID required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    user_id = 1
    
    cur.execute(f"""
        DELETE FROM user_marketplace_integrations
        WHERE user_id = {user_id} AND marketplace_id = {marketplace_id}
        RETURNING marketplace_id
    """)
    
    deleted = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not deleted:
        return error_response('Integration not found', 404)
    
    return success_response({
        'success': True,
        'message': 'Marketplace disconnected'
    })


def get_products(marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение списка товаров"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if marketplace:
        marketplace_escaped = marketplace.replace("'", "''")
        cur.execute(f"""
            SELECT 
                p.*,
                mp.marketplace_id,
                mp.price as marketplace_price,
                mp.stock as marketplace_stock,
                m.name as marketplace_name
            FROM products p
            LEFT JOIN marketplace_products mp ON p.id = mp.product_id
            LEFT JOIN marketplaces m ON mp.marketplace_id = m.id
            WHERE m.slug = '{marketplace_escaped}' OR LOWER(m.name) = LOWER('{marketplace_escaped}')
            ORDER BY p.created_at DESC
        """)
    else:
        cur.execute("""
            SELECT * FROM products 
            ORDER BY created_at DESC
        """)
    
    products = [dict(p) for p in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    return success_response({
        'products': products,
        'total': len(products)
    })


def get_orders(status: Optional[str] = None, marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение списка заказов"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            o.*,
            c.name as customer_name,
            c.email as customer_email,
            m.name as marketplace_name,
            o.created_at as order_date
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN marketplaces m ON o.marketplace_id = m.id
        ORDER BY o.created_at DESC
    """)
    
    all_orders = [dict(order) for order in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    filtered_orders = all_orders
    
    if status and status != 'all':
        filtered_orders = [o for o in filtered_orders if o['status'] == status]
    
    if marketplace and marketplace != 'all':
        marketplace_lower = marketplace.lower()
        filtered_orders = [o for o in filtered_orders if o.get('marketplace_name') and o['marketplace_name'].lower() == marketplace_lower]
    
    return success_response({
        'orders': filtered_orders,
        'total': len(filtered_orders)
    })


def update_order_status(data: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление статуса заказа"""
    order_id = data.get('orderId')
    new_status = data.get('status')
    
    if not order_id or not new_status:
        return error_response('Order ID and status required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    status_escaped = new_status.replace("'", "''")
    
    cur.execute(f"""
        UPDATE orders
        SET status = '{status_escaped}', updated_at = CURRENT_TIMESTAMP
        WHERE id = {order_id}
        RETURNING *
    """)
    
    order = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not order:
        return error_response('Order not found', 404)
    
    return success_response({
        'order': dict(order),
        'message': f'Status updated to {new_status}'
    })


def get_analytics(period: str = '30d') -> Dict[str, Any]:
    """Получение аналитики за период"""
    days_map = {'7d': 7, '30d': 30, '90d': 90, '365d': 365}
    days = days_map.get(period, 30)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM orders")
    all_orders = [dict(o) for o in cur.fetchall()]
    
    start_date = datetime.now() - timedelta(days=days)
    
    filtered_orders = [
        o for o in all_orders 
        if o.get('created_at') and o['created_at'] >= start_date
    ]
    
    total_orders = len(filtered_orders)
    total_revenue = sum(float(o['total_amount']) for o in filtered_orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
    
    from collections import defaultdict
    daily_dict = defaultdict(lambda: {'orders': 0, 'revenue': 0.0})
    
    for o in filtered_orders:
        if o.get('created_at'):
            date_key = o['created_at'].date()
            daily_dict[date_key]['orders'] += 1
            daily_dict[date_key]['revenue'] += float(o['total_amount'])
    
    daily_data = [
        {'date': str(date), 'orders': data['orders'], 'revenue': data['revenue']}
        for date, data in sorted(daily_dict.items())
    ]
    
    cur.close()
    conn.close()
    
    return success_response({
        'summary': {
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'avg_order_value': avg_order_value
        },
        'daily': daily_data
    })


def get_dashboard() -> Dict[str, Any]:
    """Получение данных для дашборда"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT COUNT(*) as cnt FROM marketplaces")
    total_marketplaces = cur.fetchone()['cnt']
    
    cur.execute("SELECT COUNT(*) as cnt FROM user_marketplace_integrations WHERE user_id = 1")
    connected_marketplaces = cur.fetchone()['cnt']
    
    cur.execute("SELECT COUNT(*) as cnt FROM products")
    total_products = cur.fetchone()['cnt']
    
    cur.execute("SELECT COUNT(*) as cnt FROM orders")
    total_orders = cur.fetchone()['cnt']
    
    cur.execute("SELECT * FROM orders")
    all_orders = [dict(o) for o in cur.fetchall()]
    total_revenue = sum(float(o['total_amount']) for o in all_orders)
    
    cur.execute("""
        SELECT o.*, c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
        LIMIT 5
    """)
    recent_orders = [dict(o) for o in cur.fetchall()]
    for order in recent_orders:
        order['order_date'] = str(order.get('created_at', ''))
    
    cur.execute("""
        SELECT * FROM products
        WHERE stock < 10
        ORDER BY stock ASC
        LIMIT 5
    """)
    low_stock_products = [dict(p) for p in cur.fetchall()]
    for product in low_stock_products:
        product['total_stock'] = product.get('stock', 0)
    
    cur.close()
    conn.close()
    
    stats = {
        'total_marketplaces': total_marketplaces,
        'connected_marketplaces': connected_marketplaces,
        'total_products': total_products,
        'total_orders': total_orders,
        'total_revenue': total_revenue
    }
    
    return success_response({
        'stats': stats,
        'recentOrders': recent_orders,
        'lowStockProducts': low_stock_products
    })


def cors_response() -> Dict[str, Any]:
    """CORS preflight response"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
            'Access-Control-Max-Age': '86400'
        },
        'body': ''
    }


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Успешный HTTP response"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(data, default=str)
    }


def error_response(message: str, status_code: int = 500) -> Dict[str, Any]:
    """HTTP response с ошибкой"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': message}, default=str)
    }
