# models.py
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
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
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({
        "exp": expire,
        "user_sn": data.get("user_sn"),
        "user_name": data.get("user_name")
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username") # type: ignore
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user(username)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user