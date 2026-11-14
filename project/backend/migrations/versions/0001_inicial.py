"""esquema inicial fadeup

Revision ID: 0001_inicial
Revises:
Create Date: 2026-11-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_inicial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_table(
        "bookings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("token", sa.String(length=72), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("service", sa.String(length=80), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("date", sa.String(length=10), nullable=False),
        sa.Column("start", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="confirmed"),
        sa.Column("kind", sa.String(length=16), nullable=False, server_default="appointment"),
        sa.Column("created", sa.String(length=40), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("bookings_date", "bookings", ["date", "start"])
    op.create_table(
        "occupancy",
        sa.Column("date", sa.String(length=10), nullable=False),
        sa.Column("minute", sa.Integer(), nullable=False),
        sa.Column("booking", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["booking"], ["bookings.id"]),
        sa.PrimaryKeyConstraint("date", "minute"),
    )
    op.create_table(
        "outbox",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("booking", sa.String(length=36), nullable=False),
        sa.Column("type", sa.String(length=24), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("scheduled", sa.String(length=40), nullable=False),
        sa.Column("created", sa.String(length=40), nullable=False),
        sa.ForeignKeyConstraint(["booking"], ["bookings.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("outbox")
    op.drop_table("occupancy")
    op.drop_index("bookings_date", table_name="bookings")
    op.drop_table("bookings")
    op.drop_table("settings")
