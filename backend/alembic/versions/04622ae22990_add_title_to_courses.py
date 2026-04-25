"""add title to courses

Revision ID: 04622ae22990
Revises: 9883e9ec71d6
Create Date: 2026-04-25 20:27:15.617533

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '04622ae22990'
down_revision: Union[str, Sequence[str], None] = '9883e9ec71d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
