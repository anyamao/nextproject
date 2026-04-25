"""add_lesson_views

Revision ID: b9a6d298914e
Revises:
Create Date: 2026-04-25 17:24:00.111372

"""

from alembic import op
import sqlalchemy as sa

revision = "b9a6d298914e"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ✅ Для SQLite ОБЯЗАТЕЛЬНО используем batch_alter_table
    with op.batch_alter_table("lessons", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("view_count", sa.Integer(), nullable=True, server_default="0")
        )

    # ✅ Создаём таблицу lesson_views
    op.create_table(
        "lesson_views",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False
        ),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column(
            "viewed_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.UniqueConstraint("lesson_id", "user_id", name="uq_lesson_view_user"),
        sa.UniqueConstraint("lesson_id", "session_id", name="uq_lesson_view_anon"),
    )


def downgrade() -> None:
    with op.batch_alter_table("lessons", schema=None) as batch_op:
        batch_op.drop_column("view_count")

    op.drop_table("lesson_views")
