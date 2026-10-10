"""count the citations each assistant run kept, for the public accuracy page

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-10 05:20:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("assistant_runs", sa.Column("citations", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("assistant_runs", "citations")
