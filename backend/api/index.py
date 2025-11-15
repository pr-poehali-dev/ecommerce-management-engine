'''
Business: E-commerce API for products, orders, customers, and analytics management
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with statusCode, headers, body
'''

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    return conn

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
        
        if path == 'products' and method == 'GET':
            cursor.execute('''
                SELECT id, name, description, price, category, stock, image_url, 
                       created_at, updated_at
                FROM products 
                ORDER BY created_at DESC
            ''')
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
                    'image': p['image_url'],
                    'createdAt': p['created_at'].isoformat() if p['created_at'] else None
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'products': result}),
                'isBase64Encoded': False
            }
        
        elif path == 'products' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            cursor.execute('''
                INSERT INTO products (name, description, price, category, stock, image_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, name, description, price, category, stock, image_url, created_at
            ''', (
                body_data.get('name'),
                body_data.get('description', ''),
                body_data.get('price'),
                body_data.get('category'),
                body_data.get('stock', 0),
                body_data.get('image', '/placeholder.svg')
            ))
            
            product = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
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
        
        elif path == 'orders' and method == 'GET':
            cursor.execute('''
                SELECT o.id, o.order_number, o.customer_id, o.status, 
                       o.total_amount, o.items_count, o.shipping_address, o.created_at,
                       c.name as customer_name, c.email as customer_email
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                ORDER BY o.created_at DESC
            ''')
            orders = cursor.fetchall()
            
            result = []
            for order in orders:
                result.append({
                    'id': order['order_number'],
                    'customerId': order['customer_id'],
                    'customerName': order['customer_name'],
                    'customerEmail': order['customer_email'],
                    'status': order['status'],
                    'total': float(order['total_amount']),
                    'items': order['items_count'],
                    'address': order['shipping_address'],
                    'date': order['created_at'].strftime('%d.%m.%Y') if order['created_at'] else ''
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'orders': result}),
                'isBase64Encoded': False
            }
        
        elif path == 'customers' and method == 'GET':
            cursor.execute('''
                SELECT id, name, email, phone, avatar_url, total_spent, 
                       total_orders, status, created_at
                FROM customers
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
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'customers': result}),
                'isBase64Encoded': False
            }
        
        elif path == 'analytics' and method == 'GET':
            cursor.execute('''
                SELECT 
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COUNT(*) as total_orders
                FROM orders
            ''')
            stats = cursor.fetchone()
            
            cursor.execute('SELECT COUNT(*) as count FROM products')
            products_count = cursor.fetchone()['count']
            
            cursor.execute('SELECT COUNT(*) as count FROM customers')
            customers_count = cursor.fetchone()['count']
            
            cursor.execute('''
                SELECT date, revenue, orders_count, new_customers
                FROM sales_analytics
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
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
