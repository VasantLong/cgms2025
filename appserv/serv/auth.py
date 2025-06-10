# models.py
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from dotenv import load_dotenv
import os
import logging

from .config import dblock
from .error import ConflictError, InvalidError

logger = logging.getLogger(__name__)



# auth.py
# 安全配置
load_dotenv()  # 加载环境变量
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-weak-key-for-dev-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 密码哈希
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # 增加计算成本
)

# 密码策略常量
PASSWORD_POLICY = {
    'min_length': 8,
    'require_upper': True,
    'require_lower': True,
    'require_digit': True,
    'max_age_days': 90  # 密码有效期
}

# OAuth2 方案
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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

async def get_user(username: str):
    with dblock() as db:
        db.execute("""
            SELECT user_sn, user_name 
            FROM sys_users 
            WHERE user_name = %(username)s
            """,
            {"username": username}
        )
        user = db.fetchone()
    return User(**user) if user else None

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        logger.warning(f"登录尝试：用户 {username} 不存在")
        return False
    
    # 查询密码
    with dblock() as db:
        db.execute("""
            SELECT hashed_password 
            FROM passwords 
            WHERE user_sn = %(user_sn)s
            """,
            {"user_sn": user.user_sn}
        )
        db_password = db.fetchone()
    if not db_password:
        return False
    
    # 验证对比哈希值
    if not db_password or not verify_password(password, db_password.hashed_password): 
        logger.warning(f"用户 {username} 密码错误")
        return False

    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({
        "exp": expire,
        "sub": data.get("username"),
        "user_sn": data.get("user_sn")
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub") # type: ignore
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await get_user(username=token_data.username) # type: ignore
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user