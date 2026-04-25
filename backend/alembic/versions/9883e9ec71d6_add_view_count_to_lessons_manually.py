"""add view_count to lessons manually

Revision ID: 9883e9ec71d6
Revises: 8024bc467642
Create Date: 2026-04-25 17:27:30.570689

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9883e9ec71d6"
down_revision: Union[str, Sequence[str], None] = "8024bc467642"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ✅ Для SQLite используем batch_alter_table
    with op.batch_alter_table("lessons", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("view_count", sa.Integer(), nullable=True, server_default="0")
        )


def downgrade() -> None:
    with op.batch_alter_table("lessons", schema=None) as batch_op:
        batch_op.drop_column("view_count")
