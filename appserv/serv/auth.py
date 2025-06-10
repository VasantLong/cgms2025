# models.py
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session, sessionmaker, relationship

from dotenv import load_dotenv
import os

from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class SysUser(Base):
    __tablename__ = 'sys_users'
    
    user_sn = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, unique=True, index=True)
    
    password = relationship("Password", back_populates="user", uselist=False)

class Password(Base):
    __tablename__ = 'passwords'
    
    id = Column(Integer, primary_key=True, index=True)
    user_sn = Column(Integer, ForeignKey('sys_users.user_sn'))
    hashed_password = Column(String)
    
    user = relationship("SysUser", back_populates="password")

# 更新数据库连接字符串以匹配db.sql配置
SQLALCHEMY_DATABASE_URL = "postgresql://examdb:md568cefad35fed037c318b1e44cc3480cf@localhost/examdb"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建表
Base.metadata.create_all(bind=engine)



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

def get_user(db: Session, username: str):
    user = db.query(SysUser).filter(SysUser.user_name == username).first()
    if user:
        password = db.query(Password).filter(Password.user_sn == user.user_sn).first()
        if password:
            return user
    return None

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    
    db_password = db.query(Password).filter(Password.user_sn == user.user_sn).first()
    if not db_password:
        return False
    
    # 验证对比哈希值
    if not verify_password(password, db_password.hashed_password): # type: ignore
        return False
    
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
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
    
    db = SessionLocal()
    user = get_user(db, username=token_data.username) # type: ignore
    db.close()
    
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user

# 数据库依赖
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # 确保会话完全关闭
        db.expunge_all()
        db.expire_on_commit = False