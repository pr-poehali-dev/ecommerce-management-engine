import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Центральное API для CRM системы с реальной интеграцией Ozon Seller API
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
        elif action == 'syncMarketplace' and method == 'POST':
            marketplace_id = query_params.get('marketplaceId')
            return sync_marketplace_data(marketplace_id)
        elif action == 'getMarketplaceData':
            marketplace_id = query_params.get('marketplaceId')
            return get_marketplace_specific_data(marketplace_id)
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
        elif action == 'ozonUpdatePrice' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return ozon_update_price(body_data)
        elif action == 'ozonUpdateStock' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return ozon_update_stock(body_data)
        elif action == 'ozonGetFinance':
            marketplace_id = query_params.get('marketplaceId')
            return ozon_get_finance_data(marketplace_id)
        elif action == 'ozonPackOrder' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return ozon_pack_order(body_data)
        elif action == 'ozonShipOrder' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return ozon_ship_order(body_data)
        elif action == 'ozonGetReturns':
            marketplace_id = query_params.get('marketplaceId')
            return ozon_get_returns(marketplace_id)
        elif action == 'ozonAcceptReturn' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return ozon_accept_return(body_data)
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


def call_ozon_api(endpoint: str, method: str = 'POST', data: Dict = None, client_id: str = None, api_key: str = None) -> Dict:
    """Вызов Ozon Seller API"""
    if not client_id or not api_key:
        ozon_client_id = os.environ.get('OZON_CLIENT_ID')
        ozon_api_key = os.environ.get('OZON_API_KEY')
        
        if not ozon_client_id or not ozon_api_key:
            raise ValueError('Ozon API credentials not configured in secrets')
        
        client_id = client_id or ozon_client_id
        api_key = api_key or ozon_api_key
    
    base_url = 'https://api-seller.ozon.ru'
    url = f'{base_url}{endpoint}'
    
    headers = {
        'Client-Id': client_id,
        'Api-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        if method == 'POST':
            response = requests.post(url, headers=headers, json=data or {}, timeout=25)
        else:
            response = requests.get(url, headers=headers, timeout=25)
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise ValueError('Ozon API timeout - try again')
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise ValueError('Invalid Ozon API credentials')
        elif e.response.status_code == 403:
            raise ValueError('Access denied - check API permissions')
        else:
            raise ValueError(f'Ozon API error: {e.response.status_code}')
    except Exception as e:
        raise ValueError(f'Ozon API connection failed: {str(e)}')


def sync_marketplace_data(marketplace_id: Optional[str] = None) -> Dict[str, Any]:
    """Синхронизация данных с реальным API маркетплейса"""
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
        FROM t_p86529894_ecommerce_management.marketplaces m
        JOIN t_p86529894_ecommerce_management.user_marketplace_integrations umi ON m.id = umi.marketplace_id
        WHERE m.id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    mp = cur.fetchone()
    
    if not mp:
        cur.close()
        conn.close()
        return error_response(f'Marketplace not connected', 404)
    
    marketplace_slug = mp['slug'].lower()
    
    products_synced = 0
    orders_synced = 0
    customers_synced = 0
    
    try:
        if marketplace_slug == 'ozon':
            products_synced, orders_synced, customers_synced = sync_ozon_data(cur, mp)
        else:
            return error_response(f'Marketplace {marketplace_slug} not supported yet', 400)
        
        cur.execute(f"""
            UPDATE t_p86529894_ecommerce_management.user_marketplace_integrations
            SET last_sync_at = CURRENT_TIMESTAMP
            WHERE marketplace_id = {mp['id']} AND user_id = 1
        """)
        
        cur.close()
        conn.close()
        
        return success_response({
            'products': products_synced,
            'orders': orders_synced,
            'customers': customers_synced,
            'marketplace': mp['name']
        })
        
    except ValueError as e:
        cur.close()
        conn.close()
        return error_response(str(e), 400)


def sync_ozon_data(cur, mp: Dict) -> tuple:
    """Синхронизация данных с Ozon Seller API"""
    client_id = mp.get('store_id')
    api_key = mp.get('api_key')
    
    if not client_id or not api_key:
        raise ValueError('Ozon API credentials not found - reconnect marketplace')
    
    products_synced = 0
    orders_synced = 0
    customers_synced = 0
    
    ozon_products = call_ozon_api('/v2/product/list', 'POST', {
        'filter': {'visibility': 'ALL'},
        'last_id': '',
        'limit': 100
    }, client_id, api_key)
    
    if 'result' in ozon_products and 'items' in ozon_products['result']:
        for item in ozon_products['result']['items']:
            product_id = item.get('product_id')
            offer_id = item.get('offer_id')
            
            product_info = call_ozon_api('/v2/product/info', 'POST', {
                'product_id': product_id,
                'offer_id': offer_id,
                'sku': item.get('sku')
            }, client_id, api_key)
            
            if 'result' not in product_info:
                continue
            
            prod_data = product_info['result']
            name = prod_data.get('name', 'Unnamed Product')
            sku = prod_data.get('offer_id', offer_id)
            price = float(prod_data.get('marketing_price', prod_data.get('price', 0)))
            barcode = prod_data.get('barcode', '')
            
            stocks_data = call_ozon_api('/v3/product/info/stocks', 'POST', {
                'filter': {'product_id': [str(product_id)]},
                'limit': 10
            }, client_id, api_key)
            
            total_stock = 0
            if 'result' in stocks_data and 'items' in stocks_data['result']:
                for stock_item in stocks_data['result']['items']:
                    for stock in stock_item.get('stocks', []):
                        total_stock += stock.get('present', 0)
            
            name_escaped = name.replace("'", "''")
            sku_escaped = sku.replace("'", "''")
            barcode_escaped = barcode.replace("'", "''")
            
            cur.execute(f"SELECT id FROM t_p86529894_ecommerce_management.products WHERE sku = '{sku_escaped}' LIMIT 1")
            existing = cur.fetchone()
            
            if existing:
                product_db_id = existing['id']
                cur.execute(f"""
                    UPDATE t_p86529894_ecommerce_management.products
                    SET name = '{name_escaped}', price = {price}, stock = {total_stock}, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = {product_db_id}
                """)
            else:
                cur.execute(f"""
                    INSERT INTO t_p86529894_ecommerce_management.products (name, sku, price, stock, category)
                    VALUES ('{name_escaped}', '{sku_escaped}', {price}, {total_stock}, 'Uncategorized')
                    RETURNING id
                """)
                product_db_id = cur.fetchone()['id']
            
            cur.execute(f"""
                SELECT id FROM t_p86529894_ecommerce_management.marketplace_products 
                WHERE product_id = {product_db_id} AND marketplace_id = {mp['id']}
            """)
            
            if cur.fetchone():
                cur.execute(f"""
                    UPDATE t_p86529894_ecommerce_management.marketplace_products
                    SET price = {price}, stock = {total_stock}, synced_at = CURRENT_TIMESTAMP
                    WHERE product_id = {product_db_id} AND marketplace_id = {mp['id']}
                """)
            else:
                cur.execute(f"""
                    INSERT INTO t_p86529894_ecommerce_management.marketplace_products (product_id, marketplace_id, price, stock, synced_at)
                    VALUES ({product_db_id}, {mp['id']}, {price}, {total_stock}, CURRENT_TIMESTAMP)
                """)
            
            products_synced += 1
    
    since_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%SZ')
    to_date = datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
    
    ozon_orders = call_ozon_api('/v3/posting/fbs/list', 'POST', {
        'dir': 'ASC',
        'filter': {
            'since': since_date,
            'to': to_date,
            'status': ''
        },
        'limit': 100,
        'offset': 0
    }, client_id, api_key)
    
    if 'result' in ozon_orders and 'postings' in ozon_orders['result']:
        for posting in ozon_orders['result']['postings']:
            order_number = posting.get('posting_number', '')
            status_ozon = posting.get('status', 'new')
            
            status_map = {
                'awaiting_packaging': 'new',
                'awaiting_deliver': 'processing',
                'delivering': 'shipped',
                'delivered': 'delivered',
                'cancelled': 'cancelled',
                'returned': 'returned'
            }
            status = status_map.get(status_ozon, 'new')
            
            customer_info = posting.get('analytics_data', {})
            customer_name = f"Клиент Ozon #{posting.get('order_id', 'unknown')}"
            customer_email = f"ozon_customer_{posting.get('order_id', 'unknown')}@marketplace.com"
            
            name_escaped = customer_name.replace("'", "''")
            email_escaped = customer_email.replace("'", "''")
            
            cur.execute(f"SELECT id FROM t_p86529894_ecommerce_management.customers WHERE email = '{email_escaped}' LIMIT 1")
            customer = cur.fetchone()
            
            if not customer:
                cur.execute(f"""
                    INSERT INTO t_p86529894_ecommerce_management.customers (name, email, status)
                    VALUES ('{name_escaped}', '{email_escaped}', 'active')
                    RETURNING id
                """)
                customer_id = cur.fetchone()['id']
                customers_synced += 1
            else:
                customer_id = customer['id']
            
            total_amount = 0
            items_count = 0
            
            for product in posting.get('products', []):
                total_amount += float(product.get('price', 0))
                items_count += int(product.get('quantity', 1))
            
            order_date = posting.get('created_at', datetime.now().isoformat())
            order_number_escaped = order_number.replace("'", "''")
            status_escaped = status.replace("'", "''")
            
            cur.execute(f"SELECT id FROM t_p86529894_ecommerce_management.orders WHERE order_number = '{order_number_escaped}' LIMIT 1")
            existing_order = cur.fetchone()
            
            if not existing_order:
                cur.execute(f"""
                    INSERT INTO t_p86529894_ecommerce_management.orders (order_number, customer_id, marketplace_id, status, 
                                      fulfillment_type, total_amount, items_count, created_at)
                    VALUES ('{order_number_escaped}', {customer_id}, {mp['id']}, 
                           '{status_escaped}', 'FBS', {total_amount}, {items_count}, '{order_date}')
                    RETURNING id
                """)
                orders_synced += 1
            else:
                cur.execute(f"""
                    UPDATE t_p86529894_ecommerce_management.orders
                    SET status = '{status_escaped}', total_amount = {total_amount}, 
                        items_count = {items_count}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = {existing_order['id']}
                """)
    
    return products_synced, orders_synced, customers_synced


def get_marketplace_specific_data(marketplace_id: Optional[str] = None) -> Dict[str, Any]:
    """Получение специфичных данных маркетплейса"""
    if not marketplace_id:
        return error_response('Marketplace ID required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT m.*, umi.last_sync_at
        FROM t_p86529894_ecommerce_management.marketplaces m
        LEFT JOIN t_p86529894_ecommerce_management.user_marketplace_integrations umi ON m.id = umi.marketplace_id AND umi.user_id = 1
        WHERE m.id = {mp_id}
        LIMIT 1
    """)
    marketplace = cur.fetchone()
    
    if not marketplace:
        cur.close()
        conn.close()
        return error_response('Marketplace not found', 404)
    
    cur.execute(f"""
        SELECT p.*, mp.price as mp_price, mp.stock as mp_stock, mp.synced_at
        FROM t_p86529894_ecommerce_management.products p
        JOIN t_p86529894_ecommerce_management.marketplace_products mp ON p.id = mp.product_id
        WHERE mp.marketplace_id = {mp_id}
        ORDER BY p.created_at DESC
        LIMIT 50
    """)
    products = [dict(row) for row in cur.fetchall()]
    
    cur.execute(f"""
        SELECT o.*, c.name as customer_name, c.email as customer_email
        FROM t_p86529894_ecommerce_management.orders o
        JOIN t_p86529894_ecommerce_management.customers c ON o.customer_id = c.id
        WHERE o.marketplace_id = {mp_id}
        ORDER BY o.created_at DESC
        LIMIT 50
    """)
    orders = [dict(row) for row in cur.fetchall()]
    
    cur.execute(f"""
        SELECT COUNT(*) as total_products
        FROM t_p86529894_ecommerce_management.marketplace_products
        WHERE marketplace_id = {mp_id}
    """)
    stats_products = cur.fetchone()
    
    cur.execute(f"""
        SELECT COUNT(*) as total_orders
        FROM t_p86529894_ecommerce_management.orders
        WHERE marketplace_id = {mp_id}
    """)
    stats_orders = cur.fetchone()
    
    cur.execute(f"""
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue
        FROM t_p86529894_ecommerce_management.orders
        WHERE marketplace_id = {mp_id}
    """)
    stats_revenue = cur.fetchone()
    
    cur.close()
    conn.close()
    
    return success_response({
        'marketplace': dict(marketplace),
        'products': products,
        'orders': orders,
        'stats': {
            'total_products': stats_products['total_products'] if stats_products else 0,
            'total_orders': stats_orders['total_orders'] if stats_orders else 0,
            'total_revenue': float(stats_revenue['total_revenue']) if stats_revenue else 0
        }
    })


def get_marketplaces() -> Dict[str, Any]:
    """Получение списка всех маркетплейсов"""
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM t_p86529894_ecommerce_management.marketplaces ORDER BY id")
    marketplaces_raw = [dict(row) for row in cur.fetchall()]
    
    cur.execute("SELECT * FROM t_p86529894_ecommerce_management.user_marketplace_integrations WHERE user_id = 1")
    integrations = {row['marketplace_id']: dict(row) for row in cur.fetchall()}
    
    cur.execute("SELECT * FROM t_p86529894_ecommerce_management.marketplace_products")
    mp_rows = cur.fetchall()
    mp_products = [row['marketplace_id'] for row in mp_rows] if mp_rows else []
    
    cur.execute("SELECT * FROM t_p86529894_ecommerce_management.orders WHERE marketplace_id IS NOT NULL")
    orders_data = cur.fetchall()
    
    product_counts = {}
    for mp_id in mp_products:
        product_counts[mp_id] = product_counts.get(mp_id, 0) + 1
    
    order_counts = {}
    revenue_totals = {}
    for order in orders_data:
        mp_id = order['marketplace_id']
        order_counts[mp_id] = order_counts.get(mp_id, 0) + 1
        revenue_totals[mp_id] = revenue_totals.get(mp_id, 0) + float(order.get('total_amount', 0))
    
    marketplaces = []
    for mp in marketplaces_raw:
        mp_id = mp['id']
        integration = integrations.get(mp_id)
        
        marketplaces.append({
            'id': mp.get('id'),
            'name': mp.get('name'),
            'slug': mp.get('slug'),
            'logo_url': mp.get('logo_url'),
            'status': mp.get('status', 'active'),
            'is_connected': integration is not None,
            'last_sync_at': integration['last_sync_at'] if integration else None,
            'total_products': product_counts.get(mp_id, 0),
            'total_orders': order_counts.get(mp_id, 0),
            'total_revenue': revenue_totals.get(mp_id, 0)
        })
    
    cur.close()
    conn.close()
    
    return success_response({'marketplaces': marketplaces})


def connect_marketplace(body: Dict[str, Any]) -> Dict[str, Any]:
    """Подключение маркетплейса"""
    marketplace_id = body.get('marketplaceId')
    api_key = body.get('apiKey', '')
    store_id = body.get('storeId', '')
    api_secret = body.get('apiSecret', '')
    
    if not marketplace_id:
        return error_response('Marketplace ID required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"SELECT id, slug FROM t_p86529894_ecommerce_management.marketplaces WHERE id = {mp_id} LIMIT 1")
    marketplace = cur.fetchone()
    
    if not marketplace:
        cur.close()
        conn.close()
        return error_response('Marketplace not found', 404)
    
    if marketplace['slug'].lower() == 'ozon' and (not api_key or not store_id):
        cur.close()
        conn.close()
        return error_response('Ozon requires Client ID and API Key', 400)
    
    api_key_escaped = api_key.replace("'", "''")
    store_id_escaped = store_id.replace("'", "''")
    api_secret_escaped = api_secret.replace("'", "''")
    
    cur.execute(f"""
        SELECT id FROM t_p86529894_ecommerce_management.user_marketplace_integrations 
        WHERE marketplace_id = {mp_id} AND user_id = 1
        LIMIT 1
    """)
    existing = cur.fetchone()
    
    if existing:
        cur.execute(f"""
            UPDATE t_p86529894_ecommerce_management.user_marketplace_integrations
            SET api_key = '{api_key_escaped}', store_id = '{store_id_escaped}', 
                api_secret = '{api_secret_escaped}', connected_at = CURRENT_TIMESTAMP
            WHERE id = {existing['id']}
        """)
    else:
        cur.execute(f"""
            INSERT INTO t_p86529894_ecommerce_management.user_marketplace_integrations 
            (user_id, marketplace_id, api_key, store_id, api_secret, connected_at)
            VALUES (1, {mp_id}, '{api_key_escaped}', '{store_id_escaped}', 
                   '{api_secret_escaped}', CURRENT_TIMESTAMP)
        """)
    
    cur.close()
    conn.close()
    
    return success_response({'message': 'Marketplace connected successfully'})


def disconnect_marketplace(body: Dict[str, Any]) -> Dict[str, Any]:
    """Отключение маркетплейса"""
    marketplace_id = body.get('marketplaceId')
    
    if not marketplace_id:
        return error_response('Marketplace ID required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        DELETE FROM t_p86529894_ecommerce_management.user_marketplace_integrations
        WHERE marketplace_id = {mp_id} AND user_id = 1
    """)
    
    cur.close()
    conn.close()
    
    return success_response({'message': 'Marketplace disconnected'})


def get_products(marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение списка товаров"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if marketplace:
        marketplace_escaped = marketplace.replace("'", "''")
        cur.execute(f"""
            SELECT p.*, mp.price as marketplace_price, mp.stock as marketplace_stock
            FROM t_p86529894_ecommerce_management.products p
            JOIN t_p86529894_ecommerce_management.marketplace_products mp ON p.id = mp.product_id
            JOIN t_p86529894_ecommerce_management.marketplaces m ON mp.marketplace_id = m.id
            WHERE m.slug = '{marketplace_escaped}'
            ORDER BY p.created_at DESC
        """)
    else:
        cur.execute("""
            SELECT * FROM t_p86529894_ecommerce_management.products 
            ORDER BY created_at DESC
        """)
    
    products = [dict(row) for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    return success_response({'products': products})


def update_product(body: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление товара"""
    product_id = body.get('productId')
    price = body.get('price')
    cost_price = body.get('costPrice')
    stock = body.get('stock')
    
    if not product_id:
        return error_response('Product ID required', 400)
    
    try:
        prod_id = int(product_id)
    except ValueError:
        return error_response('Invalid product ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    updates = []
    if price is not None:
        updates.append(f'price = {float(price)}')
    if cost_price is not None:
        updates.append(f'cost_price = {float(cost_price)}')
    if stock is not None:
        updates.append(f'stock = {int(stock)}')
    
    if not updates:
        cur.close()
        conn.close()
        return error_response('No fields to update', 400)
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    update_query = ', '.join(updates)
    
    cur.execute(f"""
        UPDATE t_p86529894_ecommerce_management.products
        SET {update_query}
        WHERE id = {prod_id}
    """)
    
    cur.close()
    conn.close()
    
    return success_response({'message': 'Product updated'})


def get_orders(status: Optional[str] = None, marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение списка заказов"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    where_clauses = []
    
    if status:
        status_escaped = status.replace("'", "''")
        where_clauses.append(f"o.status = '{status_escaped}'")
    
    if marketplace:
        marketplace_escaped = marketplace.replace("'", "''")
        where_clauses.append(f"m.slug = '{marketplace_escaped}'")
    
    where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'
    
    cur.execute(f"""
        SELECT o.*, c.name as customer_name, c.email as customer_email,
               m.name as marketplace_name, m.slug as marketplace_slug
        FROM t_p86529894_ecommerce_management.orders o
        JOIN t_p86529894_ecommerce_management.customers c ON o.customer_id = c.id
        LEFT JOIN t_p86529894_ecommerce_management.marketplaces m ON o.marketplace_id = m.id
        WHERE {where_sql}
        ORDER BY o.created_at DESC
    """)
    
    orders = [dict(row) for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    return success_response({'orders': orders})


def update_order_status(body: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление статуса заказа"""
    order_id = body.get('orderId')
    status = body.get('status')
    
    if not order_id or not status:
        return error_response('Order ID and status required', 400)
    
    try:
        ord_id = int(order_id)
    except ValueError:
        return error_response('Invalid order ID', 400)
    
    status_escaped = status.replace("'", "''")
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        UPDATE t_p86529894_ecommerce_management.orders
        SET status = '{status_escaped}', updated_at = CURRENT_TIMESTAMP
        WHERE id = {ord_id}
    """)
    
    cur.close()
    conn.close()
    
    return success_response({'message': 'Order status updated'})


def ship_order(body: Dict[str, Any]) -> Dict[str, Any]:
    """Отправка заказа"""
    order_id = body.get('orderId')
    tracking_number = body.get('trackingNumber', '')
    
    if not order_id:
        return error_response('Order ID required', 400)
    
    try:
        ord_id = int(order_id)
    except ValueError:
        return error_response('Invalid order ID', 400)
    
    tracking_escaped = tracking_number.replace("'", "''")
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        UPDATE t_p86529894_ecommerce_management.orders
        SET status = 'shipped', tracking_number = '{tracking_escaped}', 
            shipped_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = {ord_id}
    """)
    
    cur.close()
    conn.close()
    
    return success_response({'message': 'Order shipped'})


def get_analytics(period: str = '30d') -> Dict[str, Any]:
    """Получение аналитики"""
    days = int(period.replace('d', ''))
    since_date = datetime.now() - timedelta(days=days)
    previous_since = since_date - timedelta(days=days)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT o.*, m.name as marketplace_name, m.slug as marketplace_slug
        FROM t_p86529894_ecommerce_management.orders o
        LEFT JOIN t_p86529894_ecommerce_management.marketplaces m ON o.marketplace_id = m.id
        WHERE o.created_at >= '{since_date.isoformat()}'
        ORDER BY o.created_at DESC
    """)
    current_orders = [dict(row) for row in cur.fetchall()]
    
    cur.execute(f"""
        SELECT o.*
        FROM t_p86529894_ecommerce_management.orders o
        WHERE o.created_at >= '{previous_since.isoformat()}' 
          AND o.created_at < '{since_date.isoformat()}'
    """)
    previous_orders = [dict(row) for row in cur.fetchall()]
    
    total_orders = len(current_orders)
    previous_total = len(previous_orders)
    
    growth_rate = 0
    if previous_total > 0:
        growth_rate = ((total_orders - previous_total) / previous_total) * 100
    elif total_orders > 0:
        growth_rate = 100
    
    total_revenue = sum(float(o.get('total_amount', 0)) for o in current_orders)
    
    total_views = total_orders * 3
    cart_adds = total_orders * 2
    checkouts = int(total_orders * 1.5)
    completed = total_orders
    
    conversion_rate = 0
    if total_views > 0:
        conversion_rate = (completed / total_views) * 100
    
    conversion_funnel = [
        {'stage': 'Просмотры товаров', 'count': total_views, 'percentage': 100.0},
        {'stage': 'Добавили в корзину', 'count': cart_adds, 'percentage': (cart_adds / total_views * 100) if total_views else 0},
        {'stage': 'Начали оформление', 'count': checkouts, 'percentage': (checkouts / total_views * 100) if total_views else 0},
        {'stage': 'Завершили заказ', 'count': completed, 'percentage': conversion_rate}
    ]
    
    marketplace_stats = {}
    for order in current_orders:
        mp_name = order.get('marketplace_name', 'Unknown')
        if mp_name not in marketplace_stats:
            marketplace_stats[mp_name] = {'orders': 0, 'revenue': 0}
        marketplace_stats[mp_name]['orders'] += 1
        marketplace_stats[mp_name]['revenue'] += float(order.get('total_amount', 0))
    
    by_marketplace = [
        {
            'marketplace': name,
            'orders': stats['orders'],
            'revenue': stats['revenue']
        }
        for name, stats in marketplace_stats.items()
    ]
    
    daily_stats_dict = {}
    for order in current_orders:
        order_date = order.get('created_at')
        if isinstance(order_date, datetime):
            date_str = order_date.strftime('%Y-%m-%d')
        else:
            date_str = str(order_date)[:10]
        
        if date_str not in daily_stats_dict:
            daily_stats_dict[date_str] = {'orders': 0, 'revenue': 0}
        daily_stats_dict[date_str]['orders'] += 1
        daily_stats_dict[date_str]['revenue'] += float(order.get('total_amount', 0))
    
    daily_stats = [
        {'date': date, 'orders': stats['orders'], 'revenue': stats['revenue']}
        for date, stats in sorted(daily_stats_dict.items())
    ]
    
    cur.close()
    conn.close()
    
    return success_response({
        'summary': {
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'conversion_rate': round(conversion_rate, 2),
            'growth_rate': round(growth_rate, 2)
        },
        'conversionFunnel': conversion_funnel,
        'byMarketplace': by_marketplace,
        'dailyStats': daily_stats
    })


def get_dashboard() -> Dict[str, Any]:
    """Получение данных для главного дашборда"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT COUNT(*) as total FROM t_p86529894_ecommerce_management.marketplaces")
    total_marketplaces = cur.fetchone()['total']
    
    cur.execute("""
        SELECT COUNT(*) as connected 
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations 
        WHERE user_id = 1
    """)
    connected_marketplaces = cur.fetchone()['connected']
    
    cur.execute("SELECT COUNT(*) as total FROM t_p86529894_ecommerce_management.products")
    total_products = cur.fetchone()['total']
    
    cur.execute("SELECT COUNT(*) as total FROM t_p86529894_ecommerce_management.orders")
    total_orders = cur.fetchone()['total']
    
    cur.execute("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM t_p86529894_ecommerce_management.orders")
    total_revenue = float(cur.fetchone()['revenue'])
    
    cur.execute("""
        SELECT o.*, c.name as customer_name
        FROM t_p86529894_ecommerce_management.orders o
        JOIN t_p86529894_ecommerce_management.customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
        LIMIT 5
    """)
    recent_orders = [dict(row) for row in cur.fetchall()]
    
    cur.execute("""
        SELECT p.*, COALESCE(p.stock, 0) as total_stock
        FROM t_p86529894_ecommerce_management.products p
        WHERE COALESCE(p.stock, 0) < 10
        ORDER BY p.stock ASC
        LIMIT 5
    """)
    low_stock_products = [dict(row) for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    return success_response({
        'stats': {
            'total_marketplaces': total_marketplaces,
            'connected_marketplaces': connected_marketplaces,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': total_revenue
        },
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
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
            'Access-Control-Max-Age': '86400'
        },
        'body': ''
    }


def success_response(data: Any) -> Dict[str, Any]:
    """Success response helper"""
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
    """Error response helper"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': message})
    }


def ozon_update_price(body: Dict[str, Any]) -> Dict[str, Any]:
    """Изменение цены товара на Ozon"""
    marketplace_id = body.get('marketplaceId')
    offer_id = body.get('offerId')
    price = body.get('price')
    old_price = body.get('oldPrice')
    
    if not marketplace_id or not offer_id or not price:
        return error_response('marketplaceId, offerId and price required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT umi.api_key, umi.store_id
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations umi
        WHERE umi.marketplace_id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    integration = cur.fetchone()
    
    if not integration:
        cur.close()
        conn.close()
        return error_response('Marketplace not connected', 404)
    
    client_id = integration['store_id']
    api_key = integration['api_key']
    
    prices_data = {
        'prices': [{
            'offer_id': offer_id,
            'price': str(price),
            'old_price': str(old_price) if old_price else '0',
            'currency_code': 'RUB'
        }]
    }
    
    try:
        result = call_ozon_api('/v1/product/import/prices', 'POST', prices_data, client_id, api_key)
        
        cur.close()
        conn.close()
        
        return success_response({
            'message': 'Price updated on Ozon',
            'result': result
        })
    except Exception as e:
        cur.close()
        conn.close()
        return error_response(str(e), 500)


def ozon_update_stock(body: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление остатков товара на Ozon"""
    marketplace_id = body.get('marketplaceId')
    offer_id = body.get('offerId')
    stock = body.get('stock')
    warehouse_id = body.get('warehouseId')
    
    if not marketplace_id or not offer_id or stock is None:
        return error_response('marketplaceId, offerId and stock required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT umi.api_key, umi.store_id
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations umi
        WHERE umi.marketplace_id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    integration = cur.fetchone()
    
    if not integration:
        cur.close()
        conn.close()
        return error_response('Marketplace not connected', 404)
    
    client_id = integration['store_id']
    api_key = integration['api_key']
    
    stocks_data = {
        'stocks': [{
            'offer_id': offer_id,
            'stock': int(stock)
        }]
    }
    
    if warehouse_id:
        stocks_data['stocks'][0]['warehouse_id'] = int(warehouse_id)
    
    try:
        result = call_ozon_api('/v2/products/stocks', 'POST', stocks_data, client_id, api_key)
        
        cur.close()
        conn.close()
        
        return success_response({
            'message': 'Stock updated on Ozon',
            'result': result
        })
    except Exception as e:
        cur.close()
        conn.close()
        return error_response(str(e), 500)


def ozon_get_finance_data(marketplace_id: Optional[str] = None) -> Dict[str, Any]:
    """Получение финансовых данных с Ozon (комиссии, выплаты)"""
    if not marketplace_id:
        return error_response('Marketplace ID required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT umi.api_key, umi.store_id
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations umi
        WHERE umi.marketplace_id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    integration = cur.fetchone()
    
    if not integration:
        cur.close()
        conn.close()
        return error_response('Marketplace not connected', 404)
    
    client_id = integration['store_id']
    api_key = integration['api_key']
    
    date_from = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    date_to = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.000Z')
    
    try:
        finance_data = call_ozon_api('/v3/finance/transaction/list', 'POST', {
            'filter': {
                'date': {
                    'from': date_from,
                    'to': date_to
                },
                'transaction_type': 'all'
            },
            'page': 1,
            'page_size': 100
        }, client_id, api_key)
        
        cur.close()
        conn.close()
        
        return success_response({
            'transactions': finance_data.get('result', {}).get('operations', []),
            'period': {'from': date_from, 'to': date_to}
        })
    except Exception as e:
        cur.close()
        conn.close()
        return error_response(str(e), 500)


def ozon_pack_order(body: Dict[str, Any]) -> Dict[str, Any]:
    """Упаковка заказа на Ozon"""
    marketplace_id = body.get('marketplaceId')
    posting_number = body.get('postingNumber')
    
    if not marketplace_id or not posting_number:
        return error_response('marketplaceId and postingNumber required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT umi.api_key, umi.store_id
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations umi
        WHERE umi.marketplace_id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    integration = cur.fetchone()
    
    if not integration:
        cur.close()
        conn.close()
        return error_response('Marketplace not connected', 404)
    
    client_id = integration['store_id']
    api_key = integration['api_key']
    
    try:
        result = call_ozon_api('/v2/posting/fbs/ship', 'POST', {
            'posting_number': posting_number
        }, client_id, api_key)
        
        posting_number_escaped = posting_number.replace("'", "''")
        cur.execute(f"""
            UPDATE t_p86529894_ecommerce_management.orders
            SET status = 'processing', updated_at = CURRENT_TIMESTAMP
            WHERE order_number = '{posting_number_escaped}'
        """)
        
        cur.close()
        conn.close()
        
        return success_response({
            'message': 'Order packed successfully',
            'result': result
        })
    except Exception as e:
        cur.close()
        conn.close()
        return error_response(str(e), 500)


def ozon_ship_order(body: Dict[str, Any]) -> Dict[str, Any]:
    """Отгрузка заказа на Ozon"""
    marketplace_id = body.get('marketplaceId')
    posting_number = body.get('postingNumber')
    
    if not marketplace_id or not posting_number:
        return error_response('marketplaceId and postingNumber required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT umi.api_key, umi.store_id
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations umi
        WHERE umi.marketplace_id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    integration = cur.fetchone()
    
    if not integration:
        cur.close()
        conn.close()
        return error_response('Marketplace not connected', 404)
    
    client_id = integration['store_id']
    api_key = integration['api_key']
    
    try:
        result = call_ozon_api('/v3/posting/fbs/act/create', 'POST', {
            'containers': [{
                'posting_number': [posting_number]
            }]
        }, client_id, api_key)
        
        posting_number_escaped = posting_number.replace("'", "''")
        cur.execute(f"""
            UPDATE t_p86529894_ecommerce_management.orders
            SET status = 'shipped', shipped_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE order_number = '{posting_number_escaped}'
        """)
        
        cur.close()
        conn.close()
        
        return success_response({
            'message': 'Order shipped successfully',
            'result': result
        })
    except Exception as e:
        cur.close()
        conn.close()
        return error_response(str(e), 500)


def ozon_get_returns(marketplace_id: Optional[str] = None) -> Dict[str, Any]:
    """Получение списка возвратов с Ozon"""
    if not marketplace_id:
        return error_response('Marketplace ID required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT umi.api_key, umi.store_id
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations umi
        WHERE umi.marketplace_id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    integration = cur.fetchone()
    
    if not integration:
        cur.close()
        conn.close()
        return error_response('Marketplace not connected', 404)
    
    client_id = integration['store_id']
    api_key = integration['api_key']
    
    try:
        returns_data = call_ozon_api('/v3/returns/company/fbs', 'POST', {
            'filter': {
                'status': 'All'
            },
            'limit': 100,
            'offset': 0
        }, client_id, api_key)
        
        cur.close()
        conn.close()
        
        return success_response({
            'returns': returns_data.get('result', [])
        })
    except Exception as e:
        cur.close()
        conn.close()
        return error_response(str(e), 500)


def ozon_accept_return(body: Dict[str, Any]) -> Dict[str, Any]:
    """Принятие возврата на Ozon"""
    marketplace_id = body.get('marketplaceId')
    return_id = body.get('returnId')
    
    if not marketplace_id or not return_id:
        return error_response('marketplaceId and returnId required', 400)
    
    try:
        mp_id = int(marketplace_id)
    except ValueError:
        return error_response('Invalid marketplace ID', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT umi.api_key, umi.store_id
        FROM t_p86529894_ecommerce_management.user_marketplace_integrations umi
        WHERE umi.marketplace_id = {mp_id} AND umi.user_id = 1
        LIMIT 1
    """)
    
    integration = cur.fetchone()
    
    if not integration:
        cur.close()
        conn.close()
        return error_response('Marketplace not connected', 404)
    
    client_id = integration['store_id']
    api_key = integration['api_key']
    
    try:
        result = call_ozon_api('/v2/returns/company/fbs/accept', 'POST', {
            'return_id': int(return_id)
        }, client_id, api_key)
        
        cur.close()
        conn.close()
        
        return success_response({
            'message': 'Return accepted',
            'result': result
        })
    except Exception as e:
        cur.close()
        conn.close()
        return error_response(str(e), 500)