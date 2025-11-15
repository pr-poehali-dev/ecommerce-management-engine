import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from collections import defaultdict

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: ML модуль для прогнозирования продаж, возвратов и аномалий
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id, function_name
    Returns: HTTP response dict с ML предсказаниями
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return cors_response()
    
    query_params = event.get('queryStringParameters', {}) or {}
    action = query_params.get('action', '')
    
    try:
        if action == 'salesForecast':
            product_id = query_params.get('productId')
            days = int(query_params.get('days', '7'))
            return sales_forecast(product_id, days)
        
        elif action == 'returnsPrediction':
            product_id = query_params.get('productId')
            return returns_prediction(product_id)
        
        elif action == 'anomalyDetection':
            marketplace_id = query_params.get('marketplaceId')
            return anomaly_detection(marketplace_id)
        
        elif action == 'demandForecast':
            category = query_params.get('category')
            return demand_forecast(category)
        
        elif action == 'getPredictions':
            prediction_type = query_params.get('type')
            return get_predictions(prediction_type)
        
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


def sales_forecast(product_id: str, days: int = 7) -> Dict[str, Any]:
    """Прогноз продаж товара на следующие N дней"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            DATE(o.order_date) as date,
            COUNT(oi.id) as sales_count,
            COALESCE(SUM(oi.quantity), 0) as total_quantity
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.product_id = %s
            AND o.order_date >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(o.order_date)
        ORDER BY date
    """, (product_id,))
    
    historical_data = cur.fetchall()
    
    if not historical_data:
        cur.close()
        conn.close()
        return success_response({
            'productId': product_id,
            'forecast': [],
            'confidence': 0.0,
            'message': 'Недостаточно данных для прогноза'
        })
    
    daily_sales = [row['total_quantity'] for row in historical_data]
    avg_sales = sum(daily_sales) / len(daily_sales) if daily_sales else 0
    
    trend_factor = 1.0
    if len(daily_sales) >= 7:
        recent_avg = sum(daily_sales[-7:]) / 7
        old_avg = sum(daily_sales[:7]) / 7 if len(daily_sales) >= 14 else avg_sales
        if old_avg > 0:
            trend_factor = recent_avg / old_avg
    
    forecast = []
    for i in range(days):
        prediction_date = datetime.now() + timedelta(days=i+1)
        predicted_sales = round(avg_sales * trend_factor * (1 + i * 0.02))
        
        forecast.append({
            'date': prediction_date.strftime('%Y-%m-%d'),
            'predictedSales': max(0, predicted_sales),
            'confidence': min(0.95, 0.7 + (len(daily_sales) / 100))
        })
    
    cur.execute("""
        INSERT INTO ml_predictions
        (prediction_type, product_id, prediction_value, confidence_score, prediction_date)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        'sales_forecast',
        product_id,
        json.dumps(forecast),
        forecast[0]['confidence'] if forecast else 0,
        datetime.now().date()
    ))
    
    cur.close()
    conn.close()
    
    return success_response({
        'productId': product_id,
        'forecast': forecast,
        'avgDailySales': round(avg_sales, 2),
        'trendFactor': round(trend_factor, 2),
        'dataPoints': len(daily_sales)
    })


def returns_prediction(product_id: str) -> Dict[str, Any]:
    """Предсказание вероятности возврата товара"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN o.status = 'returned' THEN 1 END) as returned_orders,
            p.name,
            p.category
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE oi.product_id = %s
        GROUP BY p.name, p.category
    """, (product_id,))
    
    result = cur.fetchone()
    
    if not result or result['total_orders'] == 0:
        cur.close()
        conn.close()
        return success_response({
            'productId': product_id,
            'returnProbability': 0.05,
            'confidence': 0.3,
            'message': 'Недостаточно данных, используется средняя вероятность'
        })
    
    return_rate = result['returned_orders'] / result['total_orders']
    confidence = min(0.95, 0.5 + (result['total_orders'] / 100))
    
    risk_level = 'low'
    if return_rate > 0.15:
        risk_level = 'high'
    elif return_rate > 0.08:
        risk_level = 'medium'
    
    prediction_data = {
        'returnProbability': round(return_rate, 3),
        'confidence': round(confidence, 2),
        'riskLevel': risk_level,
        'totalOrders': result['total_orders'],
        'returnedOrders': result['returned_orders']
    }
    
    cur.execute("""
        INSERT INTO ml_predictions
        (prediction_type, product_id, prediction_value, confidence_score, prediction_date)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        'returns_prediction',
        product_id,
        json.dumps(prediction_data),
        confidence,
        datetime.now().date()
    ))
    
    cur.close()
    conn.close()
    
    return success_response({
        'productId': product_id,
        **prediction_data
    })


