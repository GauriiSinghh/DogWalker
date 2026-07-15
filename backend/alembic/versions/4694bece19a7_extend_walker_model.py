"""extend_walker_model

Revision ID: 4694bece19a7
Revises: 
Create Date: 2026-07-12 06:12:20.751837

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4694bece19a7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema and backfill data."""
    op.add_column('walkers', sa.Column('mobile_number', sa.String(), nullable=True))
    op.add_column('walkers', sa.Column('email', sa.String(), nullable=True))
    op.add_column('walkers', sa.Column('hashed_password', sa.String(), nullable=True))
    op.add_column('walkers', sa.Column('address', sa.String(), nullable=True))
    op.add_column('walkers', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))
    
    # Create index on email before backfilling or after
    op.create_index(op.f('ix_walkers_email'), 'walkers', ['email'], unique=True)
    
    # Backfill data for pre-existing walkers
    op.execute(
        "UPDATE walkers SET "
        "mobile_number = mobile, "
        "email = LOWER(REPLACE(name, ' ', '')) || '@example.com', "
        "hashed_password = '$2b$10$ekOidczlhSn0tXMm0vOAdOvSmRR6lOTaHh/ZdPZ4.pR5nA71bbxCS', "
        "address = 'Default Address' "
        "WHERE email IS NULL"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_walkers_email'), table_name='walkers')
    op.drop_column('walkers', 'is_active')
    op.drop_column('walkers', 'address')
    op.drop_column('walkers', 'hashed_password')
    op.drop_column('walkers', 'email')
    op.drop_column('walkers', 'mobile_number')

