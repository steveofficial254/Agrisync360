"""empty message

Revision ID: 71608a0cf559
Revises: add_otp_type_column, b1c2d3e4f5g6
Create Date: 2026-05-19 15:50:12.666514

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '71608a0cf559'
down_revision = ('add_otp_type_column', 'b1c2d3e4f5g6')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
