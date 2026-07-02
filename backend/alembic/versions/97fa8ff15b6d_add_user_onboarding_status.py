"""add user onboarding status

Revision ID: 97fa8ff15b6d
Revises: 41cda8ff25b4
Create Date: 2026-07-03 01:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '97fa8ff15b6d'
down_revision: Union[str, Sequence[str], None] = '41cda8ff25b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the onboarding status columns to the user table
    op.add_column('user', sa.Column('has_uploaded_data', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('user', sa.Column('has_processed_data', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('user', sa.Column('has_explored_insights', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    # Remove the onboarding status columns from the user table
    op.drop_column('user', 'has_explored_insights')
    op.drop_column('user', 'has_processed_data')
    op.drop_column('user', 'has_uploaded_data')
