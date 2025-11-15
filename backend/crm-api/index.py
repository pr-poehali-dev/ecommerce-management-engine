import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

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
        SELECT m.id, m.name, m.slug, umi.api_key
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
        
        products_synced += 1
    
    customers_synced = 0
    mock_customers = [
        {'name': f'Клиент {i} ({mp["name"]})', 'email': f'customer{i}@{mp["slug"]}.com', 
         'phone': f'+7900000{i:04d}'}
        for i in range(1, 4)
    ]
    
    for cust in mock_customers:
        name_escaped = cust['name'].replace("'", "''")
        email_escaped = cust['email'].replace("'", "''")
        phone_escaped = cust['phone'].replace("'", "''")
        
        cur.execute(f"SELECT id FROM customers WHERE email = '{email_escaped}' LIMIT 1")
        existing = cur.fetchone()
        
        if not existing:
            cur.execute(f"""
                INSERT INTO customers (name, email, phone, status)
                VALUES ('{name_escaped}', '{email_escaped}', '{phone_escaped}', 'active')
                RETURNING id
            """)
            customers_synced += 1
    
    orders_synced = 0
    cur.execute("SELECT id FROM customers ORDER BY id DESC LIMIT 3")
    customer_ids = [c['id'] for c in cur.fetchall()]
    
    cur.execute("SELECT id FROM products ORDER BY id DESC LIMIT 3")
    product_ids = [p['id'] for p in cur.fetchall()]
    
    if customer_ids and product_ids:
        mock_orders = [
            {'order_number': f'ORD-{mp["slug"].upper()}-{1000+i}', 
             'customer_id': customer_ids[i % len(customer_ids)],
             'total_amount': 2500 + i * 300, 'items_count': 2,
             'status': 'new', 'fulfillment_type': 'FBS'}
            for i in range(1, 4)
        ]
        
        for order in mock_orders:
            order_number_escaped = order['order_number'].replace("'", "''")
            fulfillment_escaped = order['fulfillment_type'].replace("'", "''")
            status_escaped = order['status'].replace("'", "''")
            
            cur.execute(f"SELECT id FROM orders WHERE order_number = '{order_number_escaped}' LIMIT 1")
            existing = cur.fetchone()
            
            if not existing:
                cur.execute(f"""
                    INSERT INTO orders (order_number, customer_id, marketplace_id, status, 
                                      fulfillment_type, total_amount, items_count)
                    VALUES ('{order_number_escaped}', {order['customer_id']}, {mp['id']}, 
                           '{status_escaped}', '{fulfillment_escaped}', 
                           {order['total_amount']}, {order['items_count']})
                    RETURNING id
                """)
                order_id = cur.fetchone()['id']
                
                for j in range(order['items_count']):
                    product_id = product_ids[j % len(product_ids)]
                    cur.execute(f"""
                        INSERT INTO order_items (order_id, product_id, quantity, price)
                        VALUES ({order_id}, {product_id}, 1, 1500)
                    """)
                
                orders_synced += 1
    
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