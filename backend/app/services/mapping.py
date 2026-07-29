from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Attendee, ReferralCode


def map_credits(db: Session) -> dict:
    """Greedily assign one available code to each unmapped attendee.

    Idempotent: attendees who already have a code are never touched.
    """
    assigned_attendee_ids = {
        row[0]
        for row in db.execute(
            select(ReferralCode.attendee_id).where(ReferralCode.attendee_id.isnot(None))
        ).all()
    }

    unmapped_attendees = (
        db.query(Attendee)
        .filter(~Attendee.id.in_(assigned_attendee_ids) if assigned_attendee_ids else True)
        .order_by(Attendee.imported_at, Attendee.id)
        .all()
    )
    available_codes = (
        db.query(ReferralCode)
        .filter(ReferralCode.status == "available", ReferralCode.attendee_id.is_(None))
        .order_by(ReferralCode.imported_at, ReferralCode.id)
        .all()
    )

    now = datetime.now(timezone.utc)
    newly_assigned = 0
    for attendee, code in zip(unmapped_attendees, available_codes):
        code.attendee_id = attendee.id
        code.status = "assigned"
        code.assigned_at = now
        newly_assigned += 1

    leftover_attendees = unmapped_attendees[newly_assigned:]
    leftover_codes = available_codes[newly_assigned:]

    total_mapped = (
        db.query(ReferralCode).filter(ReferralCode.attendee_id.isnot(None)).count() + 0
    )

    return {
        "newly_assigned": newly_assigned,
        "leftover_attendees": leftover_attendees,
        "leftover_codes": leftover_codes,
    }
