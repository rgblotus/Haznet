from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import (
    User, Requisition, Tender, RequisitionStageHistory, InternalApprovalDetail,
    TenderProcess, TenderEvaluation, BidEvaluationDetail, ComparativeStatement,
    TenderNegotiation, TenderCommitteeRecommendation, OrderExecutionDetail,
    TenderCancellation, ActivityLog, UserRole, RequisitionStatus, TenderStatus
)
from app.schemas import (
    InternalApprovalDetailOut, InternalApprovalDetailUpdate,
    TenderProcessOut, TenderProcessUpdate,
    TenderEvaluationOut, TenderEvaluationCreate, TenderEvaluationUpdate,
    BidEvaluationDetailOut, BidEvaluationDetailUpdate,
    ComparativeStatementOut, ComparativeStatementCreate, ComparativeStatementUpdate,
    TenderNegotiationOut, TenderNegotiationCreate,
    TenderCommitteeRecommendationOut, TenderCommitteeRecommendationCreate,
    OrderExecutionDetailOut, OrderExecutionDetailUpdate,
    TenderCancellationOut, TenderCancellationCreate,
    RequisitionStage, InternalApprovalStatus, TenderEvaluationStage,
    TenderCancellationReason, RequisitionOut,
)
from app.api.requisitions import _log_activity

router = APIRouter()


async def _get_or_create_internal_approval(db: AsyncSession, requisition_id: UUID) -> InternalApprovalDetail:
    result = await db.execute(
        select(InternalApprovalDetail).where(InternalApprovalDetail.requisition_id == requisition_id)
    )
    approval = result.scalar_one_or_none()
    if not approval:
        approval = InternalApprovalDetail(requisition_id=requisition_id)
        db.add(approval)
        await db.flush()
    return approval


async def _get_or_create_tender_process(db: AsyncSession, tender_id: UUID) -> TenderProcess:
    result = await db.execute(
        select(TenderProcess).where(TenderProcess.tender_id == tender_id)
    )
    process = result.scalar_one_or_none()
    if not process:
        process = TenderProcess(tender_id=tender_id)
        db.add(process)
        await db.flush()
    return process


async def _get_or_create_tender_evaluation(db: AsyncSession, tender_id: UUID, stage: TenderEvaluationStage) -> TenderEvaluation:
    result = await db.execute(
        select(TenderEvaluation).where(
            and_(TenderEvaluation.tender_id == tender_id, TenderEvaluation.stage == stage)
        )
    )
    evaluation = result.scalar_one_or_none()
    if not evaluation:
        evaluation = TenderEvaluation(tender_id=tender_id, stage=stage, status="in_progress")
        db.add(evaluation)
        await db.flush()
    return evaluation


