"""add activity logs table

Revision ID: a1b2c3d4e5f6
Revises: 9fbfcaf8fb44
Create Date: $(date +%Y-%m-%d\ %H:%M:%S.%f)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9fbfcaf8fb44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('activity_logs',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('requisition_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('requisitions.id'), nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_activity_logs_requisition_id', 'activity_logs', ['requisition_id'])
    op.create_index('ix_activity_logs_created_at', 'activity_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_activity_logs_created_at', 'activity_logs')
    op.drop_index('ix_activity_logs_requisition_id', 'activity_logs')
    op.drop_table('activity_logs')
