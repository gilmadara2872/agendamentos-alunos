"""
Sistema de Autenticacao - Login do Coordenador
Usa JWT (stateless) + hash de senha
"""
import hashlib
import os
import time
import jwt
from functools import wraps
from flask import request, jsonify

# Chave secreta para JWT (em producao seria env var)
JWT_SECRET = os.environ.get('JWT_SECRET', 'chave-secreta-projeto-ads-2026')

def hash_senha(senha: str) -> str:
    """Hash da senha com SHA256 + salt fixo"""
    salt = "agendamento-ads-2026-"
    return hashlib.sha256((salt + senha).encode()).hexdigest()


def gerar_token(usuario_id: int, nome: str) -> str:
    """Gera JWT valido por 8 horas"""
    payload = {
        'usuario_id': usuario_id,
        'nome': nome,
        'exp': time.time() + (8 * 3600),  # 8h
        'iat': time.time()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def verificar_token(token: str) -> dict:
    """Verifica se o JWT e valido"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return {'erro': 'Token expirado'}
    except jwt.InvalidTokenError:
        return {'erro': 'Token invalido'}


def token_requerido(f):
    """Decorator para proteger rotas"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        token = auth.replace('Bearer ', '') if auth.startswith('Bearer ') else None
        
        if not token:
            return jsonify({'erro': 'Token obvio'}), 401
        
        payload = verificar_token(token)
        if 'erro' in payload:
            return jsonify({'erro': payload['erro']}), 401
        
        request.usuario = payload
        return f(*args, **kwargs)
    return decorated
