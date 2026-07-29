import csv
import io

from sqlalchemy.orm import Session

from app.models import Attendee, ReferralCode

# Columns that map to first-class attendee fields; everything else lands in `extra`.
KNOWN_ATTENDEE_FIELDS = {
    "guest_id",
    "name",
    "first_name",
    "last_name",
    "email",
    "phone_number",
    "approval_status",
    "checked_in_at",
    "ticket_name",
    "created_at",
}


def _decode(file_bytes: bytes) -> list[dict]:
    text = file_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader]


def parse_attendees(file_bytes: bytes) -> tuple[list[dict], list[str]]:
    """Return (normalized_rows, errors) without touching the DB (used for preview)."""
    rows = _decode(file_bytes)
    errors: list[str] = []
    normalized: list[dict] = []
    seen_emails: set[str] = set()

    for idx, row in enumerate(rows, start=2):  # header is line 1
        email = (row.get("email") or "").strip().lower()
        name = (row.get("name") or "").strip()
        if not name:
            first = (row.get("first_name") or "").strip()
            last = (row.get("last_name") or "").strip()
            name = f"{first} {last}".strip()
        if not email:
            errors.append(f"Row {idx}: missing email, skipped")
            continue
        if email in seen_emails:
            errors.append(f"Row {idx}: duplicate email '{email}' in file, skipped")
            continue
        seen_emails.add(email)

        linkedin = None
        source = None
        extra = {}
        for key, value in row.items():
            if key is None:
                continue
            lower_key = key.lower()
            if "linkedin" in lower_key:
                linkedin = value
            elif "how did you hear" in lower_key:
                source = value
            elif key not in KNOWN_ATTENDEE_FIELDS and value:
                extra[key] = value

        normalized.append(
            {
                "guest_id": (row.get("guest_id") or "").strip() or None,
                "name": name or email,
                "first_name": (row.get("first_name") or "").strip() or None,
                "last_name": (row.get("last_name") or "").strip() or None,
                "email": email,
                "phone_number": (row.get("phone_number") or "").strip() or None,
                "approval_status": (row.get("approval_status") or "").strip() or None,
                "checked_in_at": (row.get("checked_in_at") or "").strip() or None,
                "ticket_name": (row.get("ticket_name") or "").strip() or None,
                "created_at": (row.get("created_at") or "").strip() or None,
                "linkedin": linkedin,
                "source": source,
                "extra": extra or None,
            }
        )

    return normalized, errors


def import_attendees(db: Session, file_bytes: bytes) -> dict:
    normalized, errors = parse_attendees(file_bytes)
    imported = 0
    updated = 0

    for data in normalized:
        existing = db.query(Attendee).filter(Attendee.email == data["email"]).first()
        if existing is None and data["guest_id"]:
            existing = db.query(Attendee).filter(Attendee.guest_id == data["guest_id"]).first()

        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            db.add(Attendee(**data))
            imported += 1

    return {
        "imported": imported,
        "updated": updated,
        "skipped": len(errors),
        "total_rows": len(normalized) + len(errors),
        "errors": errors,
        "preview": normalized[:10],
    }


def parse_codes(file_bytes: bytes) -> tuple[list[dict], list[str]]:
    rows = _decode(file_bytes)
    errors: list[str] = []
    normalized: list[dict] = []
    seen_codes: set[str] = set()

    for idx, row in enumerate(rows, start=2):
        # Accept case-insensitive Code/URL headers.
        lowered = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        code = lowered.get("code", "")
        url = lowered.get("url", "")
        if not code:
            errors.append(f"Row {idx}: missing code, skipped")
            continue
        if not url:
            url = f"https://cursor.com/referral?code={code}"
        if code in seen_codes:
            errors.append(f"Row {idx}: duplicate code '{code}' in file, skipped")
            continue
        seen_codes.add(code)
        normalized.append({"code": code, "url": url})

    return normalized, errors


def import_codes(db: Session, file_bytes: bytes) -> dict:
    normalized, errors = parse_codes(file_bytes)
    imported = 0
    updated = 0

    for data in normalized:
        existing = db.query(ReferralCode).filter(ReferralCode.code == data["code"]).first()
        if existing:
            existing.url = data["url"]
            updated += 1
        else:
            db.add(ReferralCode(code=data["code"], url=data["url"], status="available"))
            imported += 1

    return {
        "imported": imported,
        "updated": updated,
        "skipped": len(errors),
        "total_rows": len(normalized) + len(errors),
        "errors": errors,
        "preview": normalized[:10],
    }
