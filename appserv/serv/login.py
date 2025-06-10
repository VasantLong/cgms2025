# main.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
import re
import os

from .auth import (
    authenticate_user, 
    create_access_token, 
    get_current_active_user, 
    get_password_hash,
    Token,
    User
)
from .config import app, dblock
from datetime import timedelta
from .error import ConflictError, InvalidError


ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 设置访问令牌的过期时间为30分钟

# 初始化限流器
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# 定义请求体模型
class UserCreate(BaseModel):
    username: str
    password: str

# 修改登录接口的请求模型
class LoginRequest(BaseModel):
    username: str
    password: str


@app.get("/api/show-secret")
async def show_secret():
    return {"SECRET_KEY": os.getenv("SECRET_KEY")}

# 登录接口
@app.post("/api/token", response_model=Token)
@limiter.limit("5/minute")  # 添加速率限制
async def login_for_access_token(
    request: Request,
    form_data: LoginRequest = Body(...)  # 替换原有的OAuth2PasswordRequestForm
):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"username": user.user_name, "user_sn": user.user_sn},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_sn": user.user_sn,
        "username": user.user_name
    }

@app.get("/api/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/api/users/")
async def create_user(user_data: UserCreate):
    username = user_data.username
    password = user_data.password
    
    # 检查用户名是否存在
    with dblock() as db:
        db.execute("""
            SELECT user_sn 
            FROM sys_users 
            WHERE username = %(username)s
            """,
            {"username": username}
        )
        if db.fetchone():
            raise ConflictError("Username already registered")
    
    # 密码复杂度验证
    if not re.match(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$", password):
        raise InvalidError("Password too weak")
    
    # 创建用户
    with dblock() as db:
        db.execute("""
            INSERT INTO sys_users (username)
            VALUES (%(username)s)
            RETURNING user_sn
            """, {"username": username}
        )
        user = db.fetchone()
        
        # 哈希模式存储密码
        hashed_password = get_password_hash(password)
        db.execute("""
            INSERT INTO passwords (user_sn, hashed_password)
            VALUES (%(user_sn)s, %(hashed_password)s)
            """,{
                "user_sn": user.user_sn,  # type: ignore
                "hashed_password": hashed_password
            }
        )
    
    return {"username": username, "message": "User created successfully"}

# 新增密码修改接口
@app.post("/api/change-password")
async def change_password(
    current_user: User = Depends(get_current_active_user),
    new_password: str = Body(..., embed=True)
):
    # 密码复杂度验证
    if not re.match(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$", new_password):
        raise InvalidError("密码必须包含大小写字母和数字，至少8位")
    
    # 更新密码
    with dblock() as db:
        db.execute("""
            UPDATE passwords 
            SET hashed_password = %(hashed_password)s
            WHERE user_sn = %(user_sn)s
            """, {
                "hashed_password": get_password_hash(new_password),
                "user_sn": current_user.user_sn
            }
        )
    
    return {"message": "密码修改成功"}