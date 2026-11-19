#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests==2.34.2"]
# ///
"""Restore Grist attachments into a list of documents from a .tar archive. See README.md."""

import argparse
import logging
import os
import sys
import tarfile

import requests

log = logging.getLogger("restore_attachments")

CHECK_TIMEOUT = 30
UPLOAD_TIMEOUT = 600
SERVER = "https://grist.numerique.gouv.fr"


def read_doc_ids(path):
    """Read one doc id per line, skipping blank lines and duplicates."""
    with open(path, encoding="utf-8") as f:
        return list(dict.fromkeys(line.strip() for line in f if line.strip()))


def check_doc(session, server, doc_id):
    """Check the doc exists and is accessible. Return its name, raise on failure."""
    response = session.get(f"{server}/api/docs/{doc_id}", timeout=CHECK_TIMEOUT)
    response.raise_for_status()
    return response.json().get("name", "?")


def _count(value):
    """Response fields may be counts or lists; normalise to an int."""
    if isinstance(value, (list, tuple, set, dict)):
        return len(value)
    return value if isinstance(value, int) else 0


def restore_archive(session, server, doc_id, archive_path):
    """Upload the archive to the doc. Return the JSON result, raise on failure."""
    with open(archive_path, "rb") as fh:
        response = session.post(
            f"{server}/api/docs/{doc_id}/attachments/archive",
            files={"upload": (os.path.basename(archive_path), fh, "application/x-tar")},
            timeout=UPLOAD_TIMEOUT,
        )
    response.raise_for_status()
    return response.json()


def describe_error(exc):
    if isinstance(exc, requests.HTTPError):
        return f"HTTP {exc.response.status_code}: {exc.response.text[:200]}"
    return str(exc)


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Upload a Grist attachments .tar archive into a list of documents."
    )
    parser.add_argument("--docs", required=True, help="Text file with one docId per line")
    parser.add_argument("--archive", required=True, help="Attachments .tar archive")
    parser.add_argument("--dry-run", action="store_true", help="Only check access to each doc, upload nothing")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    api_key = os.environ.get("GRIST_API_KEY")
    if not api_key:
        log.error("GRIST_API_KEY environment variable is not set")
        return 2

    if not os.path.isfile(args.archive) or not tarfile.is_tarfile(args.archive):
        log.error("Archive not found or not a valid tar file: %s", args.archive)
        return 2

    doc_ids = read_doc_ids(args.docs)
    if not doc_ids:
        log.error("No docId found in %s", args.docs)
        return 2

    server = SERVER
    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {api_key}"

    failures = []  # (doc_id, reason)
    for index, doc_id in enumerate(doc_ids, start=1):
        log.info("[%d/%d] %s", index, len(doc_ids), doc_id)
        try:
            log.info("  doc: %s", check_doc(session, server, doc_id))
            if args.dry_run:
                continue
            result = restore_archive(session, server, doc_id, args.archive)
        except (requests.RequestException, ValueError) as exc:
            log.error("  failed: %s", describe_error(exc))
            failures.append((doc_id, describe_error(exc)))
            continue

        log.info("  result: %s", result)
        errored = _count(result.get("errored")) if isinstance(result, dict) else 0
        if errored:
            failures.append((doc_id, f"{errored} file(s) errored: {result}"))

    print()
    print(f"{len(doc_ids) - len(failures)}/{len(doc_ids)} document(s) OK")
    if failures:
        print("\nFailed documents:")
        for doc_id, reason in failures:
            print(f"  {doc_id}: {reason}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
