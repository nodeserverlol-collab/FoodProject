# contact.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import logging
from datetime import datetime

load_dotenv()

router = APIRouter(prefix="/contact", tags=["contacts"])

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic модели для валидации
class ContactMessage(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Имя отправителя")
    email: EmailStr = Field(..., description="Email отправителя")
    message: str = Field(..., min_length=10, max_length=5000, description="Сообщение")
    phone: Optional[str] = Field(None, description="Телефон (опционально)")

class ContactResponse(BaseModel):
    success: bool
    message: str
    ticket_id: Optional[str] = None

# Временное хранилище сообщений (в реальном проекте используйте БД)
messages_db = []

# Функция для отправки email (через SMTP)
async def send_email_notification(message: ContactMessage):
    """Отправка уведомления на email администратора"""
    try:
        # Настройки SMTP (для Gmail)
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_email = os.getenv("SMTP_EMAIL")
        smtp_password = os.getenv("SMTP_PASSWORD")
        admin_email = os.getenv("ADMIN_EMAIL", smtp_email)
        
        if not smtp_email or not smtp_password:
            logger.warning("SMTP не настроен. Email не отправлен.")
            return
        
        # Создаем письмо
        msg = MIMEMultipart()
        msg['From'] = smtp_email
        msg['To'] = admin_email
        msg['Subject'] = f"Новое сообщение от {message.name}"
        
        # HTML тело письма
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .container {{ padding: 20px; background: #f5f5f5; }}
                .header {{ background: #ff6900; color: white; padding: 10px; text-align: center; }}
                .content {{ background: white; padding: 20px; border-radius: 10px; }}
                .field {{ margin: 10px 0; }}
                .label {{ font-weight: bold; color: #ff6900; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🍕 Новое сообщение с сайта</h2>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">👤 Отправитель:</span> {message.name}
                    </div>
                    <div class="field">
                        <span class="label">📧 Email:</span> {message.email}
                    </div>
                    {f'<div class="field"><span class="label">📞 Телефон:</span> {message.phone}</div>' if message.phone else ''}
                    <div class="field">
                        <span class="label">💬 Сообщение:</span>
                        <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">{message.message}</p>
                    </div>
                    <div class="field">
                        <span class="label">🕐 Время:</span> {datetime.now().strftime("%d.%m.%Y %H:%M:%S")}
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Отправляем письмо
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
            
        logger.info(f"Email отправлен на {admin_email}")
        
    except Exception as e:
        logger.error(f"Ошибка отправки email: {e}")

# Функция для сохранения в БД (пример с SQLite)
async def save_to_database(message: ContactMessage):
    """Сохранение сообщения в базу данных"""
    try:
        # Если у вас есть SQLAlchemy модель
        # new_message = ContactMessageDB(
        #     name=message.name,
        #     email=message.email,
        #     message=message.message,
        #     phone=message.phone,
        #     created_at=datetime.now()
        # )
        # db.add(new_message)
        # await db.commit()
        
        # Пока используем список
        messages_db.append({
            "id": len(messages_db) + 1,
            **message.dict(),
            "created_at": datetime.now().isoformat()
        })
        logger.info(f"Сообщение сохранено в БД. ID: {len(messages_db)}")
    except Exception as e:
        logger.error(f"Ошибка сохранения в БД: {e}")

@router.post("/send", response_model=ContactResponse)
async def send_contact_message(
    message: ContactMessage,
    background_tasks: BackgroundTasks
):
    """
    Отправка сообщения из контактной формы
    """
    try:
        # Валидация
        if len(message.message) < 10:
            raise HTTPException(
                status_code=400, 
                detail="Сообщение должно быть не менее 10 символов"
            )
        
        # Сохраняем в БД (фоново)
        background_tasks.add_task(save_to_database, message)
        
        # Отправляем email админу (фоново)
        background_tasks.add_task(send_email_notification, message)
        
        # Генерируем ID тикета
        ticket_id = f"TICKET-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Логируем
        logger.info(f"Новое сообщение от {message.name} ({message.email})")
        
        return ContactResponse(
            success=True,
            message="Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.",
            ticket_id=ticket_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обработки сообщения: {e}")
        raise HTTPException(
            status_code=500,
            detail="Произошла ошибка при отправке сообщения"
        )

@router.get("/messages")
async def get_all_messages():
    """Получение всех сообщений (только для админа)"""
    # В реальном проекте добавьте аутентификацию!
    return {"messages": messages_db, "total": len(messages_db)}