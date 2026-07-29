from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AdminUser
from app.security import hash_password


def seed_admin(db: Session) -> None:
    settings = get_settings()
    existing = db.query(AdminUser).filter(AdminUser.email == settings.admin_email.lower()).first()
    if existing is None:
        db.add(
            AdminUser(
                email=settings.admin_email.lower(),
                password_hash=hash_password(settings.admin_password),
            )
        )
        db.commit()
