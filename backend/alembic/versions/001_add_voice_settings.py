"""Add voice settings columns to calls table

Revision ID: 001_add_voice_settings
Revises:
Create Date: 2025-01-26
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_voice_settings'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add voice settings columns to calls table
    op.add_column('calls', sa.Column('stability', sa.Float(), nullable=True))
    op.add_column('calls', sa.Column('speed', sa.Float(), nullable=True))
    op.add_column('calls', sa.Column('similarity_boost', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('calls', 'similarity_boost')
    op.drop_column('calls', 'speed')
    op.drop_column('calls', 'stability')
