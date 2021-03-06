"""Add domain's ip

Revision ID: 2710366d3d68
Revises: 43b883c483b4
Create Date: 2021-12-22 03:19:46.487228

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = '2710366d3d68'
down_revision = '43b883c483b4'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('domains', sa.Column('ipv4', sa.String(), nullable=False))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('domains', 'ipv4')
    # ### end Alembic commands ###
