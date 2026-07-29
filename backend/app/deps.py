from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdminUser, Attendee
from app.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def _get_payload(credentials: HTTPAuthorizationCredentials | None):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    payload = _get_payload(credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    admin = db.get(AdminUser, int(payload["sub"]))
    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
    return admin


def require_attendee(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Attendee:
    payload = _get_payload(credentials)
    if payload.get("role") != "attendee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Attendee access required")
    attendee = db.get(Attendee, int(payload["sub"]))
    if attendee is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Attendee not found")
    return attendee
