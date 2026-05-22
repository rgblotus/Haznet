"""Tests for the requisition service."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.services.requisition import RequisitionService, RequisitionError
from app.models import RequisitionStatus, UserRole


class TestRequisitionService:
    """Unit tests for RequisitionService."""

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self):
        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        db.execute.return_value = result

        service = RequisitionService(db)
        req = await service.get_by_id(uuid4())
        assert req is None

    @pytest.mark.asyncio
    async def test_get_by_id_found(self):
        mock_req = MagicMock()
        mock_req.id = uuid4()

        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_req
        db.execute.return_value = result

        service = RequisitionService(db)
        req = await service.get_by_id(mock_req.id)
        assert req is not None
        assert req.id == mock_req.id

    @pytest.mark.asyncio
    async def test_submit_wrong_status(self):
        mock_req = MagicMock()
        mock_req.status = RequisitionStatus.COMPLETED

        db = AsyncMock()
        mock_user = MagicMock()
        mock_user.id = uuid4()

        service = RequisitionService(db)
        with pytest.raises(RequisitionError, match="Can only submit draft or returned"):
            await service.submit(mock_req, mock_user)

    @pytest.mark.asyncio
    async def test_submit_success(self):
        mock_req = MagicMock()
        mock_req.status = RequisitionStatus.DRAFT

        db = AsyncMock()
        cnp_result = MagicMock()
        cnp_result.scalars.return_value.first.return_value = None
        db.execute.return_value = cnp_result

        mock_user = MagicMock()
        mock_user.id = uuid4()

        service = RequisitionService(db)
        result = await service.submit(mock_req, mock_user)
        assert result.status == RequisitionStatus.SUBMITTED
        assert result.return_reason is None
        assert result.returned_to_indentor is False

    @pytest.mark.asyncio
    async def test_complete_wrong_status(self):
        mock_req = MagicMock()
        mock_req.status = RequisitionStatus.DRAFT

        db = AsyncMock()
        mock_user = MagicMock()

        service = RequisitionService(db)
        with pytest.raises(RequisitionError, match="not ready for completion"):
            await service.complete(mock_req, mock_user)

    def test_can_edit_admin(self):
        user = MagicMock()
        user.role = UserRole.ADMIN
        req = MagicMock()
        assert RequisitionService.can_edit(user, req) is True

    def test_can_edit_indentor_own_draft(self):
        user = MagicMock()
        user.role = UserRole.INDENTOR
        user.id = uuid4()
        req = MagicMock()
        req.creator_id = user.id
        req.status = RequisitionStatus.DRAFT
        assert RequisitionService.can_edit(user, req) is True

    def test_can_edit_indentor_own_completed(self):
        user = MagicMock()
        user.role = UserRole.INDENTOR
        user.id = uuid4()
        req = MagicMock()
        req.creator_id = user.id
        req.status = RequisitionStatus.COMPLETED
        assert RequisitionService.can_edit(user, req) is False

    def test_can_view_admin(self):
        user = MagicMock()
        user.role = UserRole.ADMIN
        req = MagicMock()
        assert RequisitionService.can_view(user, req) is True

    def test_can_view_indentor_own(self):
        user = MagicMock()
        user.role = UserRole.INDENTOR
        user.id = uuid4()
        req = MagicMock()
        req.creator_id = user.id
        assert RequisitionService.can_view(user, req) is True

    def test_can_view_indentor_other(self):
        user = MagicMock()
        user.role = UserRole.INDENTOR
        user.id = uuid4()
        req = MagicMock()
        req.creator_id = uuid4()
        assert RequisitionService.can_view(user, req) is False
