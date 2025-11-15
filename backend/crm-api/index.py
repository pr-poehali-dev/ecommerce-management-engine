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
        elif action == 'disconnectMarketplace' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return disconnect_marketplace(body_data)
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
            umi.last_sync as last_sync_at
        FROM marketplaces m
        LEFT JOIN user_marketplace_integrations umi 
            ON m.id = umi.marketplace_id AND umi.user_id = 1
        ORDER BY m.name
    """)
    
    marketplaces = [dict(m) for m in cur.fetchall()]
    
    # Устанавливаем значения по умолчанию (подсчеты не работают с goauth-proxy)
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
    
    if status:
        status_escaped = status.replace("'", "''")
        query += f" AND o.status = '{status_escaped}'"
    if marketplace:
        marketplace_escaped = marketplace.replace("'", "''")
        query += f" AND (m.slug = '{marketplace_escaped}' OR LOWER(m.name) = LOWER('{marketplace_escaped}'))"
    
    query += " GROUP BY o.id, m.name ORDER BY o.order_date DESC LIMIT 100"
    
    cur.execute(query)
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
    
    new_status_escaped = new_status.replace("'", "''")
    cur.execute(f"""
        UPDATE orders
        SET status = '{new_status_escaped}', updated_at = CURRENT_TIMESTAMP
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
        'message': 'Status updated'
    })


def get_analytics(period: str = '30d') -> Dict[str, Any]:
    """Получение аналитики"""
    days = int(period.replace('d', ''))
    start_date = datetime.now() - timedelta(days=days)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Упрощенная версия без агрегации (goauth-proxy limitation)
    cur.execute("SELECT * FROM orders")
    all_orders = cur.fetchall()
    
    filtered_orders = [o for o in all_orders if o.get('order_date') and o['order_date'] >= start_date]
    
    total_orders = len(filtered_orders)
    total_revenue = sum(float(o['total_amount']) for o in filtered_orders) if filtered_orders else 0.0
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
    active_marketplaces = len(set(o['marketplace_id'] for o in filtered_orders)) if filtered_orders else 0
    
    stats = {
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'avg_order_value': avg_order_value,
        'active_marketplaces': active_marketplaces
    }
    
    # Группировка по дням в Python
    from collections import defaultdict
    daily_dict = defaultdict(lambda: {'orders': 0, 'revenue': 0.0})
    for o in filtered_orders:
        date_key = o['order_date'].date() if hasattr(o['order_date'], 'date') else o['order_date']
        daily_dict[date_key]['orders'] += 1
        daily_dict[date_key]['revenue'] += float(o['total_amount'])
    
    daily_stats = [{'date': str(date), 'orders': data['orders'], 'revenue': data['revenue']} 
                   for date, data in sorted(daily_dict.items())]
    
    # Получаем все маркетплейсы
    cur.execute("SELECT * FROM marketplaces")
    all_marketplaces = cur.fetchall()
    
    # Группировка по маркетплейсам
    mp_dict = {mp['id']: {'name': mp['name'], 'orders': 0, 'revenue': 0.0} for mp in all_marketplaces}
    for o in filtered_orders:
        mp_id = o['marketplace_id']
        if mp_id in mp_dict:
            mp_dict[mp_id]['orders'] += 1
            mp_dict[mp_id]['revenue'] += float(o['total_amount'])
    
    marketplace_stats = [data for data in mp_dict.values() if data['orders'] > 0]
    marketplace_stats.sort(key=lambda x: x['revenue'], reverse=True)
    
    cur.close()
    conn.close()
    
    return success_response({
        'summary': stats,
        'daily': daily_stats,
        'byMarketplace': marketplace_stats,
        'period': period
    })


def get_dashboard() -> Dict[str, Any]:
    """Получение данных дашборда"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Получаем статистику отдельными запросами  
    cur.execute("SELECT * FROM marketplaces")
    total_marketplaces = len(cur.fetchall())
    
    cur.execute("SELECT * FROM user_marketplace_integrations")
    connected_marketplaces = len(cur.fetchall())
    
    cur.execute("SELECT * FROM products")
    total_products = len(cur.fetchall())
    
    cur.execute("SELECT * FROM orders")
    all_orders = cur.fetchall()
    total_orders = len(all_orders)
    total_revenue = sum(float(o['total_amount']) for o in all_orders) if all_orders else 0.0
    
    dashboard_stats = {
        'total_marketplaces': total_marketplaces,
        'connected_marketplaces': connected_marketplaces,
        'total_products': total_products,
        'total_orders': total_orders,
        'total_revenue': total_revenue
    }
    
    cur.execute("SELECT * FROM orders")
    all_orders_data = cur.fetchall()
    recent_orders = sorted(all_orders_data, key=lambda x: x.get('order_date', ''), reverse=True)[:10]
    
    cur.execute("SELECT * FROM products")
    all_products = cur.fetchall()
    
    cur.execute("SELECT * FROM marketplace_products")
    all_mp_products = cur.fetchall()
    
    # Подсчет остатков в Python
    product_stocks = {}
    for mp in all_mp_products:
        p_id = mp['product_id']
        stock = mp.get('stock', 0)
        product_stocks[p_id] = product_stocks.get(p_id, 0) + stock
    
    low_stock_products = []
    for p in all_products:
        p_dict = dict(p)
        total_stock = product_stocks.get(p['id'], 0)
        p_dict['total_stock'] = total_stock
        if total_stock < 10:
            low_stock_products.append(p_dict)
    
    low_stock_products = sorted(low_stock_products, key=lambda x: x['total_stock'])[:10]
    
    cur.close()
    conn.close()
    
    return success_response({
        'stats': dashboard_stats,
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