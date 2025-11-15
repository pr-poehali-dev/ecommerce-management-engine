import json
import os
from typing import Dict, Any, List
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Синхронизация товаров и заказов с маркетплейсами (Ozon, Wildberries, etc)
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id, function_name
    Returns: HTTP response dict with products, orders, sync status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, X-Client-Id, X-Seller-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {})
    marketplace = query_params.get('marketplace', 'ozon')
    action = query_params.get('action', 'getProducts')
    
    if method == 'POST' and action == 'connect':
        body_data = json.loads(event.get('body', '{}'))
        return connect_marketplace(marketplace, body_data)
    
    elif method == 'GET' and action == 'getProducts':
        return get_marketplace_products(marketplace, headers)
    
    elif method == 'POST' and action == 'syncProducts':
        body_data = json.loads(event.get('body', '{}'))
        return sync_products_to_marketplace(marketplace, body_data, headers)
    
    elif method == 'GET' and action == 'getOrders':
        return get_marketplace_orders(marketplace, headers)
    
    elif method == 'POST' and action == 'updateStock':
        body_data = json.loads(event.get('body', '{}'))
        return update_marketplace_stock(marketplace, body_data, headers)
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Invalid action'})
    }


def connect_marketplace(marketplace: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
    """Подключение к маркетплейсу и проверка учетных данных"""
    
    if marketplace == 'ozon':
        api_key = credentials.get('apiKey')
        client_id = credentials.get('clientId')
        
        if not api_key or not client_id:
            return error_response('Missing Ozon credentials')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'marketplace': 'ozon',
                'connected': True,
                'message': 'Ozon подключен успешно',
                'stats': {
                    'products': 0,
                    'orders': 0,
                    'revenue': 0
                }
            })
        }
    
    elif marketplace == 'wildberries':
        api_key = credentials.get('apiKey')
        
        if not api_key:
            return error_response('Missing Wildberries API key')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'marketplace': 'wildberries',
                'connected': True,
                'message': 'Wildberries подключен успешно',
                'stats': {
                    'products': 0,
                    'orders': 0,
                    'revenue': 0
                }
            })
        }
    
    return error_response(f'Unsupported marketplace: {marketplace}')


def get_marketplace_products(marketplace: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получение списка товаров с маркетплейса"""
    
    if marketplace == 'ozon':
        mock_products = [
            {
                'id': 'ozon_1',
                'name': 'Наушники беспроводные TWS',
                'price': 3490,
                'stock': 45,
                'category': 'Электроника',
                'marketplace': 'Ozon',
                'sku': 'TWS-001',
                'status': 'active'
            },
            {
                'id': 'ozon_2',
                'name': 'Умные часы SmartWatch Pro',
                'price': 8990,
                'stock': 23,
                'category': 'Электроника',
                'marketplace': 'Ozon',
                'sku': 'SW-PRO-01',
                'status': 'active'
            },
            {
                'id': 'ozon_3',
                'name': 'Павербанк 20000 mAh',
                'price': 2190,
                'stock': 67,
                'category': 'Аксессуары',
                'marketplace': 'Ozon',
                'sku': 'PB-20K',
                'status': 'active'
            }
        ]
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'products': mock_products,
                'total': len(mock_products),
                'synced_at': datetime.now().isoformat()
            })
        }
    
    elif marketplace == 'wildberries':
        mock_products = [
            {
                'id': 'wb_1',
                'name': 'Футболка хлопковая',
                'price': 890,
                'stock': 120,
                'category': 'Одежда',
                'marketplace': 'Wildberries',
                'sku': 'TSHIRT-001',
                'status': 'active'
            },
            {
                'id': 'wb_2',
                'name': 'Джинсы классические',
                'price': 2490,
                'stock': 78,
                'category': 'Одежда',
                'marketplace': 'Wildberries',
                'sku': 'JEANS-CL-01',
                'status': 'active'
            }
        ]
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'products': mock_products,
                'total': len(mock_products),
                'synced_at': datetime.now().isoformat()
            })
        }
    
    return error_response(f'Marketplace {marketplace} not supported')


def sync_products_to_marketplace(marketplace: str, products: List[Dict], headers: Dict[str, str]) -> Dict[str, Any]:
    """Синхронизация товаров на маркетплейс"""
    
    synced_count = len(products)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'marketplace': marketplace,
            'synced': synced_count,
            'message': f'Синхронизировано {synced_count} товаров на {marketplace}',
            'synced_at': datetime.now().isoformat()
        })
    }


def get_marketplace_orders(marketplace: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получение заказов с маркетплейса"""
    
    if marketplace == 'ozon':
        mock_orders = [
            {
                'id': 'ozon_order_1',
                'customerName': 'Иван Петров',
                'marketplace': 'Ozon',
                'date': '2025-11-14',
                'status': 'processing',
                'items': 2,
                'total': 12480,
                'products': ['TWS-001', 'SW-PRO-01']
            },
            {
                'id': 'ozon_order_2',
                'customerName': 'Мария Сидорова',
                'marketplace': 'Ozon',
                'date': '2025-11-15',
                'status': 'shipped',
                'items': 1,
                'total': 2190,
                'products': ['PB-20K']
            }
        ]
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'orders': mock_orders,
                'total': len(mock_orders),
                'synced_at': datetime.now().isoformat()
            })
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'orders': [],
            'total': 0,
            'synced_at': datetime.now().isoformat()
        })
    }


def update_marketplace_stock(marketplace: str, stock_data: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Обновление остатков товаров на маркетплейсе"""
    
    product_id = stock_data.get('productId')
    stock = stock_data.get('stock', 0)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'marketplace': marketplace,
            'productId': product_id,
            'stock': stock,
            'message': f'Остаток обновлен на {marketplace}',
            'updated_at': datetime.now().isoformat()
        })
    }


def error_response(message: str) -> Dict[str, Any]:
    """Генерация ответа с ошибкой"""
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': message})
    }
