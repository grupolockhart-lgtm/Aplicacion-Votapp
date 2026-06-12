"""rename usuario_id to sponsor_id in sponsor_transactions

Revision ID: 94d52e2f4031
Revises: 72e6fbe59c22
Create Date: 2026-04-08 01:39:42.802237
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '94d52e2f4031'
down_revision: Union[str, Sequence[str], None] = '72e6fbe59c22'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Renombrar la columna
    op.alter_column(
        "sponsor_transactions",
        "usuario_id",
        new_column_name="sponsor_id"
    )

    # Renombrar la constraint de foreign key
    op.drop_constraint("sponsor_transactions_usuario_id_fkey", "sponsor_transactions", type_="foreignkey")
    op.create_foreign_key(
        "sponsor_transactions_sponsor_id_fkey",
        "sponsor_transactions",
        "usuarios",
        ["sponsor_id"],
        ["id"]
    )


def downgrade() -> None:
    # Revertir cambios
    op.alter_column(
        "sponsor_transactions",
        "sponsor_id",
        new_column_name="usuario_id"
    )

    op.drop_constraint("sponsor_transactions_sponsor_id_fkey", "sponsor_transactions", type_="foreignkey")
    op.create_foreign_key(
        "sponsor_transactions_usuario_id_fkey",
        "sponsor_transactions",
        "usuarios",
        ["usuario_id"],
        ["id"]
    )
