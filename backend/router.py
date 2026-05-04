from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from db import get_db, AsyncSession, Users
from passlib.context import CryptContext
from db import UserCreate, UserLogin
import os
from datetime import datetime, timedelta
from config import settings
from fastapi.responses import JSONResponse
from google_oauth_get_key import generate_google_redirect_uri
import aiohttp
import jwt
import secrets
from pydantic import BaseModel
from async_lru import alru_cache

router = APIRouter(prefix="/api")

# JWT настройки
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def require_role(required_role: str):
    def dependency(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")

        try:
            payload = verify_token(token)
            user_id = payload.get("uid") or payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")

            user_role = payload.get("role", "user")

            if user_role != required_role:
                raise HTTPException(
                    status_code=403,
                    detail=f"Requires {required_role} role"
                )

            return {"user_id": user_id, "role": user_role}
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    return dependency

# Кеширование для получения пользователя по ID
@alru_cache(maxsize=128, ttl=60)  # TTL 60 секунд, максимум 128 записей
async def get_cached_user(user_id: int, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.id == user_id))
    return result.scalar_one_or_none()

# Кеширование для получения пользователя по email
@alru_cache(maxsize=128, ttl=60)
async def get_cached_user_by_email(email: str, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.email == email))
    return result.scalar_one_or_none()

# Кеширование для получения всех пользователей (для админки)
@alru_cache(maxsize=1, ttl=30)  # Одна запись на 30 секунд
async def get_cached_all_users(db: AsyncSession):
    result = await db.execute(select(Users))
    users = result.scalars().all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]

# Кеширование для статистики
@alru_cache(maxsize=1, ttl=30)  # Одна запись на 30 секунд
async def get_cached_stats(db: AsyncSession):
    result = await db.execute(select(Users))
    all_users = result.scalars().all()
    total_users = len(all_users)
    admin_count = sum(1 for u in all_users if u.role == "admin")
    moderator_count = sum(1 for u in all_users if u.role == "moderator")
    user_count = sum(1 for u in all_users if u.role == "user")
    return {
        "total_users": total_users,
        "admins": admin_count,
        "moderators": moderator_count,
        "users": user_count
    }

# Функция для инвалидации кеша при изменении данных
async def invalidate_user_cache(user_id: int = None, email: str = None):
    if user_id:
        get_cached_user.cache_invalidate(user_id)
    if email:
        get_cached_user_by_email.cache_invalidate(email)
    get_cached_all_users.cache_invalidate()
    get_cached_stats.cache_invalidate()

@router.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_cached_user_by_email(user.email, db)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    allowed_roles = ["user", "moderator", "admin"]
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Allowed roles: {', '.join(allowed_roles)}"
        )

    hashed_password = pwd_context.hash(user.password)
    new_user = Users(name=user.name, email=user.email, password=hashed_password, role=user.role)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Инвалидируем кеш после регистрации
    await invalidate_user_cache(email=user.email)

    return {"id": new_user.id, "name": new_user.name, "email": new_user.email, "role": new_user.role}

@router.post("/login")
async def login(user: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    db_user = await get_cached_user_by_email(user.email, db)

    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"uid": str(db_user.id), "role": db_user.role})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1800,
        path="/"
    )

    return {"message": "Login successful", "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email, "role": db_user.role}}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logout successful"}

@router.get("/users/me")
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = verify_token(token)
        user_id = payload.get("uid") or payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    # Используем кешированный запрос
    user = await get_cached_user(int(user_id), db)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

@router.get("/google_url")
def get_google_oauth_uri():
    uri = generate_google_redirect_uri()
    return JSONResponse(content={"redirect_url": uri})

@router.post("/google/callback")
async def google_callback(code: str, response: Response, db: AsyncSession = Depends(get_db)):
    token_url = "https://oauth2.googleapis.com/token"
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            token_url,
            data={
                "client_id": settings.OAUTH_GOOGLE_CLIENT_ID,
                "client_secret": settings.OAUTH_GOOGLE_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": "http://localhost:5173/auth/google",
                "code": code
            }
        ) as token_response:
            if token_response.status != 200:
                error_data = await token_response.json()
                return JSONResponse(status_code=400, content={"error": error_data.get("error_description", "Google auth failed")})
            
            tokens = await token_response.json()
            id_token = tokens.get("id_token")
            decoded_data = jwt.decode(id_token, options={"verify_signature": False})
            
            email = decoded_data["email"]
            db_user = await get_cached_user_by_email(email, db)
            
            if not db_user:
                random_password = secrets.token_urlsafe(32)
                hashed_password = pwd_context.hash(random_password)
                new_user = Users(name=decoded_data.get("name", email.split("@")[0]), email=email, password=hashed_password, role="user")
                db.add(new_user)
                await db.commit()
                await db.refresh(new_user)
                user_id = new_user.id
                user_name = new_user.name
                user_role = new_user.role
                # Инвалидируем кеш после создания пользователя
                await invalidate_user_cache(email=email)
            else:
                user_id = db_user.id
                user_name = db_user.name
                user_role = db_user.role
            
            token = create_access_token({"uid": str(user_id), "role": user_role})
            
            response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
            
            return {"user": {"id": user_id, "email": email, "name": user_name, "role": user_role, "picture": decoded_data.get("picture")}}

class UserUpdateRole(BaseModel):
    role: str

@router.get("/admin/users")
async def get_all_users(user_info: dict = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    # Используем кешированный запрос
    users = await get_cached_all_users(db)
    return {"users": users, "total": len(users)}

@router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: int, role_data: UserUpdateRole, user_info: dict = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Users).where(Users.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    allowed_roles = ["user", "moderator", "admin"]
    if role_data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {', '.join(allowed_roles)}")
    
    old_email = user.email
    user.role = role_data.role
    await db.commit()
    
    # Инвалидируем кеш после обновления роли
    await invalidate_user_cache(user_id=user_id, email=old_email)
    
    return {"message": f"User {user.name} role updated to {role_data.role}"}

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, user_info: dict = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    if user_id == int(user_info["user_id"]):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.execute(select(Users).where(Users.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_email = user.email
    await db.delete(user)
    await db.commit()
    
    # Инвалидируем кеш после удаления пользователя
    await invalidate_user_cache(user_id=user_id, email=user_email)
    
    return {"message": f"User {user.name} deleted successfully"}

@router.get("/admin/stats")
async def get_admin_stats(user_info: dict = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    # Используем кешированную статистику
    stats = await get_cached_stats(db)
    return stats