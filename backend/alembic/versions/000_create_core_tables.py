"""create_core_tables

Revision ID: 000_create_core_tables
Revises:
Create Date: 2026-05-20 21:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "000_create_core_tables"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- departments (no circular FK yet) ---
    op.create_table(
        "departments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("description", sa.Text(), server_default=""),
        sa.Column("hod_user_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("code"),
    )

    # --- users (FK to departments added after departments exists) ---
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("employee_id", sa.String(50), nullable=True),
        sa.Column("contact", sa.String(20), nullable=True),
        sa.Column(
            "designation",
            sa.Enum(
                "Officer",
                "Senior Officer",
                "Manager",
                "Senior Manager",
                "Chief Manager",
                "Dy. General Manager",
                "General Manager",
                "Chief General Manager",
                name="designation",
            ),
            nullable=True,
        ),
        sa.Column("avatar", sa.String(500), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column(
            "role",
            sa.Enum(
                "indentor",
                "hod",
                "cnp_hod",
                "procurement_officer",
                "inventory_manager",
                "oic",
                "admin",
                name="user_role",
            ),
            nullable=False,
        ),
        sa.Column("department_id", sa.UUID(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("employee_id"),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    # --- Add hod_user_id FK on departments now that users exists ---
    op.create_foreign_key(
        "fk_departments_hod_user_id",
        "departments",
        "users",
        ["hod_user_id"],
        ["id"],
    )

    # --- vendors ---
    op.create_table(
        "vendors",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("contact_person", sa.String(255), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column(
            "status",
            sa.Enum("Active", "Inactive", name="vendor_status"),
            server_default="Active",
        ),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- tenders (FK to requisitions added later) ---
    op.create_table(
        "tenders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tender_no", sa.String(50), nullable=False),
        sa.Column("requisition_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "published",
                "bidding",
                "evaluating",
                "awarded",
                "closed",
                "cancelled",
                name="tender_status",
            ),
            server_default="draft",
        ),
        sa.Column("issue_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closing_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("evaluation_method", sa.String(100), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tender_no"),
    )

    # --- requisitions (FK to tenders added after tenders exists) ---
    op.create_table(
        "requisitions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("requisition_no", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "submitted",
                "under_review",
                "returned",
                "pending_inventory",
                "inventory_checked",
                "processing",
                "tender_awaiting",
                "tender_awarded",
                "order_created",
                "shipped",
                "receiving",
                "inspection_pending",
                "completed",
                "cancelled",
                name="requisition_status",
            ),
            server_default="draft",
        ),
        sa.Column(
            "priority",
            sa.Enum("High", "Medium", "Low", name="priority"),
            server_default="Medium",
        ),
        sa.Column("creator_id", sa.UUID(), nullable=False),
        sa.Column("current_owner_id", sa.UUID(), nullable=True),
        sa.Column("department_id", sa.UUID(), nullable=False),
        sa.Column("quantity", sa.Integer(), server_default=sa.text("1")),
        sa.Column("unit_price_estimate", sa.Float(), nullable=True),
        sa.Column("total_estimate", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(10), server_default="USD"),
        sa.Column("required_by_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("justification", sa.Text(), nullable=True),
        sa.Column("specifications", sa.Text(), nullable=True),
        sa.Column(
            "hodi_cnp_approval",
            sa.Enum(
                "Pending",
                "Approved",
                "Returned",
                "Rejected",
                name="hodi_cnp_approval",
            ),
            server_default="Pending",
        ),
        sa.Column(
            "inventory_check_status",
            sa.Enum(
                "NotChecked",
                "Available",
                "Surplus",
                "Ordered",
                "Required",
                name="inventory_check_status",
            ),
            server_default="NotChecked",
        ),
        sa.Column(
            "procurement_method",
            sa.Enum(
                "Direct",
                "Tender",
                name="procurement_method",
            ),
            nullable=True,
        ),
        sa.Column("tender_id", sa.UUID(), nullable=True),
        sa.Column("financial_year", sa.String(20), nullable=True),
        sa.Column("sap_requisition_number", sa.String(8), nullable=True),
        sa.Column("requisition_create_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "requisition_hod_release_date", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column("job_description", sa.String(300), nullable=True),
        sa.Column("cost_estimate", sa.Float(), nullable=True),
        sa.Column("startup_applicable", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("sector", sa.String(100), nullable=True),
        sa.Column("contract_period_months", sa.Integer(), nullable=True),
        sa.Column("integrity_pact", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("file_reference", sa.String(100), nullable=True),
        sa.Column("return_reason", sa.Text(), nullable=True),
        sa.Column(
            "returned_to_indentor", sa.Boolean(), server_default=sa.text("false")
        ),
        sa.Column(
            "assigned_to_procurement", sa.Boolean(), server_default=sa.text("false")
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("requisition_no"),
        sa.UniqueConstraint("file_reference"),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["current_owner_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
    )
    op.create_index(
        "ix_requisitions_requisition_no", "requisitions", ["requisition_no"]
    )
    op.create_index(
        "ix_requisitions_sap_requisition_number",
        "requisitions",
        ["sap_requisition_number"],
    )
    op.create_index(
        "ix_requisitions_file_reference", "requisitions", ["file_reference"]
    )

    # --- Add requisition_id FK on tenders ---
    op.create_foreign_key(
        "fk_tenders_requisition_id",
        "tenders",
        "requisitions",
        ["requisition_id"],
        ["id"],
    )

    # --- Add tender_id FK on requisitions ---
    op.create_foreign_key(
        "fk_requisitions_tender_id",
        "requisitions",
        "tenders",
        ["tender_id"],
        ["id"],
    )

    # --- bids ---
    op.create_table(
        "bids",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tender_id", sa.UUID(), nullable=False),
        sa.Column("vendor_id", sa.UUID(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(10), server_default="USD"),
        sa.Column("validity_days", sa.Integer(), nullable=True),
        sa.Column("technical_score", sa.Float(), nullable=True),
        sa.Column("financial_score", sa.Float(), nullable=True),
        sa.Column("total_score", sa.Float(), nullable=True),
        sa.Column("is_awarded", sa.Boolean(), server_default=sa.text("false")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["tender_id"], ["tenders.id"]),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendors.id"]),
    )

    # --- orders ---
    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_no", sa.String(50), nullable=False),
        sa.Column("requisition_id", sa.UUID(), nullable=True),
        sa.Column("tender_id", sa.UUID(), nullable=True),
        sa.Column("vendor_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "approved",
                "issued",
                "shipped",
                "delivered",
                "received",
                "cancelled",
                name="order_status",
            ),
            server_default="draft",
        ),
        sa.Column("quantity", sa.Integer(), server_default=sa.text("1")),
        sa.Column("unit_price", sa.Float(), nullable=True),
        sa.Column("total_amount", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(10), server_default="USD"),
        sa.Column("order_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_address", sa.Text(), nullable=True),
        sa.Column("payment_terms", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_no"),
        sa.ForeignKeyConstraint(["requisition_id"], ["requisitions.id"]),
        sa.ForeignKeyConstraint(["tender_id"], ["tenders.id"]),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendors.id"]),
    )
    op.create_index("ix_orders_order_no", "orders", ["order_no"])

    # --- post_orders ---
    op.create_table(
        "post_orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("requisition_id", sa.UUID(), nullable=True),
        sa.Column("received_quantity", sa.Integer(), nullable=True),
        sa.Column("ordered_quantity", sa.Integer(), nullable=True),
        sa.Column(
            "quality_status",
            sa.Enum(
                "Pending",
                "Passed",
                "Failed",
                "Partial",
                name="quality_status",
            ),
            server_default="Pending",
        ),
        sa.Column("inspection_notes", sa.Text(), nullable=True),
        sa.Column("discrepancy_description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending_inspection",
                "in_progress",
                "passed",
                "failed",
                "discrepancy",
                "completed",
                name="post_order_status",
            ),
            server_default="pending_inspection",
        ),
        sa.Column("received_by", sa.UUID(), nullable=True),
        sa.Column("received_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["requisition_id"], ["requisitions.id"]),
        sa.ForeignKeyConstraint(["received_by"], ["users.id"]),
    )

    # --- messages ---
    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("receiver_id", sa.UUID(), nullable=True),
        sa.Column("requisition_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["receiver_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["requisition_id"], ["requisitions.id"]),
    )

    # --- activity_logs ---
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("requisition_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["requisition_id"], ["requisitions.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index(
        "ix_activity_logs_requisition_id", "activity_logs", ["requisition_id"]
    )
    op.create_index("ix_activity_logs_created_at", "activity_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("activity_logs")
    op.drop_table("messages")
    op.drop_table("post_orders")
    op.drop_table("orders")
    op.drop_table("bids")
    op.drop_table("requisitions")
    op.drop_table("tenders")
    op.drop_table("vendors")
    op.drop_table("users")
    op.drop_table("departments")
