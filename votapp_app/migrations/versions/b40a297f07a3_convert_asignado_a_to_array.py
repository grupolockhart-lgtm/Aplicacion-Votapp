"""convert asignado_a to ARRAY

Revision ID: b40a297f07a3
Revises: 94d52e2f4031
Create Date: 2026-04-21 16:40:13.750685

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql 

# revision identifiers, used by Alembic.
revision: str = 'b40a297f07a3'
down_revision: Union[str, Sequence[str], None] = '94d52e2f4031'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Elimina la foreign key existente
    op.drop_constraint('surveys_simple_asignado_a_fkey', 'surveys_simple', type_='foreignkey')

    # Convierte la columna a ARRAY(Integer)
    op.alter_column(
        'surveys_simple',
        'asignado_a',
        type_=postgresql.ARRAY(sa.Integer),
        postgresql_using='ARRAY[asignado_a]',
        existing_type=sa.Integer
    )


def downgrade() -> None:
    op.alter_column(
        'surveys_simple',
        'asignado_a',
        type_=sa.Integer,
        postgresql_using='asignado_a[1]',
        existing_type=postgresql.ARRAY(sa.Integer)
    )

    # Recrea la foreign key
    op.create_foreign_key(
        'surveys_simple_asignado_a_fkey',
        'surveys_simple',
        'usuarios',
        ['asignado_a'],
        ['id']
    )