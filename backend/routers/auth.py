import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import User
from backend.schemas import UserCreate, UserRead, LoginRequest, Token
from backend.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=201)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    if os.getenv("REGISTRATION_ENABLED", "false").lower() != "true":
        raise HTTPException(status_code=403, detail="현재 회원가입이 비활성화되어 있습니다.")
    if len(body.email.strip()) < 3 or "@" not in body.email:
        raise HTTPException(status_code=400, detail="유효한 이메일을 입력해주세요.")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다.")
    exists = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")
    user = User(email=body.email.strip().lower(), hashed_password=hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.email == body.email.strip().lower()))).scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    token = create_access_token(user.id)
    return Token(access_token=token, user=user)

@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)):
    return user