@router.get("/requisition/{req_id}/workflow-status")
async def get_workflow_status(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    response = {
        "requisition_id": req_id,
        "current_stage": None,
        "internal_approval": None,
        "tender_process": None,
        "tender_status": req.tender.status if req.tender else None,
        "evaluation_stage": None,
        "comparative_statement_vetted": False,
        "negotiation_done": False,
        "order_placed": False,
        "contract_executed": False,
        "is_cancelled": False,
        "cancellation_reason": None,
    }

    if req.status == RequisitionStatus.CANCELLED:
        response["is_cancelled"] = True
        response["cancellation_reason"] = req.return_reason
        return response

    stage_result = await db.execute(
        select(RequisitionStageHistory)
        .where(RequisitionStageHistory.requisition_id == req_id)
        .order_by(RequisitionStageHistory.started_at.desc())
        .limit(1)
    )
    current_stage = stage_result.scalar_one_or_none()
    if current_stage:
        response["current_stage"] = current_stage.stage

    if req.status in (RequisitionStatus.SUBMITTED, RequisitionStatus.UNDER_REVIEW):
        approval_result = await db.execute(
            select(InternalApprovalDetail).where(InternalApprovalDetail.requisition_id == req_id)
        )
        approval = approval_result.scalar_one_or_none()
        if approval:
            response["internal_approval"] = InternalApprovalDetailOut.model_validate(approval)

    if req.tender:
        tender_process_result = await db.execute(
            select(TenderProcess).where(TenderProcess.tender_id == req.tender.id)
        )
        tender_process = tender_process_result.scalar_one_or_none()
        if tender_process:
            response["tender_process"] = TenderProcessOut.model_validate(tender_process)

        eval_result = await db.execute(
            select(TenderEvaluation)
            .where(TenderEvaluation.tender_id == req.tender.id)
            .order_by(TenderEvaluation.created_at.desc())
            .limit(1)
        )
        evaluation = eval_result.scalar_one_or_none()
        if evaluation:
            response["evaluation_stage"] = evaluation.stage

        cs_result = await db.execute(
            select(ComparativeStatement)
            .where(ComparativeStatement.tender_id == req.tender.id, ComparativeStatement.vetted == True)
        )
        response["comparative_statement_vetted"] = cs_result.scalar_one_or_none() is not None

        neg_result = await db.execute(
            select(TenderNegotiation).where(TenderNegotiation.tender_id == req.tender.id)
        )
        response["negotiation_done"] = neg_result.scalar_one_or_none() is not None

    return response


@router.post("/requisition/{req_id}/internal-approval")
async def update_internal_approval(
    req_id: UUID,
    body: InternalApprovalDetailUpdate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    approval = await _get_or_create_internal_approval(db, req_id)

    if body.checklist_completed is not None:
        approval.checklist_completed = body.checklist_completed
        approval.checklist_completed_at = datetime.now(timezone.utc) if body.checklist_completed else None
        approval.checklist_completed_by = current_user.id if body.checklist_completed else None
        approval.checklist_notes = body.checklist_notes

    if body.clarification_required is not None:
        approval.clarification_required = body.clarification_required
        if body.clarification_required:
            approval.clarification_sent_at = datetime.now(timezone.utc)
        else:
            approval.clarification_response = body.clarification_response
            approval.clarification_responded_at = datetime.now(timezone.utc)

    if body.tender_committee_recommendation is not None:
        approval.tender_committee_recommendation = body.tender_committee_recommendation
        approval.tender_committee_recommended_at = datetime.now(timezone.utc)
        approval.tender_committee_recommended_by = current_user.id

    await db.commit()
    await db.refresh(approval)

    await _log_activity(db, req_id, current_user.id, "internal_approval_updated", "Internal approval details updated")

    return InternalApprovalDetailOut.model_validate(approval)


@router.post("/requisition/{req_id}/move-to-tender-creation")
async def move_to_tender_creation(
    req_id: UUID,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    if req.status not in (RequisitionStatus.SUBMITTED, RequisitionStatus.UNDER_REVIEW, RequisitionStatus.PROCESSING):
        raise HTTPException(400, "Requisition must be in submitted, under review, or processing state")

    approval = await _get_or_create_internal_approval(db, req_id)
    if not approval.checklist_completed:
        raise HTTPException(400, "Checklist must be completed before moving to tender creation")

    stage_history = RequisitionStageHistory(
        requisition_id=req_id,
        stage=RequisitionStage.INTERNAL_APPROVAL,
        status=InternalApprovalStatus.COMPLETED,
        completed_at=datetime.now(timezone.utc),
        completed_by=current_user.id,
    )
    db.add(stage_history)

    req.status = RequisitionStatus.TENDER_AWAITING

    await _log_activity(db, req_id, current_user.id, "internal_approval_completed", "Internal approval completed, moved to tender creation")

    await db.commit()
    await db.refresh(req)
    return RequisitionOut.model_validate(req)


@router.post("/tender/{tender_id}/process")
async def update_tender_process(
    tender_id: UUID,
    body: TenderProcessUpdate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    process = await _get_or_create_tender_process(db, tender_id)

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(process, key, value)

    if body.document_vetting_done:
        process.document_vetted_by = current_user.id
        process.document_vetted_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(process)

    return TenderProcessOut.model_validate(process)


@router.post("/tender/{tender_id}/evaluation")
async def create_tender_evaluation(
    tender_id: UUID,
    body: TenderEvaluationCreate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    evaluation = await _get_or_create_tender_evaluation(db, tender_id, body.stage)

    await db.commit()
    await db.refresh(evaluation)

    await _log_activity(db, tender.requisition_id, current_user.id, "evaluation_started", f"Started {body.stage.value} evaluation")

    return TenderEvaluationOut.model_validate(evaluation)


@router.patch("/tender/{tender_id}/evaluation/{eval_id}")
async def update_tender_evaluation(
    tender_id: UUID,
    eval_id: UUID,
    body: TenderEvaluationUpdate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TenderEvaluation).where(TenderEvaluation.id == eval_id))
    evaluation = result.scalar_one_or_none()
    if not evaluation or evaluation.tender_id != tender_id:
        raise HTTPException(404, "Evaluation not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(evaluation, key, value)

    if body.final_score is not None:
        evaluation.completed_at = datetime.now(timezone.utc)
        evaluation.completed_by = current_user.id

    await db.commit()
    await db.refresh(evaluation)

    tender_result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = tender_result.scalar_one_or_none()
    if tender:
        await _log_activity(db, tender.requisition_id, current_user.id, "evaluation_updated", f"Evaluation stage {evaluation.stage.value} updated")

    return TenderEvaluationOut.model_validate(evaluation)


@router.get("/tender/{tender_id}/evaluations")
async def list_tender_evaluations(
    tender_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TenderEvaluation)
        .where(TenderEvaluation.tender_id == tender_id)
        .order_by(TenderEvaluation.created_at)
    )
    evaluations = result.scalars().all()
    return [TenderEvaluationOut.model_validate(e) for e in evaluations]


@router.post("/bid/{bid_id}/evaluation")
async def evaluate_bid_detail(
    bid_id: UUID,
    body: BidEvaluationDetailUpdate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BidEvaluationDetail).where(BidEvaluationDetail.bid_id == bid_id))
    bid_eval = result.scalar_one_or_none()
    if not bid_eval:
        bid_eval = BidEvaluationDetail(bid_id=bid_id)
        db.add(bid_eval)
        await db.flush()

    if body.technical_score is not None:
        bid_eval.technical_score = body.technical_score
        bid_eval.technical_evaluated_at = datetime.now(timezone.utc)
        bid_eval.technical_evaluated_by = current_user.id
        bid_eval.technical_remarks = body.technical_remarks

    if body.commercial_score is not None:
        bid_eval.commercial_score = body.commercial_score
        bid_eval.commercial_evaluated_at = datetime.now(timezone.utc)
        bid_eval.commercial_evaluated_by = current_user.id
        bid_eval.commercial_remarks = body.commercial_remarks

    if body.is_technically_qualified is not None:
        bid_eval.is_technically_qualified = body.is_technically_qualified

    if body.is_commercially_acceptable is not None:
        bid_eval.is_commercially_acceptable = body.is_commercially_acceptable

    if body.is_final_recommended is not None:
        bid_eval.is_final_recommended = body.is_final_recommended

    await db.commit()
    await db.refresh(bid_eval)

    return BidEvaluationDetailOut.model_validate(bid_eval)


@router.post("/tender/{tender_id}/comparative-statement")
async def create_comparative_statement(
    tender_id: UUID,
    body: ComparativeStatementCreate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    cs = ComparativeStatement(tender_id=tender_id, statement_data=body.statement_data)
    db.add(cs)
    await db.commit()
    await db.refresh(cs)

    tender_result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = tender_result.scalar_one_or_none()
    if tender and tender.requisition_id:
        await _log_activity(db, tender.requisition_id, current_user.id, "comparative_statement_created", "Comparative statement created")

    return ComparativeStatementOut.model_validate(cs)


@router.patch("/comparative-statement/{cs_id}")
async def update_comparative_statement(
    cs_id: UUID,
    body: ComparativeStatementUpdate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ComparativeStatement).where(ComparativeStatement.id == cs_id))
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(404, "Comparative statement not found")

    if body.vetted is not None and body.vetted:
        cs.vetted = True
        cs.vetted_by = current_user.id
        cs.vetted_at = datetime.now(timezone.utc)
        cs.vetting_remarks = body.vetting_remarks

    if body.statement_data is not None:
        cs.statement_data = body.statement_data

    await db.commit()
    await db.refresh(cs)

    tender_result = await db.execute(select(Tender).where(Tender.id == cs.tender_id))
    tender = tender_result.scalar_one_or_none()
    if tender and tender.requisition_id:
        await _log_activity(db, tender.requisition_id, current_user.id, "comparative_statement_vetted", "Comparative statement vetted")

    return ComparativeStatementOut.model_validate(cs)


@router.post("/tender/{tender_id}/negotiation")
async def create_negotiation(
    tender_id: UUID,
    body: TenderNegotiationCreate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    negotiation = TenderNegotiation(
        tender_id=tender_id,
        bid_id=body.bid_id,
        negotiation_notes=body.negotiation_notes,
        final_negotiated_price=body.final_negotiated_price,
        accounts_consulted=body.accounts_consulted or False,
        negotiated_by=current_user.id,
        negotiated_at=datetime.now(timezone.utc),
    )
    db.add(negotiation)
    await db.commit()
    await db.refresh(negotiation)

    if tender.requisition_id:
        await _log_activity(db, tender.requisition_id, current_user.id, "negotiation_completed", "Price negotiation completed")

    return TenderNegotiationOut.model_validate(negotiation)


@router.post("/tender/{tender_id}/recommendation")
async def create_tender_recommendation(
    tender_id: UUID,
    body: TenderCommitteeRecommendationCreate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    recommendation = TenderCommitteeRecommendation(
        tender_id=tender_id,
        recommendation_type=body.recommendation_type,
        recommended_bid_id=body.recommended_bid_id,
        recommended_vendor_name=body.recommended_vendor_name,
        recommended_amount=body.recommended_amount,
        recommendation_text=body.recommendation_text,
        recommended_by=current_user.id,
        recommended_at=datetime.now(timezone.utc),
    )
    db.add(recommendation)
    await db.commit()
    await db.refresh(recommendation)

    if tender.requisition_id:
        await _log_activity(db, tender.requisition_id, current_user.id, "tender_committee_recommendation", f"Tender committee recommendation: {body.recommendation_type}")

    return TenderCommitteeRecommendationOut.model_validate(recommendation)


@router.patch("/recommendation/{rec_id}/approve")
async def approve_recommendation(
    rec_id: UUID,
    current_user: User = Depends(require_role(UserRole.CNP_HOD, UserRole.OIC, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TenderCommitteeRecommendation).where(TenderCommitteeRecommendation.id == rec_id))
    recommendation = result.scalar_one_or_none()
    if not recommendation:
        raise HTTPException(404, "Recommendation not found")

    recommendation.approved = True
    recommendation.approved_by = current_user.id
    recommendation.approved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(recommendation)

    tender_result = await db.execute(select(Tender).where(Tender.id == recommendation.tender_id))
    tender = tender_result.scalar_one_or_none()
    if tender and tender.requisition_id:
        await _log_activity(db, tender.requisition_id, current_user.id, "recommendation_approved", "Tender committee recommendation approved")

    return TenderCommitteeRecommendationOut.model_validate(recommendation)


@router.post("/order/{order_id}/execution-detail")
async def create_order_execution_detail(
    order_id: UUID,
    body: OrderExecutionDetailUpdate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(OrderExecutionDetail).where(OrderExecutionDetail.order_id == order_id))
    detail = result.scalar_one_or_none()
    if not detail:
        detail = OrderExecutionDetail(order_id=order_id)
        db.add(detail)
        await db.flush()

    if body.bidder_accepted is not None and body.bidder_accepted:
        detail.bidder_accepted = True
        detail.bidder_accepted_at = datetime.now(timezone.utc)

    if body.contract_signed is not None and body.contract_signed:
        detail.contract_signed = True
        detail.contract_signed_at = datetime.now(timezone.utc)
        detail.contract_document_path = body.contract_document_path

    if body.security_deposit_submitted is not None and body.security_deposit_submitted:
        detail.security_deposit_submitted = True
        detail.security_deposit_amount = body.security_deposit_amount
        detail.security_deposit_submitted_at = datetime.now(timezone.utc)
        detail.security_deposit_details = body.security_deposit_details

    if body.forwarded_to_engineer is not None and body.forwarded_to_engineer:
        detail.forwarded_to_engineer = True
        detail.forwarded_at = datetime.now(timezone.utc)
        detail.engineer_in_charge_id = body.engineer_in_charge_id

    await db.commit()
    await db.refresh(detail)

    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one_or_none()
    if order and order.requisition_id:
        await _log_activity(db, order.requisition_id, current_user.id, "order_execution_updated", "Order execution detail updated")

    return OrderExecutionDetailOut.model_validate(detail)


@router.post("/tender/{tender_id}/cancel")
async def cancel_tender(
    tender_id: UUID,
    body: TenderCancellationCreate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    cancellation = TenderCancellation(
        tender_id=tender_id,
        requisition_id=body.requisition_id or tender.requisition_id,
        reason=body.reason,
        cancellation_notes=body.cancellation_notes,
        l1_backout=body.l1_backout or False,
        new_lowest_bid_id=body.new_lowest_bid_id,
        cancelled_by=current_user.id,
    )
    db.add(cancellation)

    tender.status = TenderStatus.CANCELLED

    if tender.requisition_id:
        req_result = await db.execute(select(Requisition).where(Requisition.id == tender.requisition_id))
        req = req_result.scalar_one_or_none()
        if req:
            req.status = RequisitionStatus.CANCELLED
            req.return_reason = f"Tender cancelled: {body.reason.value}"
            cancellation.requisition_status_after = RequisitionStatus.CANCELLED.value

        await _log_activity(db, tender.requisition_id, current_user.id, "tender_cancelled", f"Tender cancelled: {body.reason.value}")

    await db.commit()
    await db.refresh(tender)

    return TenderCancellationOut.model_validate(cancellation)


from app.models import Bid, Order


@router.post("/tender/{tender_id}/award-to-l1")
async def award_tender_to_l1(
    tender_id: UUID,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    bids_result = await db.execute(
        select(Bid).where(Bid.tender_id == tender_id).order_by(Bid.amount.asc())
    )
    bids = bids_result.scalars().all()

    if not bids:
        raise HTTPException(400, "No bids found for this tender")

    l1_bid = bids[0]

    for bid in bids:
        bid.is_awarded = False

    l1_bid.is_awarded = True
    tender.status = TenderStatus.AWARDED

    if tender.requisition_id:
        req_result = await db.execute(select(Requisition).where(Requisition.id == tender.requisition_id))
        req = req_result.scalar_one_or_none()
        if req:
            req.status = RequisitionStatus.TENDER_AWARDED

        await _log_activity(db, tender.requisition_id, current_user.id, "tender_awarded", f"Tender awarded to L1 bidder")

    await db.commit()

    return {"message": "Tender awarded to L1 bidder", "bid_id": str(l1_bid.id), "amount": l1_bid.amount}