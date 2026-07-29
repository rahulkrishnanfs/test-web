import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import AdminUser, Attendee, AuditLog, ReferralCode
from app.schemas import (
    AttendeeOut,
    AttendeeUpdate,
    AuditLogOut,
    CodeOut,
    CodeUpdate,
    ImportResult,
    MapCreditsResult,
    MappingRow,
    ReassignRequest,
    Stats,
)
from app.services import csv_import
from app.services.audit import log_action
from app.services.mapping import map_credits

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/import/attendees", response_model=ImportResult)
async def import_attendees(
    file: UploadFile = File(...),
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    content = await file.read()
    try:
        result = csv_import.import_attendees(db, content)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc
    log_action(db, admin.email, "import_attendees", detail={k: result[k] for k in ("imported", "updated", "skipped")})
    db.commit()
    return ImportResult(**result)


@router.post("/import/codes", response_model=ImportResult)
async def import_codes(
    file: UploadFile = File(...),
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    content = await file.read()
    try:
        result = csv_import.import_codes(db, content)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc
    log_action(db, admin.email, "import_codes", detail={k: result[k] for k in ("imported", "updated", "skipped")})
    db.commit()
    return ImportResult(**result)


@router.post("/map-credits", response_model=MapCreditsResult)
def map_credits_endpoint(
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    result = map_credits(db)
    db.flush()
    total_mapped = db.query(ReferralCode).filter(ReferralCode.attendee_id.isnot(None)).count()
    log_action(
        db,
        admin.email,
        "map_credits",
        detail={"newly_assigned": result["newly_assigned"], "total_mapped": total_mapped},
    )
    db.commit()
    return MapCreditsResult(
        newly_assigned=result["newly_assigned"],
        total_mapped=total_mapped,
        unmapped_attendees=[AttendeeOut.model_validate(a) for a in result["leftover_attendees"]],
        unused_codes=[CodeOut.model_validate(c) for c in result["leftover_codes"]],
    )


@router.get("/mappings", response_model=list[MappingRow])
def list_mappings(
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Attendee)
    if search:
        like = f"%{search.lower()}%"
        query = query.filter(
            or_(Attendee.name.ilike(like), Attendee.email.ilike(like))
        )
    attendees = query.order_by(Attendee.name).all()

    rows: list[MappingRow] = []
    for attendee in attendees:
        code = attendee.referral_code
        mapped = code is not None
        if status_filter == "mapped" and not mapped:
            continue
        if status_filter == "unmapped" and mapped:
            continue
        rows.append(
            MappingRow(
                attendee_id=attendee.id,
                name=attendee.name,
                email=attendee.email,
                code=code.code if code else None,
                url=code.url if code else None,
                status="mapped" if mapped else "unmapped",
                code_id=code.id if code else None,
            )
        )
    return rows


@router.get("/codes", response_model=list[CodeOut])
def list_codes(
    only_available: bool = Query(default=False),
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(ReferralCode)
    if only_available:
        query = query.filter(ReferralCode.attendee_id.is_(None))
    return [CodeOut.model_validate(c) for c in query.order_by(ReferralCode.code).all()]


@router.get("/stats", response_model=Stats)
def stats(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    total_attendees = db.query(Attendee).count()
    total_codes = db.query(ReferralCode).count()
    assigned = db.query(ReferralCode).filter(ReferralCode.attendee_id.isnot(None)).count()
    redeemed = db.query(ReferralCode).filter(ReferralCode.status == "redeemed").count()
    return Stats(
        total_attendees=total_attendees,
        total_codes=total_codes,
        assigned_codes=assigned,
        remaining_codes=total_codes - assigned,
        redeemed_codes=redeemed,
    )


@router.post("/reassign", response_model=MappingRow)
def reassign(
    payload: ReassignRequest,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    attendee = db.get(Attendee, payload.attendee_id)
    if attendee is None:
        raise HTTPException(status_code=404, detail="Attendee not found")
    code = db.get(ReferralCode, payload.code_id)
    if code is None:
        raise HTTPException(status_code=404, detail="Referral code not found")

    # Free the code currently held by this attendee (if any).
    current = attendee.referral_code
    if current is not None and current.id != code.id:
        current.attendee_id = None
        current.status = "available"
        current.assigned_at = None

    # Free the target code from whoever holds it now.
    if code.attendee_id is not None and code.attendee_id != attendee.id:
        code.attendee_id = None

    code.attendee_id = attendee.id
    code.status = "assigned"
    code.assigned_at = datetime.now(timezone.utc)

    log_action(db, admin.email, "reassign", entity="attendee", entity_id=attendee.id, detail={"code": code.code})
    db.commit()
    db.refresh(attendee)
    return MappingRow(
        attendee_id=attendee.id,
        name=attendee.name,
        email=attendee.email,
        code=code.code,
        url=code.url,
        status="mapped",
        code_id=code.id,
    )


@router.patch("/attendees/{attendee_id}", response_model=AttendeeOut)
def update_attendee(
    attendee_id: int,
    payload: AttendeeUpdate,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    attendee = db.get(Attendee, attendee_id)
    if attendee is None:
        raise HTTPException(status_code=404, detail="Attendee not found")
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"]:
        data["email"] = data["email"].lower()
    for key, value in data.items():
        setattr(attendee, key, value)
    log_action(db, admin.email, "update_attendee", entity="attendee", entity_id=attendee_id, detail=data)
    db.commit()
    db.refresh(attendee)
    return AttendeeOut.model_validate(attendee)


@router.delete("/attendees/{attendee_id}")
def delete_attendee(
    attendee_id: int,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    attendee = db.get(Attendee, attendee_id)
    if attendee is None:
        raise HTTPException(status_code=404, detail="Attendee not found")
    # Release any assigned code back to the pool.
    code = attendee.referral_code
    if code is not None:
        code.attendee_id = None
        code.status = "available"
        code.assigned_at = None
    db.delete(attendee)
    log_action(db, admin.email, "delete_attendee", entity="attendee", entity_id=attendee_id)
    db.commit()
    return {"deleted": True}


@router.patch("/codes/{code_id}", response_model=CodeOut)
def update_code(
    code_id: int,
    payload: CodeUpdate,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    code = db.get(ReferralCode, code_id)
    if code is None:
        raise HTTPException(status_code=404, detail="Referral code not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(code, key, value)
    log_action(db, admin.email, "update_code", entity="code", entity_id=code_id, detail=data)
    db.commit()
    db.refresh(code)
    return CodeOut.model_validate(code)


@router.delete("/codes/{code_id}")
def delete_code(
    code_id: int,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    code = db.get(ReferralCode, code_id)
    if code is None:
        raise HTTPException(status_code=404, detail="Referral code not found")
    db.delete(code)
    log_action(db, admin.email, "delete_code", entity="code", entity_id=code_id)
    db.commit()
    return {"deleted": True}


@router.get("/export.csv")
def export_csv(admin: AdminUser = Depends(require_admin), db: Session = Depends(get_db)):
    attendees = db.query(Attendee).order_by(Attendee.name).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["name", "email", "guest_id", "referral_code", "referral_url", "status"])
    for attendee in attendees:
        code = attendee.referral_code
        writer.writerow(
            [
                attendee.name,
                attendee.email,
                attendee.guest_id or "",
                code.code if code else "",
                code.url if code else "",
                code.status if code else "unmapped",
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cursor_northampton_mappings.csv"},
    )


@router.get("/audit-logs", response_model=list[AuditLogOut])
def audit_logs(
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(default=100, le=500),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [AuditLogOut.model_validate(log) for log in logs]
