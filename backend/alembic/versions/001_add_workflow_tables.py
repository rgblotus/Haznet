"""add_workflow_tables

Revision ID: 001_add_workflow_tables
Revises: 
Create Date: 2026-05-20 21:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '001_add_workflow_tables'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'requisition_stage_history',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('requisition_id', sa.UUID(), nullable=False),
        sa.Column('stage', sa.Enum('draft', 'submitted', 'internal_approval', 'tender_creation', 'tender_evaluation', 'post_tender', 'order_created', 'contract_executed', 'completed', 'cancelled', name='requisition_stage'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'in_progress', 'clarification_required', 'completed', 'rejected', name='internal_approval_status'), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_by', sa.UUID(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_requisition_stage_history_requisition_id', 'requisition_stage_history', ['requisition_id'])

    op.create_table(
        'internal_approval_details',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('requisition_id', sa.UUID(), nullable=False),
        sa.Column('checklist_completed', sa.Boolean(), default=False),
        sa.Column('checklist_completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('checklist_completed_by', sa.UUID(), nullable=True),
        sa.Column('checklist_notes', sa.Text(), nullable=True),
        sa.Column('clarification_required', sa.Boolean(), default=False),
        sa.Column('clarification_sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('clarification_response', sa.Text(), nullable=True),
        sa.Column('clarification_responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tender_committee_recommendation', sa.Text(), nullable=True),
        sa.Column('tender_committee_recommended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tender_committee_recommended_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_internal_approval_details_requisition_id', 'internal_approval_details', ['requisition_id'])

    op.create_table(
        'tender_process',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tender_id', sa.UUID(), nullable=False),
        sa.Column('pre_bid_meeting_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('pre_bid_meeting_venue', sa.String(255), nullable=True),
        sa.Column('pre_bid_meeting_minutes', sa.Text(), nullable=True),
        sa.Column('bid_creation_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('bid_opening_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('bid_closing_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('document_vetting_done', sa.Boolean(), default=False),
        sa.Column('document_vetted_by', sa.UUID(), nullable=True),
        sa.Column('document_vetted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tender_process_tender_id', 'tender_process', ['tender_id'])

    op.create_table(
        'tender_evaluation',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tender_id', sa.UUID(), nullable=False),
        sa.Column('stage', sa.Enum('bid_opening', 'technical_evaluation', 'commercial_evaluation', 'clarifications', 'revised_evaluation', 'final_technical', 'final_commercial', 'price_bid_opening', 'comparative_statement', 'negotiation', 'tender_committee_recommendation', 'order_placement', name='tender_evaluation_stage'), nullable=False),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('technical_query_raised', sa.Boolean(), default=False),
        sa.Column('technical_query_sheet', sa.Text(), nullable=True),
        sa.Column('technical_query_raised_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('commercial_query_raised', sa.Boolean(), default=False),
        sa.Column('commercial_query_sheet', sa.Text(), nullable=True),
        sa.Column('commercial_query_raised_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('clarification_response_received', sa.Boolean(), default=False),
        sa.Column('clarification_response_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revised_evaluation_done', sa.Boolean(), default=False),
        sa.Column('revised_evaluation_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('final_score', sa.Float(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_by', sa.UUID(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tender_evaluation_tender_id', 'tender_evaluation', ['tender_id'])

    op.create_table(
        'bid_evaluation_details',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('bid_id', sa.UUID(), nullable=False),
        sa.Column('tender_evaluation_id', sa.UUID(), nullable=True),
        sa.Column('technical_score', sa.Float(), nullable=True),
        sa.Column('technical_evaluated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('technical_evaluated_by', sa.UUID(), nullable=True),
        sa.Column('technical_remarks', sa.Text(), nullable=True),
        sa.Column('commercial_score', sa.Float(), nullable=True),
        sa.Column('commercial_evaluated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('commercial_evaluated_by', sa.UUID(), nullable=True),
        sa.Column('commercial_remarks', sa.Text(), nullable=True),
        sa.Column('is_technically_qualified', sa.Boolean(), default=False),
        sa.Column('is_commercially_acceptable', sa.Boolean(), default=False),
        sa.Column('is_final_recommended', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_bid_evaluation_details_bid_id', 'bid_evaluation_details', ['bid_id'])
    op.create_index('ix_bid_evaluation_details_tender_evaluation_id', 'bid_evaluation_details', ['tender_evaluation_id'])

    op.create_table(
        'comparative_statements',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tender_id', sa.UUID(), nullable=False),
        sa.Column('statement_data', sa.Text(), nullable=False),
        sa.Column('vetted', sa.Boolean(), default=False),
        sa.Column('vetted_by', sa.UUID(), nullable=True),
        sa.Column('vetted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('vetting_remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_comparative_statements_tender_id', 'comparative_statements', ['tender_id'])

    op.create_table(
        'tender_negotiations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tender_id', sa.UUID(), nullable=False),
        sa.Column('bid_id', sa.UUID(), nullable=False),
        sa.Column('negotiation_notes', sa.Text(), nullable=True),
        sa.Column('final_negotiated_price', sa.Float(), nullable=True),
        sa.Column('negotiated_by', sa.UUID(), nullable=True),
        sa.Column('negotiated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('accounts_consulted', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tender_negotiations_tender_id', 'tender_negotiations', ['tender_id'])

    op.create_table(
        'tender_committee_recommendations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tender_id', sa.UUID(), nullable=False),
        sa.Column('recommendation_type', sa.String(100), nullable=False),
        sa.Column('recommended_bid_id', sa.UUID(), nullable=True),
        sa.Column('recommended_vendor_name', sa.String(255), nullable=True),
        sa.Column('recommended_amount', sa.Float(), nullable=True),
        sa.Column('recommendation_text', sa.Text(), nullable=True),
        sa.Column('recommended_by', sa.UUID(), nullable=True),
        sa.Column('recommended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved', sa.Boolean(), default=False),
        sa.Column('approved_by', sa.UUID(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tender_committee_recommendations_tender_id', 'tender_committee_recommendations', ['tender_id'])

    op.create_table(
        'order_execution_details',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('bidder_accepted', sa.Boolean(), default=False),
        sa.Column('bidder_accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('contract_signed', sa.Boolean(), default=False),
        sa.Column('contract_signed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('contract_document_path', sa.String(500), nullable=True),
        sa.Column('security_deposit_submitted', sa.Boolean(), default=False),
        sa.Column('security_deposit_amount', sa.Float(), nullable=True),
        sa.Column('security_deposit_submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('security_deposit_details', sa.Text(), nullable=True),
        sa.Column('forwarded_to_engineer', sa.Boolean(), default=False),
        sa.Column('forwarded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('engineer_in_charge_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_order_execution_details_order_id', 'order_execution_details', ['order_id'])

    op.create_table(
        'tender_cancellations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tender_id', sa.UUID(), nullable=False),
        sa.Column('requisition_id', sa.UUID(), nullable=True),
        sa.Column('reason', sa.Enum('technical_rejection', 'budget_constraint', 'no_bids_received', 'l1_backout', 'administrative', 'other', name='tender_cancellation_reason'), nullable=False),
        sa.Column('cancellation_notes', sa.Text(), nullable=True),
        sa.Column('l1_backout', sa.Boolean(), default=False),
        sa.Column('new_lowest_bid_id', sa.UUID(), nullable=True),
        sa.Column('cancelled_by', sa.UUID(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('requisition_status_after', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tender_cancellations_tender_id', 'tender_cancellations', ['tender_id'])
    op.create_index('ix_tender_cancellations_requisition_id', 'tender_cancellations', ['requisition_id'])


def downgrade() -> None:
    op.drop_table('tender_cancellations')
    op.drop_table('order_execution_details')
    op.drop_table('tender_committee_recommendations')
    op.drop_table('tender_negotiations')
    op.drop_table('comparative_statements')
    op.drop_table('bid_evaluation_details')
    op.drop_table('tender_evaluation')
    op.drop_table('tender_process')
    op.drop_table('internal_approval_details')
    op.drop_table('requisition_stage_history')