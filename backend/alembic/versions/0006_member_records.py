"""each MP's questions, attendance and MPLADS fund, with the averages for context

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-10 06:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "member_records",
        sa.Column("representative_id", sa.String(length=80), nullable=False),
        sa.Column("as_of", sa.Date(), nullable=False),
        sa.Column("questions", sa.Integer(), nullable=False),
        sa.Column("questions_average", sa.Float(), nullable=False),
        sa.Column("questions_source_id", sa.String(length=80), nullable=False),
        sa.Column("days_signed", sa.Integer(), nullable=True),
        sa.Column("sitting_days", sa.Integer(), nullable=True),
        sa.Column("attendance_average", sa.Float(), nullable=False),
        sa.Column("attendance_source_id", sa.String(length=80), nullable=False),
        sa.Column("fund_allocated", sa.BigInteger(), nullable=True),
        sa.Column("fund_spent", sa.BigInteger(), nullable=True),
        sa.Column("works_recommended", sa.Integer(), nullable=True),
        sa.Column("works_sanctioned", sa.Integer(), nullable=True),
        sa.Column("works_completed", sa.Integer(), nullable=True),
        sa.Column("fund_spent_average", sa.Float(), nullable=False),
        sa.Column("fund_source_id", sa.String(length=80), nullable=False),
        sa.ForeignKeyConstraint(["representative_id"], ["representatives.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["questions_source_id"], ["sources.id"]),
        sa.ForeignKeyConstraint(["attendance_source_id"], ["sources.id"]),
        sa.ForeignKeyConstraint(["fund_source_id"], ["sources.id"]),
        sa.PrimaryKeyConstraint("representative_id"),
    )


def downgrade() -> None:
    op.drop_table("member_records")
