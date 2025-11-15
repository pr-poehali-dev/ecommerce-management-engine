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
        elif action == 'getProducts':
            marketplace = query_params.get('marketplace')
            return get_products(marketplace)
        elif action == 'syncProducts' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return sync_products(body_data)
        elif action == 'getOrders':
            status = query_params.get('status')
            marketplace = query_params.get('marketplace')
            return get_orders(status, marketplace)
        elif action == 'updateOrderStatus' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return update_order_status(body_data)
        elif action == 'getAnalytics':
            period = query_params.get('period', '30d')
            return get_analytics(period)
        elif action == 'getDashboard':
            return get_dashboard()
        elif action == 'updateStock' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return update_stock(body_data)
        else:
            return error_response('Invalid action', 400)
    except Exception as e:
        return error_response(str(e), 500)


def get_db_connection():
    """Получение подключения к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    conn.set_session(autocommit=True)
    return conn


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
            COUNT(DISTINCT mp.product_id) as products_count,
            COUNT(DISTINCT o.id) as orders_count,
            COALESCE(SUM(o.total_amount), 0) as total_revenue,
            umi.last_sync as last_sync_at
        FROM t_p86529894_ecommerce_management.marketplaces m
        LEFT JOIN t_p86529894_ecommerce_management.user_marketplace_integrations umi ON m.id = umi.marketplace_id
        LEFT JOIN t_p86529894_ecommerce_management.marketplace_products mp ON m.id = mp.marketplace_id
        LEFT JOIN t_p86529894_ecommerce_management.orders o ON m.id = o.marketplace_id
        GROUP BY m.id, m.name, m.slug, m.logo_url, m.country, umi.id, umi.api_key, umi.store_id, umi.last_sync
        ORDER BY m.name
    """)
    
    marketplaces = cur.fetchall()
    cur.close()
    conn.close()
    
    return success_response({
        'marketplaces': [dict(m) for m in marketplaces],
        'total': len(marketplaces)
    })


def connect_marketplace(data: Dict[str, Any]) -> Dict[str, Any]:
    """Подключение нового маркетплейса"""
    name = data.get('name')
    api_key = data.get('apiKey')
    client_id = data.get('clientId')
    seller_id = data.get('sellerId')
    
    if not name:
        return error_response('Marketplace name is required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id FROM t_p86529894_ecommerce_management.marketplaces
        WHERE slug = %s OR LOWER(name) = LOWER(%s)
        LIMIT 1
    """, (name, name))
    
    marketplace_result = cur.fetchone()
    
    if not marketplace_result:
        cur.close()
        conn.close()
        return error_response(f'Marketplace {name} not found', 404)
    
    marketplace_id = marketplace_result['id']
    user_id = 1
    
    cur.execute("""
        SELECT id FROM t_p86529894_ecommerce_management.user_marketplace_integrations
        WHERE user_id = %s AND marketplace_id = %s
    """, (user_id, marketplace_id))
    
    existing = cur.fetchone()
    
    if existing:
        cur.execute("""
            UPDATE t_p86529894_ecommerce_management.user_marketplace_integrations
            SET api_key = %s, api_secret = %s, store_id = %s, status = 'active', last_sync = %s
            WHERE user_id = %s AND marketplace_id = %s
            RETURNING *
        """, (api_key, seller_id, client_id, datetime.now(), user_id, marketplace_id))
    else:
        cur.execute("""
            INSERT INTO t_p86529894_ecommerce_management.user_marketplace_integrations 
            (user_id, marketplace_id, api_key, api_secret, store_id, status, last_sync)
            VALUES (%s, %s, %s, %s, %s, 'active', %s)
            RETURNING *
        """, (user_id, marketplace_id, api_key, seller_id, client_id, datetime.now()))
    
    integration = cur.fetchone()
    cur.close()
    conn.close()
    
    return success_response({
        'marketplace': dict(integration),
        'message': f'{name} подключен успешно'
    })


def get_products(marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение списка товаров с фильтрацией по маркетплейсу"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if marketplace:
        cur.execute("""
            SELECT 
                p.*,
                mp.marketplace_id,
                mp.price as marketplace_price,
                mp.stock as marketplace_stock,
                mp.status as marketplace_status,
                m.name as marketplace_name
            FROM products p
            LEFT JOIN marketplace_products mp ON p.id = mp.product_id
            LEFT JOIN marketplaces m ON mp.marketplace_id = m.id
            WHERE m.name = %s
            ORDER BY p.created_at DESC
        """, (marketplace,))
    else:
        cur.execute("""
            SELECT 
                p.*,
                COUNT(DISTINCT mp.marketplace_id) as marketplaces_count,
                COALESCE(SUM(mp.stock), 0) as total_stock
            FROM products p
            LEFT JOIN marketplace_products mp ON p.id = mp.product_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)
    
    products = cur.fetchall()
    cur.close()
    conn.close()
    
    return success_response({
        'products': [dict(p) for p in products],
        'total': len(products)
    })


