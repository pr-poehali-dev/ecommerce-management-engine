import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

# Все таблицы используются БЕЗ префикса схемы, т.к. search_path установлен в DATABASE_URL

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


def get_marketplaces() -> Dict[str, Any]:
    """Получение списка всех маркетплейсов и их статуса"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Используем таблицы БЕЗ схемы - search_path должен быть установлен в DATABASE_URL
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
            0 as products_count,
            0 as orders_count,
            0 as total_revenue,
            umi.last_sync as last_sync_at
        FROM marketplaces m
        LEFT JOIN user_marketplace_integrations umi 
            ON m.id = umi.marketplace_id AND umi.user_id = 1
        ORDER BY m.name
    """)
    
    marketplaces = [dict(m) for m in cur.fetchall()]
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
    
    cur.execute("""
        SELECT id FROM marketplaces
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
        SELECT id FROM user_marketplace_integrations
        WHERE user_id = %s AND marketplace_id = %s
    """, (user_id, marketplace_id))
    
    existing = cur.fetchone()
    
    if existing:
        cur.execute("""
            UPDATE user_marketplace_integrations
            SET api_key = %s, api_secret = %s, store_id = %s, status = 'active', last_sync = %s
            WHERE user_id = %s AND marketplace_id = %s
            RETURNING id
        """, (api_key, seller_id, client_id, datetime.now(), user_id, marketplace_id))
    else:
        cur.execute("""
            INSERT INTO user_marketplace_integrations 
            (user_id, marketplace_id, api_key, api_secret, store_id, status, last_sync)
            VALUES (%s, %s, %s, %s, %s, 'active', %s)
            RETURNING id
        """, (user_id, marketplace_id, api_key, seller_id, client_id, datetime.now()))
    
    integration_id = cur.fetchone()['id']
    
    cur.execute("""
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
        WHERE umi.id = %s
    """, (integration_id,))
    
    marketplace_info = cur.fetchone()
    
    cur.close()
    conn.close()
    
    return success_response({
        'marketplace': dict(marketplace_info),
        'message': f'{name.title()} connected',
        'success': True
    })


def get_products(marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение списка товаров"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if marketplace:
        cur.execute("""
            SELECT 
                p.*,
                mp.marketplace_id,
                mp.price as marketplace_price,
                mp.stock as marketplace_stock,
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
    
    products = [dict(p) for p in cur.fetchall()]
    cur.close()
    conn.close()
    
    return success_response({
        'products': products,
        'total': len(products)
    })


def get_orders(status: Optional[str] = None, marketplace: Optional[str] = None) -> Dict[str, Any]:
    """Получение заказов"""
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
    orders = [dict(o) for o in cur.fetchall()]
    cur.close()
    conn.close()
    
    return success_response({
        'orders': orders,
        'total': len(orders)
    })


def update_order_status(data: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление статуса заказа"""
    order_id = data.get('orderId')
    new_status = data.get('status')
    
    if not order_id or not new_status:
        return error_response('Order ID and status required', 400)
    
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
        'message': 'Status updated'
    })


def get_analytics(period: str = '30d') -> Dict[str, Any]:
    """Получение аналитики"""
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
        LEFT JOIN orders o ON m.id = o.marketplace_id AND o.order_date >= %s
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
    """Получение данных дашборда"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            (SELECT COUNT(*) FROM marketplaces) as total_marketplaces,
            (SELECT COUNT(*) FROM user_marketplace_integrations) as connected_marketplaces,
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT COUNT(*) FROM orders) as total_orders,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as total_revenue
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


def error_response(message: str, code: int = 500) -> Dict[str, Any]:
    """Ответ с ошибкой"""
    return {
        'statusCode': code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': message})
    }