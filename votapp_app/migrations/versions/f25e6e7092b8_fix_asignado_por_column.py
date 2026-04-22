"""fix asignado_por column

Revision ID: f25e6e7092b8
Revises: b40a297f07a3

Create Date: 2026-04-22 10:07:51.236091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f25e6e7092b8'
down_revision = 'b40a297f07a3'
branch_labels = None
depends_on = None



def upgrade() -> None:
    op.add_column(
        'surveys_simple',
        sa.Column('asignado_por', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_asignado_por', 'surveys_simple', 'usuarios',
        ['asignado_por'], ['id']
    )

def downgrade() -> None:
    op.drop_constraint('fk_asignado_por', 'surveys_simple', type_='foreignkey')
    op.drop_column('surveys_simple', 'asignado_por')
