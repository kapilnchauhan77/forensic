"""add_multiple_fingerprints_field

Revision ID: 32746ab1d59f
Revises: 001_detailed_classification
Create Date: 2026-01-03 12:46:23.705348

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '32746ab1d59f'
down_revision: Union[str, None] = '001_detailed_classification'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('fingerprints', sa.Column('multiple_fingerprints', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('fingerprints', 'multiple_fingerprints')
