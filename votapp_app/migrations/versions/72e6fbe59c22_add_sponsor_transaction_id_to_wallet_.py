"""add sponsor_transaction_id to wallet_movements

Revision ID: 72e6fbe59c22
Revises: 7ecb97d1b1f8
Create Date: 2026-03-27 10:51:18.126322
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "72e6fbe59c22"
down_revision: Union[str, Sequence[str], None] = "7ecb97d1b1f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column(
        "wallet_movements",
        sa.Column("sponsor_transaction_id", sa.Integer(), sa.ForeignKey("sponsor_transactions.id"))
    )

def downgrade() -> None:
    op.drop_column("wallet_movements", "sponsor_transaction_id")
