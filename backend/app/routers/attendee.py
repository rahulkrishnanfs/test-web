from fastapi import APIRouter, Depends

from app.deps import require_attendee
from app.models import Attendee
from app.schemas import AttendeeReferralOut, ReferralOut

router = APIRouter(prefix="/attendee", tags=["attendee"])


@router.get("/me/referral", response_model=AttendeeReferralOut)
def my_referral(attendee: Attendee = Depends(require_attendee)):
    code = attendee.referral_code
    if code is None:
        return AttendeeReferralOut(
            name=attendee.name, email=attendee.email, has_referral=False, referral=None
        )
    return AttendeeReferralOut(
        name=attendee.name,
        email=attendee.email,
        has_referral=True,
        referral=ReferralOut(code=code.code, url=code.url, status=code.status),
    )
