#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests==2.34.2", "psycopg[binary]==3.2.13"]
# ///
"""Copy the scrutins tables (CAP, CCP, CST) of a list of Grist documents into PostgreSQL. See README.md."""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone

import psycopg
import requests
from psycopg import sql
from psycopg.types.json import Jsonb

from config import (
    COL_DEPARTMENT,
    DATETIME_COLUMNS,
    DB_TABLE_PREFIX,
    DEFAULT_UUID_COLUMN,
    PAUSE_SECONDS,
    SERVER,
    SYNC_CRON_TABLE,
    SYNC_DOCUMENTS_TABLE,
    SYNC_LOG_TABLE,
    TABLE_PAUSE_SECONDS,
    TABLES,
    TIMEOUT,
)

log = logging.getLogger("sync_to_postgresql")

# Columns added by the sync to every table, before the Grist columns
SYNC_COLUMNS = ["department", "uuid", "grist_id", "synced_at"]


# --- Database ------------------------------------------------------------------


def open_db(url):
    # autocommit: each query commits on its own, unless it runs in a `with conn.transaction()` block.
    return psycopg.connect(url, autocommit=True)


def reconnect_if_needed(conn, url):
    """Return a working connection: `conn`, or a new one if it is missing, closed or lost (database restart…)."""
    if conn is not None and not conn.closed and not conn.broken:
        return conn
    if conn is not None:
        log.warning("  database connection lost, reconnecting")
        conn.close()
    return open_db(url)


def load_tables(conn):
    """Read the columns of the tables created by setup-database.

    Return {scrutin type: {column: PostgreSQL type}}, e.g. {"CAP": {"uuid": "text", "Inscrits": "bigint", …}}.
    Raise ValueError listing the missing tables.
    """
    names = [table_name(scrutin_type) for scrutin_type in TABLES.values()]
    rows = conn.execute(
        """
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = ANY(%s)
        ORDER BY table_name, ordinal_position
        """,
        (names + [SYNC_LOG_TABLE, SYNC_DOCUMENTS_TABLE, SYNC_CRON_TABLE],),
    ).fetchall()
    columns = {}
    for table, column, data_type in rows:
        columns.setdefault(table, {})[column] = data_type
    required = names + [SYNC_LOG_TABLE, SYNC_DOCUMENTS_TABLE, SYNC_CRON_TABLE]
    missing = [name for name in required if name not in columns]
    if missing:
        raise ValueError(f"table(s) {', '.join(missing)} not found: create them with scripts/setup-database")
    return {scrutin_type: columns[table_name(scrutin_type)] for scrutin_type in TABLES.values()}


def load_documents(conn, group):
    """Return the documents to sync of a cron group: {doc_id: (department, cron group, Grist department id)}.

    A document is synced if it is enabled in sync_documents and its cron group is enabled in sync_cron.
    The Grist department id is the row id of the department in Referentiel_departements, used to filter the rows.
    """
    query = sql.SQL(
        "SELECT d.doc_id, d.department, d.cron_group, d.grist_department_id FROM {documents} d "
        "JOIN {cron} c ON c.cron_group = d.cron_group "
        "WHERE d.enabled AND c.enabled AND d.cron_group = %s ORDER BY d.department"
    ).format(documents=sql.Identifier(SYNC_DOCUMENTS_TABLE), cron=sql.Identifier(SYNC_CRON_TABLE))
    rows = conn.execute(query, (group,)).fetchall()
    return {doc_id: (department, cron_group, grist_id) for doc_id, department, cron_group, grist_id in rows}


def is_group_enabled(conn, group):
    """Return True if the cron group is enabled in sync_cron, False if disabled, None if it is not there."""
    query = sql.SQL("SELECT enabled FROM {} WHERE cron_group = %s").format(sql.Identifier(SYNC_CRON_TABLE))
    row = conn.execute(query, (group,)).fetchone()
    return row[0] if row else None


def is_document_enabled(conn, doc_id):
    """True if the document is enabled in sync_documents (it can be switched off during a run).

    A document removed from sync_documents counts as disabled.
    """
    query = sql.SQL("SELECT enabled FROM {} WHERE doc_id = %s").format(sql.Identifier(SYNC_DOCUMENTS_TABLE))
    row = conn.execute(query, (doc_id,)).fetchone()
    return bool(row and row[0])


def write_sync_log(conn, department, scrutin_type, status, message):
    """Add an entry to the sync log: status "success" or "error", with the counts or the reason of the failure.

    A failure here (no connection…) is logged but does not stop the sync.
    """
    if conn is None or conn.broken:
        log.error("  cannot write the sync log: no database connection")
        return
    query = sql.SQL(
        "INSERT INTO {} (synced_at, department, table_name, status, message) VALUES (%s, %s, %s, %s, %s)"
    ).format(sql.Identifier(SYNC_LOG_TABLE))
    try:
        conn.execute(query, (datetime.now(timezone.utc), department, table_name(scrutin_type), status, message))
    except psycopg.Error as exc:
        log.error("  cannot write the sync log: %s", exc)


