from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database import get_db
from backend.models import Certification, UserCertification, User
from backend.schemas import CertificationRead, UserCertCreate, UserCertUpdate, UserCertRead
from backend.auth import get_current_user

router = APIRouter(prefix="/api", tags=["certifications"])

CERT_SEED_DATA = [
    ('정보보안기사',               '국내자격증',  '한국산업인력공단'),
    ('정보보안산업기사',            '국내자격증',  '한국산업인력공단'),
    ('ISMS-P 심사원',              '국내자격증',  '한국인터넷진흥원(KISA)'),
    ('CISSP',                     '해외자격증',  'ISC²'),
    ('CISA',                      '해외자격증',  'ISACA'),
    ('CISM',                      '해외자격증',  'ISACA'),
    ('CEH',                       '해외자격증',  'EC-Council'),
    ('CompTIA Security+',         '해외자격증',  'CompTIA'),
    ('OSCP',                      '침투테스트',  'Offensive Security'),
    ('eJPT',                      '침투테스트',  'eLearnSecurity'),
    ('PNPT',                      '침투테스트',  'TCM Security'),
    ('AWS Security Specialty',    '클라우드보안', 'Amazon Web Services'),
    ('CCSP',                      '클라우드보안', 'ISC²'),
    ('ISO 27001 Lead Auditor',    '거버넌스',    'PECB / BSI'),
    ('ISO 27001 Lead Implementer','거버넌스',    'PECB / BSI'),
]


async def seed_certifications(db: AsyncSession) -> None:
    count = (await db.execute(select(func.count()).select_from(Certification))).scalar()
    if count == 0:
        for name, category, issuer in CERT_SEED_DATA:
            db.add(Certification(name=name, category=category, issuer=issuer))
        await db.commit()


@router.get("/certifications", response_model=list[CertificationRead])
async def list_certifications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certification).order_by(Certification.category, Certification.name))
    return result.scalars().all()


@router.get("/user-certifications", response_model=list[UserCertRead])
async def list_user_certs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserCertification)
        .where(UserCertification.user_id == current_user.id)
        .order_by(UserCertification.created_at.desc())
    )
    return result.scalars().all()


@router.post("/user-certifications", response_model=UserCertRead, status_code=status.HTTP_201_CREATED)
async def create_user_cert(
    body: UserCertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = UserCertification(user_id=current_user.id, **body.model_dump())
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    return cert


@router.put("/user-certifications/{cert_id}", response_model=UserCertRead)
async def update_user_cert(
    cert_id: str,
    body: UserCertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = (await db.execute(
        select(UserCertification).where(
            UserCertification.id == cert_id,
            UserCertification.user_id == current_user.id,
        )
    )).scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="자격증을 찾을 수 없습니다.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(cert, field, value)
    cert.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(cert)
    return cert


@router.delete("/user-certifications/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_cert(
    cert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = (await db.execute(
        select(UserCertification).where(
            UserCertification.id == cert_id,
            UserCertification.user_id == current_user.id,
        )
    )).scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="자격증을 찾을 수 없습니다.")
    await db.delete(cert)
    await db.commit()
