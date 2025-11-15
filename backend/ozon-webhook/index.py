import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Прием вебхуков от Ozon в реальном времени - новые заказы, отмены, обновления
    Args: event - dict with httpMethod, body, headers
          context - object with request_id
    Returns: HTTP response 200 OK для подтверждения получения
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return cors_response()
    
    if method != 'POST':
        return error_response('Only POST allowed', 405)
    
    try:
        body_str = event.get('body', '{}')
        webhook_data = json.loads(body_str)
        
        message_type = webhook_data.get('message_type', '')
        
        if message_type == 'TYPE_NEW_POSTING':
            handle_new_order(webhook_data)
        elif message_type == 'TYPE_POSTING_CANCELLED':
            handle_order_cancelled(webhook_data)
        elif message_type == 'TYPE_POSTING_STATUS_CHANGED':
            handle_order_status_changed(webhook_data)
        else:
            print(f'Unknown webhook type: {message_type}')
        
        return success_response({'status': 'processed'})
        
    except Exception as e:
        import traceback
        print(f'Webhook error: {str(e)}\n{traceback.format_exc()}')
        return success_response({'status': 'error_logged'})


def get_db_connection():
    """Получение подключения к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not set')
    conn = psycopg2.connect(database_url)
    conn.set_session(autocommit=True)
    return conn


def handle_new_order(webhook_data: Dict) -> None:
    """Обработка нового заказа от Ozon"""
    posting = webhook_data.get('posting', {})
    
    order_number = posting.get('posting_number', '')
    order_id_ozon = posting.get('order_id', '')
    order_date = posting.get('created_at', datetime.now().isoformat())
    
    status = 'new'
    fulfillment_type = 'FBS'
    
    if 'in_process_at' in posting:
        status = 'processing'
    
    customer_name = f"Клиент Ozon #{order_id_ozon}"
    customer_email = f"ozon_customer_{order_id_ozon}@marketplace.com"
    
    total_amount = 0
    items_count = 0
    
    for product in posting.get('products', []):
        total_amount += float(product.get('price', 0)) * int(product.get('quantity', 1))
        items_count += int(product.get('quantity', 1))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"SELECT id FROM t_p86529894_ecommerce_management.marketplaces WHERE slug = 'ozon' LIMIT 1")
    marketplace = cur.fetchone()
    
    if not marketplace:
        cur.close()
        conn.close()
        print('Ozon marketplace not found in DB')
        return
    
    marketplace_id = marketplace['id']
    
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
    else:
        customer_id = customer['id']
    
    order_number_escaped = order_number.replace("'", "''")
    
    cur.execute(f"SELECT id FROM t_p86529894_ecommerce_management.orders WHERE order_number = '{order_number_escaped}' LIMIT 1")
    existing_order = cur.fetchone()
    
    if not existing_order:
        cur.execute(f"""
            INSERT INTO t_p86529894_ecommerce_management.orders 
            (order_number, customer_id, marketplace_id, status, fulfillment_type, 
             total_amount, items_count, created_at)
            VALUES ('{order_number_escaped}', {customer_id}, {marketplace_id}, 
                   '{status}', '{fulfillment_type}', {total_amount}, {items_count}, '{order_date}')
            RETURNING id
        """)
        new_order_id = cur.fetchone()['id']
        print(f'✅ New Ozon order created: {order_number} (ID: {new_order_id})')
    else:
        print(f'Order {order_number} already exists')
    
    cur.close()
    conn.close()


def handle_order_cancelled(webhook_data: Dict) -> None:
    """Обработка отмены заказа"""
    posting = webhook_data.get('posting', {})
    order_number = posting.get('posting_number', '')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    order_number_escaped = order_number.replace("'", "''")
    
    cur.execute(f"""
        UPDATE t_p86529894_ecommerce_management.orders
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE order_number = '{order_number_escaped}'
    """)
    
    cur.close()
    conn.close()
    
    print(f'🚫 Order cancelled: {order_number}')


def handle_order_status_changed(webhook_data: Dict) -> None:
    """Обработка изменения статуса заказа"""
    posting = webhook_data.get('posting', {})
    order_number = posting.get('posting_number', '')
    new_status = posting.get('status', '')
    
    status_map = {
        'awaiting_packaging': 'new',
        'awaiting_deliver': 'processing',
        'delivering': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'returned': 'returned'
    }
    
    status = status_map.get(new_status, 'processing')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    order_number_escaped = order_number.replace("'", "''")
    status_escaped = status.replace("'", "''")
    
    cur.execute(f"""
        UPDATE t_p86529894_ecommerce_management.orders
        SET status = '{status_escaped}', updated_at = CURRENT_TIMESTAMP
        WHERE order_number = '{order_number_escaped}'
    """)
    
    cur.close()
    conn.close()
    
    print(f'📦 Order status changed: {order_number} -> {status}')


def cors_response() -> Dict[str, Any]:
    """CORS preflight response"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
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