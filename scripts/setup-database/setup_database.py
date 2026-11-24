#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["psycopg[binary]==3.2.13"]
# ///
"""Create the PostgreSQL tables of the sync from schema.sql. See README.md."""

import logging
import os
import sys

import psycopg

from config import SCHEMA_FILE

log = logging.getLogger("setup_database")


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        log.error("DATABASE_URL environment variable is not set")
        return 2
    with open(SCHEMA_FILE, encoding="utf-8") as f:
        sql = f.read()

    try:
        # One transaction: every table is created, or none.
        with psycopg.connect(database_url) as conn:
            conn.execute(sql)
    except psycopg.Error as exc:
        log.error("Cannot apply %s: %s", os.path.basename(SCHEMA_FILE), exc)
        return 1
    log.info("%s applied", os.path.basename(SCHEMA_FILE))
    return 0


if __name__ == "__main__":
    sys.exit(main())
