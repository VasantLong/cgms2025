# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, Body, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
import re
import os

from .auth import (
    SysUser,
    Password,
    SessionLocal,
    authenticate_user, 
    create_access_token, 
    get_current_active_user, 
    get_password_hash,
    get_db,
    Token,
    User
)
from datetime import timedelta, datetime, timezone
from sqlalchemy.orm import Session

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化
    yield
    # 关闭时清理
    # 可以在这里添加其他资源的清理代码

app = FastAPI(lifespan=lifespan)
# 初始化限流器
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# 定义请求体模型
class UserCreate(BaseModel):
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
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.user_name}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {  # 添加用户基本信息
            "user_sn": user.user_sn,
            "real_name": user.real_name,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    }

@app.get("/api/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/api/users/")
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    username = user_data.username
    password = user_data.password
    existing_user = db.query(SysUser).filter(SysUser.user_name == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    if not re.match(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$", password):
        raise HTTPException(status_code=400, detail="Password too weak")
    db_user = SysUser(user_name=username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 密码经过哈希处理后存储
    hashed_password = get_password_hash(password)
    db_password = Password(user_sn=db_user.user_sn, hashed_password=hashed_password)
    db.add(db_password)
    db.commit()
    
    return {"username": username, "message": "User created successfully"}

# 新增密码修改接口
@app.post("/api/change-password")
async def change_password(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    new_password: str = Body(..., embed=True)
):
    # 密码复杂度验证
    if not re.match(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$", new_password):
        raise HTTPException(status_code=400, detail="密码必须包含大小写字母和数字，至少8位")
    
    # 更新密码
    db_password = db.query(Password).filter(Password.user_sn == current_user.user_sn).first()
    db_password.hashed_password = get_password_hash(new_password) # type: ignore
    db_password.password_changed = datetime.now(timezone.utc) # type: ignore
    db.commit()
    
    return {"message": "密码修改成功"}