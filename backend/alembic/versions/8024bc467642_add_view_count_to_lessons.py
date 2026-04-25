"""add view_count to lessons

Revision ID: 8024bc467642
Revises: b9a6d298914e
Create Date: 2026-04-25 17:25:58.814525

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8024bc467642'
down_revision: Union[str, Sequence[str], None] = 'b9a6d298914e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
