#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests==2.34.2"]
# ///
"""Check one Grist document before syncing its data. Read-only. See README.md."""

import argparse
import logging
import os
import sys

import requests

from config import (
    COL_DEPARTMENT,
    COL_HAS_PV,
    COL_STATUS,
    COL_VALIDATE_DGCL,
    COL_VALIDATE_PREF,
    DEFAULT_UUID_COLUMN,
    SERVER,
    TABLES,
    TIMEOUT,
)

log = logging.getLogger("verify_data_before_sync")


# --- Grist -----------------------------------------------------------------------


def fetch_doc_name(session, doc_id):
    response = session.get(f"{SERVER}/api/docs/{doc_id}", timeout=TIMEOUT)
    response.raise_for_status()
    return response.json().get("name", "?")


def fetch_records(session, doc_id, table):
    response = session.get(f"{SERVER}/api/docs/{doc_id}/tables/{table}/records", timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()["records"]


def describe_error(exc):
    if isinstance(exc, requests.HTTPError):
        return f"HTTP {exc.response.status_code}: {exc.response.text[:200]}"
    return str(exc)


# --- Checks ----------------------------------------------------------------------
# Each check returns a list of problems (empty if the check passes).


def check_document_access(session, doc_id):
    """The document exists and the API key can read it."""
    try:
        log.info("Document: %s", fetch_doc_name(session, doc_id))
    except requests.RequestException as exc:
        return [f"document not accessible: {describe_error(exc)}"]
    return []


def check_required_columns(session, doc_id, uuid_column):
    """The 3 scrutins tables have all the columns read by the sync."""
    required = [uuid_column, COL_DEPARTMENT, COL_STATUS, COL_HAS_PV, COL_VALIDATE_PREF, COL_VALIDATE_DGCL]
    problems = []
    for table in TABLES:
        response = session.get(f"{SERVER}/api/docs/{doc_id}/tables/{table}/columns", timeout=TIMEOUT)
        response.raise_for_status()
        existing = {column["id"] for column in response.json()["columns"]}
        missing = [column for column in required if column not in existing]
        if missing:
            problems.append(f"column(s) {', '.join(missing)} not found in table {table}")
    return problems


def check_rows_have_uuid(records_by_type, uuid_column):
    """Every row has a UUID (rows without UUID are skipped by the sync)."""
    problems = []
    for scrutin_type, records in records_by_type.items():
        without_uuid = sum(1 for record in records if not record["fields"].get(uuid_column))
        if without_uuid:
            problems.append(f"{scrutin_type}: {without_uuid} row(s) without {uuid_column}")
    return problems


def check_uuids_unique_in_document(records_by_type, uuid_column):
    """No UUID is used twice in the document, across the 3 tables (the sync keeps only the first row)."""
    problems = []
    seen = set()
    for scrutin_type, records in records_by_type.items():
        duplicates = 0
        for record in records:
            uuid = record["fields"].get(uuid_column)
            if not uuid:
                continue
            if uuid in seen:
                duplicates += 1
            seen.add(uuid)
        if duplicates:
            problems.append(f"{scrutin_type}: {duplicates} row(s) with a {uuid_column} already used in the document")
    return problems


# --- Run -------------------------------------------------------------------------


def fetch_scrutins(session, doc_id):
    """Fetch all the rows of the 3 tables. Return {scrutin type: records}."""
    records_by_type = {}
    for table, scrutin_type in TABLES.items():
        records_by_type[scrutin_type] = fetch_records(session, doc_id, table)
        log.info("  %s: %d row(s)", scrutin_type, len(records_by_type[scrutin_type]))
    return records_by_type


def verify_document(session, doc_id, uuid_column, check_uuids):
    """Run the checks on the document. Return its list of problems.

    The checks on the rows (UUIDs) only run with check_uuids, since they fetch all the rows.
    """
    problems = check_document_access(session, doc_id)
    if problems:
        return problems
    problems = check_required_columns(session, doc_id, uuid_column)
    if problems:  # the rows can't be checked without the columns
        return problems

    if check_uuids:
        records_by_type = fetch_scrutins(session, doc_id)
        problems += check_rows_have_uuid(records_by_type, uuid_column)
        problems += check_uuids_unique_in_document(records_by_type, uuid_column)
    return problems


def print_verify_results(doc_id, problems):
    print()
    if problems:
        print(f"Document {doc_id}: {len(problems)} problem(s)")
        for problem in problems:
            print(f"  - {problem}")
    else:
        print(f"Document {doc_id}: OK")


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Check one Grist document before syncing its data (read-only).")
    parser.add_argument("--doc-id", required=True, help="Id of the Grist document to check")
    parser.add_argument("--uuid", action="store_true",
                        help="Also check the rows: every row has a UUID, no UUID used twice (fetches all the rows)")
    parser.add_argument("--uuid-column", default=DEFAULT_UUID_COLUMN, help=f"Column holding the row UUID (default: {DEFAULT_UUID_COLUMN})")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    # Verify the API key
    api_key = os.environ.get("GRIST_API_KEY")
    if not api_key:
        log.error("GRIST_API_KEY environment variable is not set")
        return 2

    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {api_key}"

    # Verify the document content
    try:
        problems = verify_document(session, args.doc_id, args.uuid_column, args.uuid)
    except (requests.RequestException, ValueError, KeyError) as exc:
        problems = [describe_error(exc)]
    for problem in problems:
        log.error("  %s", problem)

    print_verify_results(args.doc_id, problems)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
