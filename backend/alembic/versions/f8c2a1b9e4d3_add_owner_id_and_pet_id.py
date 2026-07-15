"""add_owner_id_and_pet_id

Revision ID: f8c2a1b9e4d3
Revises: 4694bece19a7
Create Date: 2026-07-14 07:15:00.000000

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f8c2a1b9e4d3"
down_revision: Union[str, Sequence[str], None] = "4694bece19a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _backfill_uuid_column(table: str, column: str) -> None:
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(f"SELECT id FROM {table} WHERE {column} IS NULL")
    ).fetchall()
    for (row_id,) in rows:
        conn.execute(
            sa.text(f"UPDATE {table} SET {column} = :value WHERE id = :id"),
            {"value": str(uuid.uuid4()), "id": row_id},
        )


def upgrade() -> None:
    """Add owner_id and pet_id UUID columns with backfill."""
    op.add_column("users", sa.Column("owner_id", sa.UUID(), nullable=True))
    op.add_column("pets", sa.Column("pet_id", sa.UUID(), nullable=True))

    _backfill_uuid_column("users", "owner_id")
    _backfill_uuid_column("pets", "pet_id")

    op.alter_column("users", "owner_id", nullable=False)
    op.alter_column("pets", "pet_id", nullable=False)
    op.create_unique_constraint("uq_users_owner_id", "users", ["owner_id"])
    op.create_unique_constraint("uq_pets_pet_id", "pets", ["pet_id"])


def downgrade() -> None:
    """Remove owner_id and pet_id columns."""
    op.drop_constraint("uq_pets_pet_id", "pets", type_="unique")
    op.drop_constraint("uq_users_owner_id", "users", type_="unique")
    op.drop_column("pets", "pet_id")
    op.drop_column("users", "owner_id")
