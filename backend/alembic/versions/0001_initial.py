"""create sources, places, representatives and laws

Revision ID: 0001
Revises: 
Create Date: 2026-10-09 08:47:08.927740
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = '0001'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('data_versions',
    sa.Column('name', sa.String(length=40), nullable=False),
    sa.Column('digest', sa.String(length=64), nullable=False),
    sa.Column('loaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('name')
    )
    op.create_table('sources',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('title', sa.Text(), nullable=False),
    sa.Column('publisher', sa.Text(), nullable=False),
    sa.Column('url', sa.Text(), nullable=False),
    sa.Column('published_on', sa.Date(), nullable=True),
    sa.Column('note', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('acts',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('title', sa.Text(), nullable=False),
    sa.Column('short_name', sa.Text(), nullable=False),
    sa.Column('year', sa.Integer(), nullable=False),
    sa.Column('citation', sa.Text(), nullable=False),
    sa.Column('unit', sa.String(length=10), nullable=False),
    sa.Column('summary', sa.Text(), nullable=False),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.Column('source_id', sa.String(length=80), nullable=False),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('constituencies',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('house', sa.String(length=20), nullable=False),
    sa.Column('name', sa.Text(), nullable=False),
    sa.Column('state', sa.Text(), nullable=False),
    sa.Column('reserved_for', sa.String(length=10), nullable=True),
    sa.Column('source_id', sa.String(length=80), nullable=False),
    sa.CheckConstraint("house IN ('lok_sabha', 'vidhan_sabha')", name='house_known'),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('pincodes',
    sa.Column('pin', sa.String(length=6), nullable=False),
    sa.Column('area', sa.Text(), nullable=False),
    sa.Column('district', sa.Text(), nullable=False),
    sa.Column('state', sa.Text(), nullable=False),
    sa.Column('source_id', sa.String(length=80), nullable=False),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ),
    sa.PrimaryKeyConstraint('pin')
    )
    op.create_table('law_sections',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('act_id', sa.String(length=80), nullable=False),
    sa.Column('number', sa.String(length=20), nullable=False),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.Column('title', sa.Text(), nullable=False),
    sa.Column('summary', sa.Text(), nullable=False),
    sa.Column('keywords', sa.Text(), nullable=False),
    sa.Column('official_text', sa.Text(), nullable=True),
    sa.Column('search', postgresql.TSVECTOR(), sa.Computed("setweight(to_tsvector('simple', number), 'A') || setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', keywords), 'A') || setweight(to_tsvector('english', summary), 'B') || setweight(to_tsvector('english', coalesce(official_text, '')), 'C')", persisted=True), nullable=False),
    sa.ForeignKeyConstraint(['act_id'], ['acts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('act_id', 'number')
    )
    op.create_index('law_sections_search', 'law_sections', ['search'], unique=False, postgresql_using='gin')
    op.create_table('pincode_constituencies',
    sa.Column('pin', sa.String(length=6), nullable=False),
    sa.Column('constituency_id', sa.String(length=80), nullable=False),
    sa.Column('partial', sa.Boolean(), nullable=False),
    sa.Column('source_id', sa.String(length=80), nullable=False),
    sa.ForeignKeyConstraint(['constituency_id'], ['constituencies.id'], ),
    sa.ForeignKeyConstraint(['pin'], ['pincodes.pin'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ),
    sa.PrimaryKeyConstraint('pin', 'constituency_id')
    )
    op.create_table('representatives',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('constituency_id', sa.String(length=80), nullable=False),
    sa.Column('name', sa.Text(), nullable=False),
    sa.Column('party', sa.Text(), nullable=False),
    sa.Column('elected_in', sa.Text(), nullable=False),
    sa.Column('elected_on', sa.Date(), nullable=False),
    sa.Column('source_id', sa.String(length=80), nullable=False),
    sa.ForeignKeyConstraint(['constituency_id'], ['constituencies.id'], ),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('constituency_id')
    )
    op.create_table('representative_facts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('representative_id', sa.String(length=80), nullable=False),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.Column('label', sa.Text(), nullable=False),
    sa.Column('value', sa.Text(), nullable=False),
    sa.Column('as_of', sa.Date(), nullable=True),
    sa.Column('source_id', sa.String(length=80), nullable=False),
    sa.ForeignKeyConstraint(['representative_id'], ['representatives.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('representative_facts')
    op.drop_table('representatives')
    op.drop_table('pincode_constituencies')
    op.drop_index('law_sections_search', table_name='law_sections', postgresql_using='gin')
    op.drop_table('law_sections')
    op.drop_table('pincodes')
    op.drop_table('constituencies')
    op.drop_table('acts')
    op.drop_table('sources')
    op.drop_table('data_versions')
