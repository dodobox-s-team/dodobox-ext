import os

from databases import Database
from sqlalchemy import MetaData

db = Database(os.environ["DATABASE_URL"])
metadata = MetaData()
