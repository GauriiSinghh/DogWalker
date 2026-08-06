"""create_pricing_tables

Revision ID: 5f1a2b3c4d5e
Revises: 4694bece19a7
Create Date: 2026-07-26 14:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5f1a2b3c4d5e'
down_revision = '4694bece19a7'
branch_labels = None
depends_on = None

SERVICES = [
    'walker_pricings',
    'boarding_pricings',
    'grooming_pricings',
    'vet_pricings',
    'vaccination_pricings',
    'pathology_pricings',
    'sitter_pricings',
]


def upgrade() -> None:
    for table_name in SERVICES:
        op.create_table(
            table_name,
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('price', sa.Integer(), nullable=False),
            sa.Column('subscription_price', sa.Integer(), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        idx_name = f"idx_{table_name}_active"
        op.create_index(
            idx_name,
            table_name,
            ['is_active'],
            unique=True,
            postgresql_where=sa.text('is_active = true'),
            sqlite_where=sa.text('is_active = 1'),
        )


def downgrade() -> None:
    for table_name in SERVICES:
        idx_name = f"idx_{table_name}_active"
        op.drop_index(idx_name, table_name=table_name)
        op.drop_table(table_name)
