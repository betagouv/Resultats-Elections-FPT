#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests==2.34.2"]
# ///
"""Restore Grist attachments into a list of documents from a folder of .tar archives. See README.md."""

import argparse
import logging
import os
import sys
import tarfile
import time

import requests

log = logging.getLogger("restore_attachments")

CHECK_TIMEOUT = 30
UPLOAD_TIMEOUT = 600
SERVER = "https://grist.numerique.gouv.fr"
COOLDOWN_SECONDS = 15  # pause between two archive uploads


def read_doc_ids(path):
    """Read one doc id per line, skipping blank lines and duplicates."""
    with open(path, encoding="utf-8") as f:
        return list(dict.fromkeys(line.strip() for line in f if line.strip()))


def list_archives(folder):
    """Return the .tar files of the folder, sorted by name."""
    return [os.path.join(folder, n) for n in sorted(os.listdir(folder)) if n.endswith(".tar")]


def check_doc(session, server, doc_id):
    """Check the doc exists and is accessible. Return its name, raise on failure."""
    response = session.get(f"{server}/api/docs/{doc_id}", timeout=CHECK_TIMEOUT)
    response.raise_for_status()
    return response.json().get("name", "?")


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


def print_script_results(doc_ids, failures):
    """Print how many docs are OK, then each failure (doc_id, archive name or None, reason)."""
    # A doc can fail for several archives: count each doc only once.
    failed_docs = {doc_id for doc_id, _, _ in failures}
    total_docs = len(doc_ids)
    ok_docs = total_docs - len(failed_docs)
    print()
    print(f"{ok_docs}/{total_docs} document(s) OK")
    if failures:
        print("\nFailed documents:")
        for doc_id, name, reason in failures:
            print(f"  {doc_id}{f' ({name})' if name else ''}: {reason}")


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Upload every .tar archive of a folder into a list of Grist documents."
    )
    parser.add_argument("--docs", required=True, help="Text file with one docId per line")
    parser.add_argument("--folder", required=True, help="Folder containing the attachments .tar archives")
    parser.add_argument("--dry-run", action="store_true", help="Only check access to each doc, upload nothing")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    api_key = os.environ.get("GRIST_API_KEY")
    if not api_key:
        log.error("GRIST_API_KEY environment variable is not set")
        return 2

    if not os.path.isdir(args.folder):
        log.error("Folder not found: %s", args.folder)
        return 2
    archives = list_archives(args.folder)
    if not archives:
        log.error("No .tar file found in %s", args.folder)
        return 2
    invalid = [a for a in archives if not tarfile.is_tarfile(a)]
    if invalid:
        log.error("Not valid tar file(s): %s", ", ".join(invalid))
        return 2
    log.info("%d archive(s): %s", len(archives), ", ".join(os.path.basename(a) for a in archives))

    doc_ids = read_doc_ids(args.docs)
    if not doc_ids:
        log.error("No docId found in %s", args.docs)
        return 2

    server = SERVER
    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {api_key}"

    failures = []  # (doc_id, archive name or None, reason)
    for index, doc_id in enumerate(doc_ids, start=1):
        log.info("[%d/%d] %s", index, len(doc_ids), doc_id)
        try:
            log.info("  doc: %s", check_doc(session, server, doc_id))
        except (requests.RequestException, ValueError) as exc:
            log.error("  failed: %s", describe_error(exc))
            failures.append((doc_id, None, describe_error(exc)))
            continue
        if args.dry_run:
            continue

        for archive_index, archive in enumerate(archives):
            name = os.path.basename(archive)
            if archive_index > 0:  # no cooldown before the first archive of each document
                log.info("  cooldown %ds", COOLDOWN_SECONDS)
                time.sleep(COOLDOWN_SECONDS)
            try:
                result = restore_archive(session, server, doc_id, archive)
            except (requests.RequestException, ValueError) as exc:
                log.error("  %s failed: %s", name, describe_error(exc))
                failures.append((doc_id, name, describe_error(exc)))
                continue

            log.info("  %s: %s", name, result)
            if result.get("errored"):
                failures.append((doc_id, name, f"{result['errored']} file(s) errored"))

    print_script_results(doc_ids, failures)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
