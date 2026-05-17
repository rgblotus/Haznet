"""add_requisition_new_fields

Revision ID: 554086bae434
Revises: 32b05bd65709
Create Date: 2026-05-17 19:01:56.028674

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '554086bae434'
down_revision: Union[str, None] = '32b05bd65709'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('requisitions', sa.Column('financial_year', sa.String(20), nullable=True))
    op.add_column('requisitions', sa.Column('sap_requisition_number', sa.String(8), nullable=True))
    op.add_column('requisitions', sa.Column('requisition_create_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('requisitions', sa.Column('requisition_hod_release_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('requisitions', sa.Column('job_description', sa.String(300), nullable=True))
    op.add_column('requisitions', sa.Column('cost_estimate', sa.Float(), nullable=True))
    op.add_column('requisitions', sa.Column('startup_applicable', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('requisitions', sa.Column('industry', sa.String(100), nullable=True))
    op.add_column('requisitions', sa.Column('sector', sa.String(100), nullable=True))
    op.add_column('requisitions', sa.Column('contract_period_months', sa.Integer(), nullable=True))
    op.add_column('requisitions', sa.Column('integrity_pact', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('requisitions', sa.Column('file_reference', sa.String(100), nullable=True))
    
    op.create_index('ix_requisitions_sap_requisition_number', 'requisitions', ['sap_requisition_number'])
    op.create_index('ix_requisitions_file_reference', 'requisitions', ['file_reference'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_requisitions_file_reference', 'requisitions')
    op.drop_index('ix_requisitions_sap_requisition_number', 'requisitions')
    op.drop_column('requisitions', 'file_reference')
    op.drop_column('requisitions', 'integrity_pact')
    op.drop_column('requisitions', 'contract_period_months')
    op.drop_column('requisitions', 'sector')
    op.drop_column('requisitions', 'industry')
    op.drop_column('requisitions', 'startup_applicable')
    op.drop_column('requisitions', 'cost_estimate')
    op.drop_column('requisitions', 'job_description')
    op.drop_column('requisitions', 'requisition_hod_release_date')
    op.drop_column('requisitions', 'requisition_create_date')
    op.drop_column('requisitions', 'sap_requisition_number')
    op.drop_column('requisitions', 'financial_year')
