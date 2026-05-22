"""add_document_category_and_references

Revision ID: 002_add_doc_category
Revises: 001_add_workflow_tables
Create Date: 2026-05-20 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '002_add_doc_category'
down_revision: Union[str, Sequence[str], None] = '001_add_workflow_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('tender_id', sa.UUID(), nullable=True))
    op.add_column('documents', sa.Column('bid_id', sa.UUID(), nullable=True))
    op.add_column('documents', sa.Column('order_id', sa.UUID(), nullable=True))
    op.add_column('documents', sa.Column('category', sa.Enum('requisition_user_docs', 'internal_approval_docs', 'tender_document', 'tender_vetted_docs', 'bid_documents', 'technical_evaluation', 'technical_query_sheet', 'commercial_evaluation', 'commercial_query_sheet', 'revised_evaluation', 'comparative_statement', 'price_bid_docs', 'negotiation_docs', 'tender_committee_docs', 'order_documents', 'contract_document', 'security_deposit', 'execution_docs', 'other', name='document_category'), server_default='other', nullable=True))
    op.add_column('documents', sa.Column('description', sa.String(255), nullable=True))
    
    op.create_index('ix_documents_tender_id', 'documents', ['tender_id'])
    op.create_index('ix_documents_bid_id', 'documents', ['bid_id'])
    op.create_index('ix_documents_order_id', 'documents', ['order_id'])


def downgrade() -> None:
    op.drop_index('ix_documents_order_id', 'documents')
    op.drop_index('ix_documents_bid_id', 'documents')
    op.drop_index('ix_documents_tender_id', 'documents')
    op.drop_column('documents', 'description')
    op.drop_column('documents', 'category')
    op.drop_column('documents', 'order_id')
    op.drop_column('documents', 'bid_id')
    op.drop_column('documents', 'tender_id')