def table_name(scrutin_type):
    return f"{DB_TABLE_PREFIX}{scrutin_type.lower()}"


# --- Grist ---------------------------------------------------------------------


def fetch_records(session, doc_id, table, filters=None):
    """Fetch the records of a table, optionally filtered: {column id: [allowed values]}."""
    params = {"filter": json.dumps(filters)} if filters else None
    response = session.get(f"{SERVER}/api/docs/{doc_id}/tables/{table}/records", params=params, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()["records"]


def describe_error(exc):
    if isinstance(exc, requests.HTTPError):
        return f"HTTP {exc.response.status_code}: {exc.response.text[:200]}"
    return str(exc)


# --- Types: Grist -> PostgreSQL ------------------------------------------------


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def datetime_to_text(value):
    """Grist DateTime (seconds since 1970) -> "2024-11-19 07:06:40" (UTC). None if it is not a valid date."""
    if not is_number(value):
        return None
    try:
        return datetime.fromtimestamp(value, timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    except (OverflowError, OSError, ValueError):  # absurd number
        return None


def to_postgres(value, column_type):
    """Convert a Grist value for a PostgreSQL column type (as in information_schema, e.g. "bigint").

    Values that don't fit (Grist errors…) become None.
    """
    if value is None:
        return None
    if column_type == "jsonb":
        if isinstance(value, list) and value[:1] == ["L"]:
            value = value[1:]  # Grist lists are ["L", item1, item2, …]
        return Jsonb(value)
    if isinstance(value, list):  # Grist encoded values (errors, objects…) in a non-list column
        return None
    if column_type == "boolean":
        return value if isinstance(value, bool) else None
    if column_type == "bigint":
        return int(value) if is_number(value) and float(value).is_integer() else None
    if column_type == "integer":  # Ref: 0 means "no reference"
        return int(value) if is_number(value) and float(value).is_integer() and value != 0 else None
    if column_type in ("double precision", "real", "numeric"):
        return float(value) if is_number(value) else None
    return value if isinstance(value, str) else str(value)  # text


# --- Rows ----------------------------------------------------------------------


def check_uuid_column(records, scrutin_type, uuid_column):
    """Raise ValueError if the table returned rows but none has a UUID (column missing or renamed in Grist).

    Without this check, every row would be skipped, and all the stored rows of the department deleted.
    An empty table is fine: the department has no scrutin of this type.
    """
    if records and not any(record["fields"].get(uuid_column) for record in records):
        raise ValueError(f"{scrutin_type}: no row has a {uuid_column} (column missing or renamed?)")


def extract_rows(records, columns, scrutin_type, uuid_column):
    """Return {uuid: (grist id, {column: value})}. Rows without UUID and duplicate UUIDs are skipped."""
    grist_columns = {column: column_type for column, column_type in columns.items() if column not in SYNC_COLUMNS}
    rows = {}
    for record in records:
        fields = record["fields"]
        uuid = fields.get(uuid_column)
        if not uuid:
            log.warning("  %s row id=%s has no %s, skipped", scrutin_type, record["id"], uuid_column)
            continue
        if uuid in rows:
            log.warning("  duplicate %s %s (%s row id=%s), only the first row is kept",
                        uuid_column, uuid, scrutin_type, record["id"])
            continue
        values = {}
        for column, column_type in grist_columns.items():
            value = fields.get(column)
            if column in DATETIME_COLUMNS:
                value = datetime_to_text(value)
            values[column] = to_postgres(value, column_type)
        rows[uuid] = (record["id"], values)
    return rows


def store_rows(conn, scrutin_type, columns, department, rows, synced_at):
    """Upsert the rows of one department in one table and delete the ones gone from Grist.

    Only the rows of this department are read, changed or deleted. Return (added, updated, deleted).
    """
    table = sql.Identifier(table_name(scrutin_type))
    existing = {uuid for (uuid,) in conn.execute(
        sql.SQL("SELECT uuid FROM {} WHERE department = %s").format(table), (department,)
    )}

    # Every row is written with the new synced_at: insert, or update if the uuid already exists.
    names = list(columns)
    if rows:
        upsert = sql.SQL("INSERT INTO {table} ({columns}) VALUES ({values}) "
                         "ON CONFLICT (uuid) DO UPDATE SET {updates}").format(
            table=table,
            columns=sql.SQL(", ").join(map(sql.Identifier, names)),
            values=sql.SQL(", ").join(sql.Placeholder() * len(names)),
            updates=sql.SQL(", ").join(
                sql.SQL("{0} = EXCLUDED.{0}").format(sql.Identifier(name)) for name in names if name != "uuid"
            ),
        )
        sync_values = {"department": department, "synced_at": synced_at}
        params = [
            [{**values, **sync_values, "uuid": uuid, "grist_id": grist_id}.get(name) for name in names]
            for uuid, (grist_id, values) in rows.items()
        ]
        with conn.cursor() as cursor:
            cursor.executemany(upsert, params)

    # Rows of this department gone from Grist.
    deleted = list(existing - rows.keys())
    if deleted:
        conn.execute(sql.SQL("DELETE FROM {} WHERE uuid = ANY(%s)").format(table), (deleted,))
    added = len(rows.keys() - existing)
    return added, len(rows) - added, len(deleted)


# --- Run -----------------------------------------------------------------------


def sync_table(session, conn, columns, doc_id, department, grist_department_id, grist_table, scrutin_type,
               uuid_column):
    """Fetch one Grist table of a document and write it to PostgreSQL, in its own transaction.

    Return a summary of the changes, e.g. "12 added, 3 updated, 0 deleted".
    """
    # Only the rows of the department given for this document are fetched.
    filters = {COL_DEPARTMENT: [grist_department_id]}
    records = fetch_records(session, doc_id, grist_table, filters)
    synced_at = datetime.now(timezone.utc)

    check_uuid_column(records, scrutin_type, uuid_column)
    rows = extract_rows(records, columns, scrutin_type, uuid_column)
    with conn.transaction():  # commit on success, rollback on error: the table keeps its previous rows
        counts = store_rows(conn, scrutin_type, columns, department, rows, synced_at)
    summary = "%d added, %d updated, %d deleted" % counts
    log.info("  %s: %s", scrutin_type, summary)
    return summary


def pause(seconds, before):
    """Wait between two Grist calls, to avoid overloading the Grist server."""
    log.info("Pause %ss before %s", seconds, before)
    time.sleep(seconds)


def sync_all_documents(session, database_url, tables, docs, uuid_column):
    """Sync every table of every document (as returned by load_documents), one table at a time.

    Each attempt is recorded in the sync log table. A failed table does not stop the others: if the database
    connection is lost, the next table reconnects. A document switched off skips its other tables; a cron
    group switched off stops the run. Return the number of failed tables.
    """
    doc_ids = list(docs)
    started = time.monotonic()
    failures = 0
    conn = None
    stopped = False
    try:
        for index, doc_id in enumerate(doc_ids, start=1):
            if stopped:
                break
            department, group, grist_department_id = docs[doc_id]
            pause(PAUSE_SECONDS, f"document {doc_id}")
            log.info("[%d/%d] %s (department %s)", index, len(doc_ids), doc_id, department)
            for grist_table, scrutin_type in TABLES.items():
                pause(TABLE_PAUSE_SECONDS, f"table {scrutin_type}")
                try:
                    conn = reconnect_if_needed(conn, database_url)
                    if not is_group_enabled(conn, group):
                        log.warning("  cron group switched off in %s: the run is stopped", SYNC_CRON_TABLE)
                        stopped = True
                        break
                    if not is_document_enabled(conn, doc_id):
                        log.warning("  %s switched off in %s: its other tables are skipped", doc_id,
                                    SYNC_DOCUMENTS_TABLE)
                        break
                    summary = sync_table(session, conn, tables[scrutin_type], doc_id, department,
                                         grist_department_id, grist_table, scrutin_type, uuid_column)
                except (requests.RequestException, ValueError, KeyError, psycopg.Error) as exc:
                    reason = describe_error(exc)
                    log.error("  %s failed: %s (previous data kept)", scrutin_type, reason)
                    write_sync_log(conn, department, scrutin_type, "error", reason)
                    failures += 1
                else:
                    write_sync_log(conn, department, scrutin_type, "success", summary)
    finally:
        if conn is not None:
            conn.close()

    log.info("Sync done in %.0fs: %d failed table(s), see %s", time.monotonic() - started, failures, SYNC_LOG_TABLE)
    return failures


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Copy the scrutins tables (CAP, CCP, CST) of a list of Grist documents into PostgreSQL."
    )
    parser.add_argument("--group", type=int, required=True,
                        help=f"Cron group to sync: the documents of this cron_group in {SYNC_DOCUMENTS_TABLE}")
    parser.add_argument("--uuid-column", default=DEFAULT_UUID_COLUMN,
                        help=f"Column holding the row UUID (default: {DEFAULT_UUID_COLUMN})")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    api_key = os.environ.get("GRIST_API_KEY")
    if not api_key:
        log.error("GRIST_API_KEY environment variable is not set")
        return 2

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        log.error("DATABASE_URL environment variable is not set")
        return 2

    try:
        with open_db(database_url) as conn:
            tables = load_tables(conn)
            group_enabled = is_group_enabled(conn, args.group)
            docs = load_documents(conn, args.group)
    except psycopg.Error as exc:
        log.error("Cannot connect to the database: %s", exc)
        return 2
    except ValueError as exc:
        log.error("%s", exc)
        return 2

    if group_enabled is None:
        log.error("Cron group %s not found in %s", args.group, SYNC_CRON_TABLE)
        return 2
    if not group_enabled:
        log.info("Cron group %s is disabled in %s: nothing to sync", args.group, SYNC_CRON_TABLE)
        return 0
    if not docs:
        log.info("No enabled document in %s (group %s): nothing to sync", SYNC_DOCUMENTS_TABLE, args.group)
        return 0
    log.info("%d enabled document(s) in %s (group %s)", len(docs), SYNC_DOCUMENTS_TABLE, args.group)

    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {api_key}"
    failures = sync_all_documents(session, database_url, tables, docs, args.uuid_column)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
