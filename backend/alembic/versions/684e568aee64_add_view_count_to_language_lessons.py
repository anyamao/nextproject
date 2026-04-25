"""Add view_count to language_lessons

Revision ID: 684e568aee64
Revises: 04622ae22990
Create Date: 2026-04-25 23:27:27.889914

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '684e568aee64'
down_revision: Union[str, Sequence[str], None] = '04622ae22990'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
