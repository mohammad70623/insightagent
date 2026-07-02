"""update session title uniqueness

Revision ID: 41cda8ff25b4
Revises: 30bca9ff25a3
Create Date: 2026-07-02 22:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '41cda8ff25b4'
down_revision: Union[str, Sequence[str], None] = '30bca9ff25a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the old unique constraint that blocks soft-deleted titles
    op.drop_constraint('uq_user_session_title', 'chat_session', type_='unique')
    
    # Create a PostgreSQL partial unique index for active sessions only
    op.create_index(
        'uq_user_session_title_active',
        'chat_session',
        ['user_id', 'title'],
        unique=True,
        postgresql_where=sa.text('deleted_at IS NULL')
    )


def downgrade() -> None:
    # Drop the partial unique index
    op.drop_index(
        'uq_user_session_title_active',
        table_name='chat_session',
        postgresql_where=sa.text('deleted_at IS NULL')
    )
    
    # Restore the original global unique constraint
    op.create_unique_constraint('uq_user_session_title', 'chat_session', ['user_id', 'title'])
