'''
Business: E-commerce platform API for sellers with marketplace integrations, product management, and analytics
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with statusCode, headers, body
'''

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p86529894_ecommerce_management'

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    return conn

def table(name: str) -> str:
    return f'"{SCHEMA}"."{name}"'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    path: str = event.get('queryStringParameters', {}).get('path', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        user_id = 1
        
        if path == 'auth/login' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            email = body_data.get('email')
            
            cursor.execute(f'SELECT id, email, full_name, company_name, subscription_plan FROM "{SCHEMA}"."users" WHERE email = %s', (email,))
            user = cursor.fetchone()
            
            if user:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'fullName': user['full_name'],
                            'companyName': user['company_name'],
                            'plan': user['subscription_plan']
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'}),
                'isBase64Encoded': False
            }
        
        elif path == 'products' and method == 'GET':
            category = event.get('queryStringParameters', {}).get('category', '')
            
            query = f'SELECT id, name, description, price, category, stock, image_url FROM "{SCHEMA}"."products" WHERE 1=1'
            params = []
            
            if category and category != 'all':
                query += ' AND category = %s'
                params.append(category)
            
            query += ' ORDER BY created_at DESC'
            
            cursor.execute(query, params)
            products = cursor.fetchall()
            
            result = []
            for p in products:
                result.append({
                    'id': p['id'],
                    'name': p['name'],
                    'description': p['description'],
                    'price': float(p['price']),
                    'category': p['category'],
                    'stock': p['stock'],
                    'image': p['image_url']
                })
            
            cursor.execute(f'SELECT DISTINCT category FROM "{SCHEMA}"."products" WHERE category IS NOT NULL ORDER BY category')
            categories = [row['category'] for row in cursor.fetchall()]
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'products': result, 'categories': categories}),
                'isBase64Encoded': False
            }
        
        elif path == 'products' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            cursor.execute(f'''
                INSERT INTO "{SCHEMA}"."products" (name, description, price, category, stock, image_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, name, description, price, category, stock, image_url
            ''', (
                body_data.get('name'),
                body_data.get('description', ''),
                body_data.get('price'),
                body_data.get('category'),
                body_data.get('stock', 0),
                body_data.get('image', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400')
            ))
            
            product = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'product': {
                        'id': product['id'],
                        'name': product['name'],
                        'description': product['description'],
                        'price': float(product['price']),
                        'category': product['category'],
                        'stock': product['stock'],
                        'image': product['image_url']
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif path == 'products' and method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            product_id = body_data.get('id')
            
            cursor.execute(f'''
                UPDATE "{SCHEMA}"."products" 
                SET name = %s, description = %s, price = %s, category = %s, stock = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, name, description, price, category, stock, image_url
            ''', (
                body_data.get('name'),
                body_data.get('description'),
                body_data.get('price'),
                body_data.get('category'),
                body_data.get('stock'),
                product_id
            ))
            
            product = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'product': {
                        'id': product['id'],
                        'name': product['name'],
                        'description': product['description'],
                        'price': float(product['price']),
                        'category': product['category'],
                        'stock': product['stock'],
                        'image': product['image_url']
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif path == 'products' and method == 'DELETE':
            product_id = event.get('queryStringParameters', {}).get('id')
            
            cursor.execute(f'UPDATE "{SCHEMA}"."products" SET status = %s WHERE id = %s', ('deleted', product_id))
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif path == 'orders' and method == 'GET':
            status_filter = event.get('queryStringParameters', {}).get('status', '')
            
            query_parts = [f'SELECT o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.items_count, o.created_at FROM "{SCHEMA}"."orders" o WHERE 1=1']
            params = []
            
            if status_filter and status_filter != 'all':
                query_parts.append(' AND o.status = %s')
                params.append(status_filter)
            
            query_parts.append(' ORDER BY o.created_at DESC')
            query = ''.join(query_parts)
            
            cursor.execute(query, tuple(params))
            orders_data = cursor.fetchall()
            
            cursor.execute(f'SELECT id, name, email FROM "{SCHEMA}"."customers"')
            customers_map = {c['id']: c for c in cursor.fetchall()}
            
            orders = []
            for o in orders_data:
                customer = customers_map.get(o['customer_id'], {})
                orders.append({
                    'id': o['order_number'],
                    'customerId': o['customer_id'],
                    'customerName': customer.get('name', ''),
                    'customerEmail': customer.get('email', ''),
                    'status': o['status'],
                    'total': float(o['total_amount']),
                    'items': o['items_count'],
                    'marketplace': '',
                    'date': o['created_at'].strftime('%d.%m.%Y') if o['created_at'] else ''
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'orders': orders}),
                'isBase64Encoded': False
            }
        
        elif path == 'customers' and method == 'GET':
            cursor.execute(f'''
                SELECT id, name, email, phone, avatar_url, total_spent, 
                       total_orders, status, created_at
                FROM "{SCHEMA}"."customers"
                ORDER BY total_spent DESC
            ''')
            customers = cursor.fetchall()
            
            result = []
            for c in customers:
                result.append({
                    'id': c['id'],
                    'name': c['name'],
                    'email': c['email'],
                    'phone': c['phone'],
                    'avatar': c['avatar_url'],
                    'totalSpent': float(c['total_spent']) if c['total_spent'] else 0,
                    'totalOrders': c['total_orders'],
                    'status': c['status'],
                    'joinedDate': c['created_at'].strftime('%d.%m.%Y') if c['created_at'] else ''
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'customers': result}),
                'isBase64Encoded': False
            }
        
        elif path == 'marketplaces' and method == 'GET':
            cursor.execute(f'SELECT id, name, slug, logo_url, country, api_available, status FROM "{SCHEMA}"."marketplaces" WHERE status = %s ORDER BY name', ('active',))
            marketplaces = cursor.fetchall()
            
            cursor.execute(f'SELECT marketplace_id, api_key, seller_id, store_url, is_active FROM "{SCHEMA}"."user_marketplace_integrations" WHERE user_id = %s', (user_id,))
            integrations_map = {i['marketplace_id']: i for i in cursor.fetchall()}
            
            result = []
            for m in marketplaces:
                integration = integrations_map.get(m['id'])
                result.append({
                    'id': m['id'],
                    'name': m['name'],
                    'slug': m['slug'],
                    'logo': m['logo_url'],
                    'country': m['country'],
                    'apiAvailable': m['api_available'],
                    'connected': integration is not None and integration.get('is_active', False),
                    'apiKey': integration.get('api_key', '') if integration else '',
                    'sellerId': integration.get('seller_id', '') if integration else '',
                    'storeUrl': integration.get('store_url', '') if integration else ''
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'marketplaces': result}),
                'isBase64Encoded': False
            }
        
        elif path == 'marketplaces/connect' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            marketplace_id = body_data.get('marketplaceId')
            api_key = body_data.get('apiKey', '')
            api_secret = body_data.get('apiSecret', '')
            seller_id = body_data.get('sellerId', '')
            store_url = body_data.get('storeUrl', '')
            
            cursor.execute(f'''
                SELECT id FROM "{SCHEMA}"."user_marketplace_integrations" 
                WHERE user_id = %s AND marketplace_id = %s
            ''', (user_id, marketplace_id))
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute(f'''
                    UPDATE "{SCHEMA}"."user_marketplace_integrations"
                    SET api_key = %s, api_secret = %s, seller_id = %s, store_url = %s, 
                        is_active = true, connected_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND marketplace_id = %s
                ''', (api_key, api_secret, seller_id, store_url, user_id, marketplace_id))
            else:
                cursor.execute(f'''
                    INSERT INTO "{SCHEMA}"."user_marketplace_integrations" 
                    (user_id, marketplace_id, api_key, api_secret, seller_id, store_url, is_active, connected_at)
                    VALUES (%s, %s, %s, %s, %s, %s, true, CURRENT_TIMESTAMP)
                ''', (user_id, marketplace_id, api_key, api_secret, seller_id, store_url))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Marketplace connected successfully'}),
                'isBase64Encoded': False
            }
        
        elif path == 'marketplaces/disconnect' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            marketplace_id = body_data.get('marketplaceId')
            
            cursor.execute(f'''
                UPDATE "{SCHEMA}"."user_marketplace_integrations"
                SET is_active = false
                WHERE user_id = %s AND marketplace_id = %s
            ''', (user_id, marketplace_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Marketplace disconnected successfully'}),
                'isBase64Encoded': False
            }
        
        elif path == 'analytics' and method == 'GET':
            cursor.execute(f'SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(*) as total_orders FROM "{SCHEMA}"."orders"')
            stats = cursor.fetchone()
            
            cursor.execute(f'SELECT COUNT(*) as count FROM "{SCHEMA}"."products" WHERE status != %s', ('deleted',))
            products_count = cursor.fetchone()['count']
            
            cursor.execute(f'SELECT COUNT(*) as count FROM "{SCHEMA}"."customers"')
            customers_count = cursor.fetchone()['count']
            
            cursor.execute(f'''
                SELECT date, revenue, orders_count, new_customers
                FROM "{SCHEMA}"."sales_analytics"
                ORDER BY date DESC
                LIMIT 7
            ''')
            analytics_data = cursor.fetchall()
            
            chart_data = []
            for row in reversed(list(analytics_data)):
                chart_data.append({
                    'date': row['date'].strftime('%d.%m'),
                    'revenue': float(row['revenue']),
                    'orders': row['orders_count'],
                    'customers': row['new_customers']
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'stats': {
                        'revenue': float(stats['total_revenue']) if stats['total_revenue'] else 0,
                        'orders': stats['total_orders'],
                        'products': products_count,
                        'customers': customers_count
                    },
                    'chartData': chart_data
                }),
                'isBase64Encoded': False
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Endpoint not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        import traceback
        error_details = {
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(error_details),
            'isBase64Encoded': False
        }