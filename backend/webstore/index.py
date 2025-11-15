import json
import os
from typing import Dict, Any, List
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для собственного интернет-магазина - создание, настройка, управление
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id, function_name
    Returns: HTTP response dict with store settings, products, orders
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Store-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters', {})
    action = query_params.get('action', 'getSettings')
    
    if method == 'GET' and action == 'getSettings':
        return get_store_settings()
    
    elif method == 'POST' and action == 'createStore':
        body_data = json.loads(event.get('body', '{}'))
        return create_store(body_data)
    
    elif method == 'PUT' and action == 'updateSettings':
        body_data = json.loads(event.get('body', '{}'))
        return update_store_settings(body_data)
    
    elif method == 'GET' and action == 'getThemes':
        return get_available_themes()
    
    elif method == 'POST' and action == 'publishStore':
        body_data = json.loads(event.get('body', '{}'))
        return publish_store(body_data)
    
    elif method == 'GET' and action == 'getAnalytics':
        return get_store_analytics()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Invalid action'})
    }


def get_store_settings() -> Dict[str, Any]:
    """Получение настроек магазина"""
    
    settings = {
        'storeId': 'store_12345',
        'storeName': 'Мой интернет-магазин',
        'domain': 'mystore.sellhub.app',
        'customDomain': '',
        'status': 'published',
        'theme': 'modern',
        'logo': '',
        'colors': {
            'primary': '#8b5cf6',
            'secondary': '#3b82f6',
            'accent': '#06b6d4'
        },
        'contact': {
            'email': 'info@mystore.com',
            'phone': '+7 (999) 123-45-67',
            'address': 'Москва, ул. Примерная, д. 1'
        },
        'payment': {
            'methods': ['card', 'sbp', 'yookassa'],
            'currency': 'RUB'
        },
        'delivery': {
            'methods': ['courier', 'pickup', 'cdek'],
            'freeFrom': 3000
        },
        'seo': {
            'title': 'Мой интернет-магазин',
            'description': 'Лучшие товары по выгодным ценам',
            'keywords': 'магазин, товары, покупки'
        },
        'analytics': {
            'googleAnalytics': '',
            'yandexMetrika': ''
        },
        'createdAt': '2025-01-15T10:00:00Z',
        'updatedAt': '2025-11-15T12:30:00Z'
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps(settings)
    }


def create_store(data: Dict[str, Any]) -> Dict[str, Any]:
    """Создание нового интернет-магазина"""
    
    store_name = data.get('storeName', 'Новый магазин')
    theme = data.get('theme', 'modern')
    
    new_store = {
        'storeId': f'store_{datetime.now().timestamp()}',
        'storeName': store_name,
        'domain': f'{store_name.lower().replace(" ", "-")}.sellhub.app',
        'status': 'draft',
        'theme': theme,
        'createdAt': datetime.now().isoformat()
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'store': new_store,
            'message': 'Магазин создан успешно'
        })
    }


def update_store_settings(data: Dict[str, Any]) -> Dict[str, Any]:
    """Обновление настроек магазина"""
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'message': 'Настройки обновлены',
            'updatedAt': datetime.now().isoformat()
        })
    }


def get_available_themes() -> Dict[str, Any]:
    """Получение доступных тем оформления"""
    
    themes = [
        {
            'id': 'modern',
            'name': 'Современный',
            'description': 'Минималистичный дизайн с акцентом на товары',
            'preview': '/themes/modern-preview.jpg',
            'features': ['Адаптивный дизайн', 'Быстрая загрузка', 'SEO оптимизация']
        },
        {
            'id': 'classic',
            'name': 'Классический',
            'description': 'Традиционный магазин с удобной навигацией',
            'preview': '/themes/classic-preview.jpg',
            'features': ['Привычный интерфейс', 'Широкие возможности']
        },
        {
            'id': 'minimal',
            'name': 'Минимал',
            'description': 'Лаконичный дизайн для премиум товаров',
            'preview': '/themes/minimal-preview.jpg',
            'features': ['Элегантность', 'Фокус на продукте']
        },
        {
            'id': 'vibrant',
            'name': 'Яркий',
            'description': 'Динамичный дизайн с яркими акцентами',
            'preview': '/themes/vibrant-preview.jpg',
            'features': ['Выразительность', 'Привлечение внимания']
        }
    ]
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'themes': themes})
    }


def publish_store(data: Dict[str, Any]) -> Dict[str, Any]:
    """Публикация магазина"""
    
    store_id = data.get('storeId')
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'storeId': store_id,
            'status': 'published',
            'url': 'https://mystore.sellhub.app',
            'message': 'Магазин опубликован',
            'publishedAt': datetime.now().isoformat()
        })
    }


def get_store_analytics() -> Dict[str, Any]:
    """Получение аналитики магазина"""
    
    analytics = {
        'visitors': {
            'today': 342,
            'week': 2145,
            'month': 8934
        },
        'orders': {
            'today': 23,
            'week': 156,
            'month': 623
        },
        'revenue': {
            'today': 45670,
            'week': 312450,
            'month': 1245890
        },
        'conversion': {
            'rate': 6.7,
            'trend': 'up'
        },
        'topProducts': [
            {'name': 'Товар 1', 'sales': 145},
            {'name': 'Товар 2', 'sales': 123},
            {'name': 'Товар 3', 'sales': 98}
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps(analytics)
    }
