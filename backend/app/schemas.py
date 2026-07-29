from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AttendeeLogin(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str | None = None
    email: str | None = None


class MeResponse(BaseModel):
    role: str
    email: str | None = None
    name: str | None = None


class ReferralOut(BaseModel):
    code: str
    url: str
    status: str


class AttendeeReferralOut(BaseModel):
    name: str
    email: str
    has_referral: bool
    referral: ReferralOut | None = None


class AttendeeOut(BaseModel):
    id: int
    guest_id: str | None = None
    name: str
    email: str
    phone_number: str | None = None
    approval_status: str | None = None
    ticket_name: str | None = None
    linkedin: str | None = None
    source: str | None = None

    class Config:
        from_attributes = True


class AttendeeUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    ticket_name: str | None = None


class CodeOut(BaseModel):
    id: int
    code: str
    url: str
    status: str

    class Config:
        from_attributes = True


class CodeUpdate(BaseModel):
    code: str | None = None
    url: str | None = None


class MappingRow(BaseModel):
    attendee_id: int
    name: str
    email: str
    code: str | None = None
    url: str | None = None
    status: str  # mapped / unmapped
    code_id: int | None = None


class ImportResult(BaseModel):
    imported: int
    updated: int
    skipped: int
    total_rows: int
    errors: list[str] = []
    preview: list[dict] = []


class MapCreditsResult(BaseModel):
    newly_assigned: int
    total_mapped: int
    unmapped_attendees: list[AttendeeOut] = []
    unused_codes: list[CodeOut] = []


class ReassignRequest(BaseModel):
    attendee_id: int
    code_id: int


class Stats(BaseModel):
    total_attendees: int
    total_codes: int
    assigned_codes: int
    remaining_codes: int
    redeemed_codes: int


class AuditLogOut(BaseModel):
    id: int
    actor_email: str | None = None
    action: str
    entity: str | None = None
    entity_id: str | None = None
    detail: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True