def sync_products(data: Dict[str, Any]) -> Dict[str, Any]:
    """Синхронизация товаров с маркетплейсом"""
    marketplace_id = data.get('marketplaceId')
    products = data.get('products', [])
    
    if not marketplace_id:
        return error_response('Marketplace ID is required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    synced_count = 0
    for product_data in products:
        product_id = product_data.get('productId')
        price = product_data.get('price')
        stock = product_data.get('stock')
        
        cur.execute("""
            INSERT INTO marketplace_products
            (product_id, marketplace_id, price, stock, last_sync_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (product_id, marketplace_id) DO UPDATE
            SET price = EXCLUDED.price,
                stock = EXCLUDED.stock,
                last_sync_at = EXCLUDED.last_sync_at,
                updated_at = CURRENT_TIMESTAMP
        """, (product_id, marketplace_id, price, stock, datetime.now()))
        
        synced_count += 1
    
    cur.execute("""
        UPDATE marketplaces
        SET last_sync_at = %s
        WHERE id = %s
    """, (datetime.now(), marketplace_id))
    
    cur.close()
    conn.close()
    
    return success_response({
        'synced': synced_count,
        'message': f'Синхронизировано {synced_count} товаров'
    })


def get_orders(status: Optional[str] = None, marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение заказов с фильтрацией"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT 
            o.*,
            m.name as marketplace_name,
            COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN marketplaces m ON o.marketplace_id = m.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE 1=1
    """
    
    params = []
    if status:
        query += " AND o.status = %s"
        params.append(status)
    if marketplace:
        query += " AND m.name = %s"
        params.append(marketplace)
    
    query += " GROUP BY o.id, m.name ORDER BY o.order_date DESC LIMIT 100"
    
    cur.execute(query, params)
    orders = cur.fetchall()
    cur.close()
    conn.close()
    
    return success_response({
        'orders': [dict(o) for o in orders],
        'total': len(orders)
    })


def update_order_status(data: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление статуса заказа"""
    order_id = data.get('orderId')
    new_status = data.get('status')
    
    if not order_id or not new_status:
        return error_response('Order ID and status are required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        UPDATE orders
        SET status = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
    """, (new_status, order_id))
    
    order = cur.fetchone()
    cur.close()
    conn.close()
    
    if not order:
        return error_response('Order not found', 404)
    
    return success_response({
        'order': dict(order),
        'message': 'Статус заказа обновлен'
    })


def update_stock(data: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление остатков товара"""
    product_id = data.get('productId')
    new_stock = data.get('stock')
    reason = data.get('reason', 'Manual update')
    
    if product_id is None or new_stock is None:
        return error_response('Product ID and stock are required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT stock FROM products
        WHERE id = %s
    """, (product_id,))
    
    result = cur.fetchone()
    if not result:
        cur.close()
        conn.close()
        return error_response('Product not found', 404)
    
    old_stock = result['stock']
    
    cur.execute("""
        UPDATE products
        SET stock = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (new_stock, product_id))
    
    cur.execute("""
        INSERT INTO stock_history
        (product_id, old_stock, new_stock, change_reason, changed_at)
        VALUES (%s, %s, %s, %s, %s)
    """, (product_id, old_stock, new_stock, reason, datetime.now()))
    
    cur.close()
    conn.close()
    
    return success_response({
        'productId': product_id,
        'oldStock': old_stock,
        'newStock': new_stock,
        'message': 'Остаток обновлен'
    })


def get_analytics(period: str = '30d') -> Dict[str, Any]:
    """Получение аналитики за период"""
    days = int(period.replace('d', ''))
    start_date = datetime.now() - timedelta(days=days)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(AVG(total_amount), 0) as avg_order_value,
            COUNT(DISTINCT marketplace_id) as active_marketplaces
        FROM orders
        WHERE order_date >= %s
    """, (start_date,))
    
    stats = cur.fetchone()
    
    cur.execute("""
        SELECT 
            DATE(order_date) as date,
            COUNT(*) as orders,
            COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE order_date >= %s
        GROUP BY DATE(order_date)
        ORDER BY date
    """, (start_date,))
    
    daily_stats = cur.fetchall()
    
    cur.execute("""
        SELECT 
            m.name,
            COUNT(o.id) as orders,
            COALESCE(SUM(o.total_amount), 0) as revenue
        FROM marketplaces m
        LEFT JOIN orders o ON m.id = o.marketplace_id
            AND o.order_date >= %s
        GROUP BY m.name
        ORDER BY revenue DESC
    """, (start_date,))
    
    marketplace_stats = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return success_response({
        'summary': dict(stats),
        'daily': [dict(d) for d in daily_stats],
        'byMarketplace': [dict(m) for m in marketplace_stats],
        'period': period
    })


def get_dashboard() -> Dict[str, Any]:
    """Получение данных для главного дашборда"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            COUNT(DISTINCT m.id) as total_marketplaces,
            COUNT(DISTINCT CASE WHEN m.is_connected THEN m.id END) as connected_marketplaces,
            COUNT(DISTINCT p.id) as total_products,
            COUNT(DISTINCT o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_revenue
        FROM marketplaces m
        LEFT JOIN products p ON 1=1
        LEFT JOIN orders o ON 1=1
    """)
    
    dashboard_stats = cur.fetchone()
    
    cur.execute("""
        SELECT * FROM orders
        ORDER BY order_date DESC
        LIMIT 10
    """)
    
    recent_orders = cur.fetchall()
    
    cur.execute("""
        SELECT 
            p.*,
            COALESCE(SUM(mp.stock), 0) as total_stock
        FROM products p
        LEFT JOIN marketplace_products mp ON p.id = mp.product_id
        GROUP BY p.id
        HAVING COALESCE(SUM(mp.stock), 0) < 10
        ORDER BY total_stock
        LIMIT 10
    """)
    
    low_stock_products = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return success_response({
        'stats': dict(dashboard_stats),
        'recentOrders': [dict(o) for o in recent_orders],
        'lowStockProducts': [dict(p) for p in low_stock_products]
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
        'body': '',
        'isBase64Encoded': False
    }


def success_response(data: Any) -> Dict[str, Any]:
    """Успешный ответ"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(data, default=str)
    }


def error_response(message: str, status_code: int = 400) -> Dict[str, Any]:
    """Ответ с ошибкой"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': message})
    }