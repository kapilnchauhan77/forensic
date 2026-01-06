"""add_oauth_fields_to_users

Revision ID: add_oauth_fields
Revises: 32746ab1d59f
Create Date: 2026-01-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_oauth_fields'
down_revision: Union[str, None] = '32746ab1d59f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the authprovider enum type using raw SQL
    op.execute("CREATE TYPE authprovider AS ENUM ('local', 'google')")

    # Add auth_provider column with default 'local' - cast the default value
    op.execute("ALTER TABLE users ADD COLUMN auth_provider authprovider NOT NULL DEFAULT 'local'::authprovider")

    # Add google_id column (nullable, unique)
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)

    # Add profile_picture column
    op.add_column('users', sa.Column('profile_picture', sa.String(), nullable=True))

    # Make hashed_password nullable (for OAuth-only users)
    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    # Make hashed_password required again
    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=False)

    # Drop profile_picture column
    op.drop_column('users', 'profile_picture')

    # Drop google_id column and index
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_column('users', 'google_id')

    # Drop auth_provider column
    op.drop_column('users', 'auth_provider')

    # Drop the enum type
    op.execute("DROP TYPE authprovider")