def anomaly_detection(marketplace_id: str) -> Dict[str, Any]:
    """Обнаружение аномалий в продажах маркетплейса"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            DATE(order_date) as date,
            COUNT(*) as orders_count,
            COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE marketplace_id = %s
            AND order_date >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(order_date)
        ORDER BY date
    """, (marketplace_id,))
    
    daily_stats = cur.fetchall()
    
    if len(daily_stats) < 7:
        cur.close()
        conn.close()
        return success_response({
            'marketplaceId': marketplace_id,
            'anomalies': [],
            'message': 'Недостаточно данных для анализа'
        })
    
    revenues = [float(row['revenue']) for row in daily_stats]
    avg_revenue = sum(revenues) / len(revenues)
    
    variance = sum((x - avg_revenue) ** 2 for x in revenues) / len(revenues)
    std_dev = variance ** 0.5
    
    anomalies = []
    for row in daily_stats:
        revenue = float(row['revenue'])
        z_score = (revenue - avg_revenue) / std_dev if std_dev > 0 else 0
        
        if abs(z_score) > 2:
            anomalies.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'revenue': revenue,
                'expectedRevenue': round(avg_revenue, 2),
                'deviation': round(z_score, 2),
                'type': 'spike' if z_score > 0 else 'drop',
                'severity': 'high' if abs(z_score) > 3 else 'medium'
            })
    
    prediction_data = {
        'anomaliesCount': len(anomalies),
        'avgRevenue': round(avg_revenue, 2),
        'stdDeviation': round(std_dev, 2)
    }
    
    cur.execute("""
        INSERT INTO ml_predictions
        (prediction_type, marketplace_id, prediction_value, confidence_score, prediction_date)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        'anomaly_detection',
        marketplace_id,
        json.dumps(prediction_data),
        0.85,
        datetime.now().date()
    ))
    
    cur.close()
    conn.close()
    
    return success_response({
        'marketplaceId': marketplace_id,
        'anomalies': anomalies,
        'avgRevenue': round(avg_revenue, 2),
        'stdDeviation': round(std_dev, 2)
    })


def demand_forecast(category: str) -> Dict[str, Any]:
    """Прогноз спроса по категории товаров"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            p.name,
            p.id,
            COUNT(oi.id) as sales_count,
            COALESCE(SUM(oi.quantity), 0) as total_quantity,
            COALESCE(AVG(oi.price), 0) as avg_price
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.category = %s
            AND (o.order_date >= NOW() - INTERVAL '30 days' OR o.order_date IS NULL)
        GROUP BY p.id, p.name
        ORDER BY total_quantity DESC
        LIMIT 10
    """, (category,))
    
    products = cur.fetchall()
    
    total_sales = sum(row['total_quantity'] for row in products)
    
    forecast = []
    for product in products:
        demand_score = (product['total_quantity'] / total_sales * 100) if total_sales > 0 else 0
        
        forecast.append({
            'productId': product['id'],
            'productName': product['name'],
            'salesCount': product['sales_count'],
            'totalQuantity': product['total_quantity'],
            'demandScore': round(demand_score, 2),
            'recommendedStock': int(product['total_quantity'] * 1.5)
        })
    
    cur.close()
    conn.close()
    
    return success_response({
        'category': category,
        'forecast': forecast,
        'totalSales': total_sales
    })


def get_predictions(prediction_type: str = None) -> Dict[str, Any]:
    """Получение сохраненных предсказаний"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT * FROM ml_predictions
        WHERE 1=1
    """
    params = []
    
    if prediction_type:
        query += " AND prediction_type = %s"
        params.append(prediction_type)
    
    query += " ORDER BY created_at DESC LIMIT 50"
    
    cur.execute(query, params)
    predictions = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return success_response({
        'predictions': [dict(p) for p in predictions],
        'total': len(predictions)
    })


def cors_response() -> Dict[str, Any]:
    """CORS preflight response"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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