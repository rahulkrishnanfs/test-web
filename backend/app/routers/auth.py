from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import bearer_scheme
from app.models import AdminUser, Attendee
from app.schemas import AdminLogin, AttendeeLogin, MeResponse, Token
from app.security import create_access_token, decode_access_token, verify_password
from app.services.audit import log_action

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/admin/login", response_model=Token)
def admin_login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == payload.email.lower()).first()
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(subject=str(admin.id), role="admin")
    log_action(db, admin.email, "admin_login")
    db.commit()
    return Token(access_token=token, role="admin", email=admin.email)


@router.post("/attendee/login", response_model=Token)
def attendee_login(payload: AttendeeLogin, db: Session = Depends(get_db)):
    attendee = db.query(Attendee).filter(Attendee.email == payload.email.lower()).first()
    if attendee is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No attendee found with that email. Please check with the event organizers.",
        )
    token = create_access_token(subject=str(attendee.id), role="attendee")
    return Token(access_token=token, role="attendee", name=attendee.name, email=attendee.email)


@router.get("/me", response_model=MeResponse)
def me(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    role = payload.get("role")
    if role == "admin":
        admin = db.get(AdminUser, int(payload["sub"]))
        if admin is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
        return MeResponse(role="admin", email=admin.email)
    if role == "attendee":
        attendee = db.get(Attendee, int(payload["sub"]))
        if attendee is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Attendee not found")
        return MeResponse(role="attendee", email=attendee.email, name=attendee.name)
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown role")
