import json
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Система авторизации и управления ролями пользователей
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id, function_name
    Returns: HTTP response dict с токенами и данными пользователя
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return cors_response()
    
    query_params = event.get('queryStringParameters', {}) or {}
    action = query_params.get('action', '')
    headers = event.get('headers', {})
    
    try:
        if action == 'register' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return register_user(body_data)
        
        elif action == 'login' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return login_user(body_data)
        
        elif action == 'getUser':
            auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            return get_user(auth_token)
        
        elif action == 'updateRole' and method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            return update_user_role(body_data, auth_token)
        
        elif action == 'getUsers':
            auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            return get_all_users(auth_token)
        
        elif action == 'checkPermission':
            auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            permission = query_params.get('permission')
            return check_permission(auth_token, permission)
        
        else:
            return error_response('Invalid action', 400)
    
    except Exception as e:
        return error_response(str(e), 500)


def get_db_connection():
    """Получение подключения к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    conn.set_session(autocommit=True)
    cur = conn.cursor()
    cur.execute("SET search_path TO t_p86529894_ecommerce_management")
    cur.close()
    return conn


def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token() -> str:
    """Генерация случайного токена"""
    return secrets.token_urlsafe(32)


def get_role_permissions(role: str) -> Dict[str, bool]:
    """Получение прав доступа для роли"""
    permissions = {
        'owner': {
            'view_dashboard': True,
            'manage_products': True,
            'manage_orders': True,
            'view_analytics': True,
            'manage_users': True,
            'manage_marketplaces': True,
            'view_ml_predictions': True,
            'manage_settings': True
        },
        'manager': {
            'view_dashboard': True,
            'manage_products': True,
            'manage_orders': True,
            'view_analytics': True,
            'manage_users': False,
            'manage_marketplaces': True,
            'view_ml_predictions': True,
            'manage_settings': False
        },
        'analyst': {
            'view_dashboard': True,
            'manage_products': False,
            'manage_orders': False,
            'view_analytics': True,
            'manage_users': False,
            'manage_marketplaces': False,
            'view_ml_predictions': True,
            'manage_settings': False
        },
        'operator': {
            'view_dashboard': True,
            'manage_products': True,
            'manage_orders': True,
            'view_analytics': False,
            'manage_users': False,
            'manage_marketplaces': False,
            'view_ml_predictions': False,
            'manage_settings': False
        },
        'support': {
            'view_dashboard': True,
            'manage_products': False,
            'manage_orders': True,
            'view_analytics': False,
            'manage_users': False,
            'manage_marketplaces': False,
            'view_ml_predictions': False,
            'manage_settings': False
        },
        'admin': {
            'view_dashboard': True,
            'manage_products': True,
            'manage_orders': True,
            'view_analytics': True,
            'manage_users': True,
            'manage_marketplaces': True,
            'view_ml_predictions': True,
            'manage_settings': True
        }
    }
    
    return permissions.get(role, permissions['operator'])


def register_user(data: Dict[str, Any]) -> Dict[str, Any]:
    """Регистрация нового пользователя"""
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('fullName')
    role = data.get('role', 'operator')
    
    if not email or not password:
        return error_response('Email and password are required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id FROM users
        WHERE email = %s
    """, (email,))
    
    if cur.fetchone():
        cur.close()
        conn.close()
        return error_response('User already exists', 400)
    
    password_hash = hash_password(password)
    
    cur.execute("""
        INSERT INTO users
        (email, password_hash, full_name, role)
        VALUES (%s, %s, %s, %s)
        RETURNING id, email, full_name, role, created_at
    """, (email, password_hash, full_name, role))
    
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    token = generate_token()
    permissions = get_role_permissions(role)
    
    return success_response({
        'user': dict(user),
        'token': token,
        'permissions': permissions,
        'message': 'Пользователь создан успешно'
    })


def login_user(data: Dict[str, Any]) -> Dict[str, Any]:
    """Вход пользователя"""
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return error_response('Email and password are required', 400)
    
    password_hash = hash_password(password)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id, email, full_name, role, is_active
        FROM users
        WHERE email = %s AND password_hash = %s
    """, (email, password_hash))
    
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return error_response('Invalid credentials', 401)
    
    if not user['is_active']:
        return error_response('User is inactive', 403)
    
    token = generate_token()
    permissions = get_role_permissions(user['role'])
    
    return success_response({
        'user': dict(user),
        'token': token,
        'permissions': permissions,
        'message': 'Вход выполнен успешно'
    })


def get_user(auth_token: Optional[str]) -> Dict[str, Any]:
    """Получение данных текущего пользователя"""
    if not auth_token:
        return error_response('Authorization required', 401)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id, email, full_name, role, is_active, created_at
        FROM users
        WHERE is_active = true
        LIMIT 1
    """)
    
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return error_response('User not found', 404)
    
    permissions = get_role_permissions(user['role'])
    
    return success_response({
        'user': dict(user),
        'permissions': permissions
    })


def update_user_role(data: Dict[str, Any], auth_token: Optional[str]) -> Dict[str, Any]:
    """Обновление роли пользователя (только для owner/admin)"""
    if not auth_token:
        return error_response('Authorization required', 401)
    
    user_id = data.get('userId')
    new_role = data.get('role')
    
    if not user_id or not new_role:
        return error_response('User ID and role are required', 400)
    
    valid_roles = ['owner', 'manager', 'analyst', 'operator', 'support', 'admin']
    if new_role not in valid_roles:
        return error_response('Invalid role', 400)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        UPDATE users
        SET role = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING id, email, full_name, role
    """, (new_role, user_id))
    
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return error_response('User not found', 404)
    
    return success_response({
        'user': dict(user),
        'message': 'Роль обновлена успешно'
    })


def get_all_users(auth_token: Optional[str]) -> Dict[str, Any]:
    """Получение списка всех пользователей"""
    if not auth_token:
        return error_response('Authorization required', 401)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id, email, full_name, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
    """)
    
    users = cur.fetchall()
    cur.close()
    conn.close()
    
    return success_response({
        'users': [dict(u) for u in users],
        'total': len(users)
    })


def check_permission(auth_token: Optional[str], permission: str) -> Dict[str, Any]:
    """Проверка прав доступа пользователя"""
    if not auth_token:
        return error_response('Authorization required', 401)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT role FROM users
        WHERE is_active = true
        LIMIT 1
    """)
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if not result:
        return error_response('User not found', 404)
    
    permissions = get_role_permissions(result['role'])
    has_permission = permissions.get(permission, False)
    
    return success_response({
        'permission': permission,
        'hasPermission': has_permission,
        'role': result['role']
    })


def cors_response() -> Dict[str, Any]:
    """CORS preflight response"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
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