from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, func, cast, Integer, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Requisition, RequisitionStatus, User, UserRole, ActivityLog, Department
)
from app.schemas import RequisitionCreate, RequisitionUpdate, create_pagination_meta


class RequisitionError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


class RequisitionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Permission helpers ─────────────────────────────────────

    @staticmethod
    def can_edit(user: User, req: Requisition) -> bool:
        if user.role == UserRole.ADMIN:
            return True
        if user.role == UserRole.INDENTOR and req.creator_id == user.id:
            return req.status in (RequisitionStatus.DRAFT, RequisitionStatus.RETURNED)
        if user.role in (UserRole.CNP_HOD, UserRole.PROCUREMENT_OFFICER, UserRole.OIC):
            return req.status not in (RequisitionStatus.COMPLETED, RequisitionStatus.CANCELLED)
        return False

    @staticmethod
    def can_view(user: User, req: Requisition) -> bool:
        if user.role in (UserRole.ADMIN, UserRole.OIC):
            return True
        if user.role == UserRole.INDENTOR:
            return req.creator_id == user.id
        if user.role == UserRole.HOD:
            return req.department_id == user.department_id
        if user.role in (UserRole.CNP_HOD, UserRole.PROCUREMENT_OFFICER, UserRole.INVENTORY_MANAGER):
            return True
        return False

    # ── CRUD ───────────────────────────────────────────────────

    async def get_by_id(self, req_id: UUID) -> Requisition | None:
        result = await self.db.execute(select(Requisition).where(Requisition.id == req_id))
        return result.scalar_one_or_none()

    async def list(
        self,
        user: User,
        page: int = 1,
        page_size: int = 20,
        status_filter: str | None = None,
        priority: str | None = None,
        search: str | None = None,
        department_id: str | None = None,
    ):
        query = select(Requisition)
        count_query = select(func.count(Requisition.id))

        if status_filter:
            query = query.where(Requisition.status == RequisitionStatus(status_filter))
            count_query = count_query.where(Requisition.status == RequisitionStatus(status_filter))
        if priority:
            query = query.where(Requisition.priority == priority)
            count_query = count_query.where(Requisition.priority == priority)
        if search:
            search_filter = or_(
                Requisition.title.ilike(f"%{search}%"),
                Requisition.requisition_no.ilike(f"%{search}%"),
                Requisition.description.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        if department_id:
            query = query.where(Requisition.department_id == UUID(department_id))
            count_query = count_query.where(Requisition.department_id == UUID(department_id))

        if user.role == UserRole.INDENTOR:
            query = query.where(Requisition.creator_id == user.id)
            count_query = count_query.where(Requisition.creator_id == user.id)
        elif user.role == UserRole.HOD:
            query = query.where(Requisition.department_id == user.department_id)
            count_query = count_query.where(Requisition.department_id == user.department_id)

        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(Requisition.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(query)).scalars().all()

        return rows, create_pagination_meta(total, page, page_size)

    async def create(self, data: RequisitionCreate, user: User) -> Requisition:
        req_no = await self._gen_requisition_no()
        dept_id = user.department_id
        if not dept_id:
            result = await self.db.execute(
                select(Department).where(Department.name == "Contract & Procurement")
            )
            dep = result.scalar_one_or_none()
            if dep:
                dept_id = dep.id

        title = data.title or (data.job_description[:50] if data.job_description else f"REQ-{data.sap_requisition_number or 'NEW'}")
        description = data.description or data.job_description or ""
        total_estimate = data.total_estimate or data.cost_estimate
        integrity_pact = (data.cost_estimate or 0) > 10_000_000

        file_reference = None
        if data.financial_year and data.sap_requisition_number:
            file_reference = await self._gen_file_reference(data.financial_year, data.sap_requisition_number)

        req = Requisition(
            requisition_no=req_no,
            title=title,
            description=description,
            category=data.category,
            priority=data.priority,
            quantity=data.quantity,
            unit_price_estimate=data.unit_price_estimate,
            total_estimate=total_estimate,
            currency=data.currency,
            required_by_date=data.required_by_date,
            justification=data.justification,
            specifications=data.specifications,
            creator_id=user.id,
            department_id=dept_id,
            current_owner_id=user.id,
            status=RequisitionStatus.DRAFT,
            financial_year=data.financial_year,
            sap_requisition_number=data.sap_requisition_number,
            requisition_create_date=data.requisition_create_date,
            requisition_hod_release_date=data.requisition_hod_release_date,
            job_description=data.job_description,
            cost_estimate=data.cost_estimate,
            startup_applicable=data.startup_applicable,
            industry=data.industry,
            sector=data.sector,
            contract_period_months=data.contract_period_months,
            integrity_pact=integrity_pact,
            file_reference=file_reference,
        )
        self.db.add(req)
        await self.db.flush()
        await self.db.refresh(req)
        await self._log_activity(req.id, user.id, "created", f"Requisition {req_no} created")
        return req

    async def update(self, req: Requisition, data: RequisitionUpdate, user: User) -> Requisition:
        if not self.can_edit(user, req):
            raise RequisitionError("You do not have permission to edit this requisition", 403)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(req, k, v)
        await self.db.flush()
        await self.db.refresh(req)
        return req

    async def delete(self, req: Requisition, user: User) -> None:
        if user.role != UserRole.ADMIN:
            raise RequisitionError("Only administrators can delete requisitions", 403)
        await self.db.delete(req)

    # ── Workflow actions ───────────────────────────────────────

    async def submit(self, req: Requisition, user: User) -> Requisition:
        if req.status not in (RequisitionStatus.DRAFT, RequisitionStatus.RETURNED):
            raise RequisitionError("Can only submit draft or returned requisitions")
        req.status = RequisitionStatus.SUBMITTED
        req.return_reason = None
        req.returned_to_indentor = False
        cnphod = (await self.db.execute(
            select(User).where(User.role == UserRole.CNP_HOD, User.is_active)
        )).scalars().first()
        if cnphod:
            req.current_owner_id = cnphod.id
        await self._log_activity(req.id, user.id, "submitted", "Requisition submitted for review")
        return req

    async def review(self, req: Requisition, user: User, reason: str | None = None) -> Requisition:
        if req.status not in (RequisitionStatus.SUBMITTED, RequisitionStatus.UNDER_REVIEW):
            raise RequisitionError("Requisition is not pending review")
        req.status = RequisitionStatus.UNDER_REVIEW
        req.hodi_cnp_approval = "Approved"
        if reason:
            req.return_reason = reason
        await self._log_activity(req.id, user.id, "reviewed", "Requisition reviewed and approved")
        return req

    async def return_req(self, req: Requisition, user: User, reason: str = "Returned for clarification") -> Requisition:
        await self._log_activity(
            req.id, user.id, "returned", reason,
            old_value=req.status.value, new_value="returned",
        )
        req.status = RequisitionStatus.RETURNED
        req.return_reason = reason
        req.returned_to_indentor = True
        req.current_owner_id = req.creator_id
        return req

    async def assign_to_procurement(self, req: Requisition, user: User, assign_to: UUID | None = None) -> Requisition:
        if req.status not in (RequisitionStatus.SUBMITTED, RequisitionStatus.UNDER_REVIEW):
            raise RequisitionError("Requisition must be under review before assigning")
        if assign_to:
            req.current_owner_id = assign_to
        else:
            po = (await self.db.execute(
                select(User).where(User.role == UserRole.PROCUREMENT_OFFICER, User.is_active)
            )).scalars().first()
            if po:
                req.current_owner_id = po.id
        req.status = RequisitionStatus.PROCESSING
        req.assigned_to_procurement = True
        req.hodi_cnp_approval = "Approved"
        await self._log_activity(req.id, user.id, "assigned", "Requisition assigned to procurement")
        return req

    async def process(self, req: Requisition, user: User) -> Requisition:
        if req.status not in (RequisitionStatus.PROCESSING, RequisitionStatus.UNDER_REVIEW):
            raise RequisitionError("Requisition is not ready for processing")
        await self._log_activity(req.id, user.id, "processing", "Requisition moved to processing")
        req.status = RequisitionStatus.PROCESSING
        req.current_owner_id = user.id
        return req

    async def complete(self, req: Requisition, user: User) -> Requisition:
        if req.status not in (RequisitionStatus.ORDER_CREATED, RequisitionStatus.RECEIVING, RequisitionStatus.INSPECTION_PENDING):
            raise RequisitionError("Requisition is not ready for completion")
        await self._log_activity(req.id, user.id, "completed", "Requisition marked as completed")
        req.status = RequisitionStatus.COMPLETED
        return req

    # ── Activity log ───────────────────────────────────────────

    async def _log_activity(self, req_id: UUID, user_id: UUID, action: str, details: str | None = None, old_value: str | None = None, new_value: str | None = None):
        log = ActivityLog(
            requisition_id=req_id, user_id=user_id, action=action,
            details=details, old_value=old_value, new_value=new_value,
        )
        self.db.add(log)

    async def get_activity(self, req_id: UUID) -> list[dict]:
        query = (
            select(ActivityLog, User.first_name, User.last_name)
            .join(User, ActivityLog.user_id == User.id)
            .where(ActivityLog.requisition_id == req_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(50)
        )
        rows = (await self.db.execute(query)).all()
        return [
            {
                "id": log.id,
                "requisition_id": log.requisition_id,
                "user_id": log.user_id,
                "action": log.action,
                "details": log.details,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "created_at": log.created_at,
                "user_name": f"{first_name} {last_name}" if first_name and last_name else None,
            }
            for log, first_name, last_name in rows
        ]

    # ── Helpers ────────────────────────────────────────────────

    async def _gen_requisition_no(self) -> str:
        result = await self.db.execute(
            select(func.max(cast(func.substring(Requisition.requisition_no, 5), Integer)))
        )
        num = result.scalar() or 0
        return f"REQ-{num + 1:05d}"

    async def _gen_file_reference(self, financial_year: str, sap_req_no: str) -> str:
        year_part = financial_year.replace("FY ", "") if financial_year.startswith("FY ") else financial_year
        result = await self.db.execute(
            select(func.max(cast(func.substring(Requisition.file_reference, -4), Integer)))
            .where(Requisition.file_reference.isnot(None))
        )
        num = result.scalar() or 0
        sequence = num + 1
        if sequence > 1000:
            sequence = 1
        return f"GAIL/HZR/CNP/{year_part}/{sap_req_no}/{sequence:04d}"
