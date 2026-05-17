"""add_documents_table

Revision ID: 9fbfcaf8fb44
Revises: 554086bae434
Create Date: 2026-05-17 19:56:02.612074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fbfcaf8fb44'
down_revision: Union[str, None] = '554086bae434'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('documents',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('requisition_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('requisitions.id'), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('uploaded_by', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_documents_requisition_id', 'documents', ['requisition_id'])


def downgrade() -> None:
    op.drop_index('ix_documents_requisition_id', 'documents')
    op.drop_table('documents')
