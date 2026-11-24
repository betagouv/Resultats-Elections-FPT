"""Settings of setup_database.py. See README.md."""

import os

# SQL file creating the tables of the sync
SCHEMA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
