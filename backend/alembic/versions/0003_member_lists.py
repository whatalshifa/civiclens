"""seats from an official member list: no result date, and a reason when vacant

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-09 15:06:25.901761
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("representatives", "elected_on", existing_type=sa.DATE(), nullable=True)
    op.add_column("constituencies", sa.Column("vacancy", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("constituencies", "vacancy")
    op.execute("DELETE FROM representatives WHERE elected_on IS NULL")
    op.alter_column("representatives", "elected_on", existing_type=sa.DATE(), nullable=False)
