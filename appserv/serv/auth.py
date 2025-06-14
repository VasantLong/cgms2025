# models.py
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend  # 需要安装redis依赖
from fastapi_cache.decorator import cache
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, field_validator
import os

from .config import dblock
from .error import ConflictError, InvalidError




# auth.py
# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-weak-key-for-dev-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 密码哈希
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # 增加计算成本
)

# OAuth2 方案
oauth2_scheme = HTTPBearer()

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    user_sn: int
    user_name: str

    class Config:
        from_attributes = True

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

async def get_user(username: str) -> Optional[User]:
    with dblock() as db:
        db.execute("""
            SELECT user_sn, username 
            FROM sys_users 
            WHERE username = %(username)s
            """,
            {"username": username}
        )
        row = db.fetchone()
    
        if not row:
            return None
    
    return User(user_sn=row.user_sn, user_name=row.username) # type: ignore

async def authenticate_user(username: str, password: str) -> Optional[User]:
    with dblock() as db:
        db.execute("""
            SELECT u.user_sn, u.username, p.hashed_password 
            FROM sys_users u
            JOIN user_passwords p ON u.user_sn = p.user_sn
            WHERE u.username = %(username)s
            """, 
            {"username": username}
        )
        row = db.fetchone()
    
    if not row or not verify_password(password, row.hashed_password):
        return None
    
    return User(user_sn=row.user_sn, user_name=row.username)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta 
                                           or timedelta(minutes=15))  # 默认15分钟
    to_encode.update({
        "exp": expire,
        "user_sn": data.get("user_sn"),
        "user_name": data.get("user_name")
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> User:
    token = credentials.credentials  # 关键修复：提取真正的token字符串
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 生成缓存键
    cache_key = f"user:{token}"
    try:
        # 尝试从缓存获取
        cached_user = await FastAPICache.get_backend().get(cache_key)
        if cached_user:
            return User(**cached_user)
        
        # 缓存未命中，从数据库获取
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username") # type: ignore
        if not username:
            raise credentials_exception
        
        # 获取用户并缓存
        user = await get_user(username)
        if user is None:
            raise credentials_exception   
        
        # 缓存用户信息（有效期5分钟）
        await FastAPICache.get_backend().set(cache_key, user.model_dump(), expire=300)
        
        return user         
    
    except JWTError as e:
        raise credentials_exception from e
    


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user