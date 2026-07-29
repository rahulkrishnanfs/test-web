from sqlalchemy.orm import Session

from app.models import AuditLog


def log_action(
    db: Session,
    actor_email: str | None,
    action: str,
    entity: str | None = None,
    entity_id: str | int | None = None,
    detail: dict | None = None,
) -> None:
    entry = AuditLog(
        actor_email=actor_email,
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id is not None else None,
        detail=detail,
    )
    db.add(entry)
