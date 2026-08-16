"""merge migration heads

Revision ID: f5b24852c2cf
Revises: 5f1a2b3c4d5e, f8c2a1b9e4d3
Create Date: 2026-08-16 18:47:24.647364

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5b24852c2cf'
down_revision: Union[str, Sequence[str], None] = ('5f1a2b3c4d5e', 'f8c2a1b9e4d3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
