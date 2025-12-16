"""Add detailed forensic classification fields

Revision ID: 001_detailed_classification
Revises:
Create Date: 2024-12-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_detailed_classification'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the pattern_subtype enum type
    pattern_subtype_enum = sa.Enum(
        'plain_arch', 'tented_arch',
        'ulnar_loop', 'radial_loop', 'central_pocket_loop', 'double_loop', 'nutant_loop',
        'plain_whorl', 'central_pocket_whorl', 'double_loop_whorl', 'accidental_whorl', 'composite_whorl',
        'unknown', 'scarred', 'amputated', 'bandaged',
        name='patternsubtype'
    )
    pattern_subtype_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to fingerprints table
    op.add_column('fingerprints', sa.Column('pattern_subtype', sa.Enum(
        'plain_arch', 'tented_arch',
        'ulnar_loop', 'radial_loop', 'central_pocket_loop', 'double_loop', 'nutant_loop',
        'plain_whorl', 'central_pocket_whorl', 'double_loop_whorl', 'accidental_whorl', 'composite_whorl',
        'unknown', 'scarred', 'amputated', 'bandaged',
        name='patternsubtype'
    ), nullable=True))

    # FBI/NCIC Classification codes
    op.add_column('fingerprints', sa.Column('ncic_code', sa.String(2), nullable=True))
    op.add_column('fingerprints', sa.Column('henry_value', sa.Integer(), nullable=True))
    op.add_column('fingerprints', sa.Column('ridge_count', sa.Integer(), nullable=True))
    op.add_column('fingerprints', sa.Column('core_count', sa.Integer(), nullable=True))
    op.add_column('fingerprints', sa.Column('delta_count', sa.Integer(), nullable=True))

    # Singular points (JSON with coordinates)
    op.add_column('fingerprints', sa.Column('core_positions', sa.JSON(), nullable=True))
    op.add_column('fingerprints', sa.Column('delta_positions', sa.JSON(), nullable=True))

    # Minutiae summary
    op.add_column('fingerprints', sa.Column('minutiae_count', sa.Integer(), nullable=True))
    op.add_column('fingerprints', sa.Column('minutiae_details', sa.JSON(), nullable=True))

    # Ridge flow characteristics
    op.add_column('fingerprints', sa.Column('ridge_flow_direction', sa.String(), nullable=True))
    op.add_column('fingerprints', sa.Column('ridge_density', sa.Float(), nullable=True))

    # Forensic examiner notes
    op.add_column('fingerprints', sa.Column('examiner_notes', sa.Text(), nullable=True))
    op.add_column('fingerprints', sa.Column('manual_override', sa.Boolean(), default=False))


def downgrade() -> None:
    # Remove columns from fingerprints table
    op.drop_column('fingerprints', 'manual_override')
    op.drop_column('fingerprints', 'examiner_notes')
    op.drop_column('fingerprints', 'ridge_density')
    op.drop_column('fingerprints', 'ridge_flow_direction')
    op.drop_column('fingerprints', 'minutiae_details')
    op.drop_column('fingerprints', 'minutiae_count')
    op.drop_column('fingerprints', 'delta_positions')
    op.drop_column('fingerprints', 'core_positions')
    op.drop_column('fingerprints', 'delta_count')
    op.drop_column('fingerprints', 'core_count')
    op.drop_column('fingerprints', 'ridge_count')
    op.drop_column('fingerprints', 'henry_value')
    op.drop_column('fingerprints', 'ncic_code')
    op.drop_column('fingerprints', 'pattern_subtype')

    # Drop the enum type
    sa.Enum(name='patternsubtype').drop(op.get_bind(), checkfirst=True)
